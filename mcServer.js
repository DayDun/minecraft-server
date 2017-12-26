const EventEmitter = require("events");
const Net = require("net");
const Https = require("https");
const NodeRSA = require("node-rsa");
const Crypto = require("crypto");
const Zlib = require("zlib");
const Long = require("long");

const Types = require("./types");
const Protocol = require("./protocol");
const Chunk = require("./chunk");
const World = require("./world");


/*let data = (new Chunk(0, 0, [], [])).getData();
let string = data.slice(data.length - 100, data.length).toString("hex");
console.log(string);
let output = "";
for (let i=0; i<string.length; i+=2) {
  output += ("00000000" + parseInt(string.substr(i, 2), 16).toString(2)).slice(-8) + " ";
}
console.log(output);*/

function bufferEqual(a, b) {
  if (a.length != b.length) {
    return false;
  }
  for (let i=0; i<a.length; i++) {
    if (a.readUInt8(i) != b.readUInt8(i)) {
      return false;
    }
  }
  return true;
}

const States = {
  HANDSHAKE: "handshake",
  STATUS: "status",
  LOGIN: "login",
  PLAY: "play"
};


class Client extends EventEmitter {
  constructor(server, socket) {
    super();
    
    this.server = server;
    this.socket = socket;
    this.state = States.HANDSHAKE;
    
    this.compressionThreshold = -1;
    
    this.deserializer = new Protocol.Deserializer(this);
    
    this.id = this.server.nextId++;
    this.server.clients[this.id] = this;
    
    this.socket.pipe(this.deserializer);
    this.socket.setNoDelay(true);
    this.socket.on("connect", function() {
      this.emit("connect");
    }.bind(this));
    this.socket.on("close", function() {
      this.end();
    }.bind(this));
    
    this.on("pingStart", function(data) {
      this.write("serverInfo", {
        response: JSON.stringify({
          version: {
            name: "17w50a",
            protocol: 351
          },
          players: {
            max: 100,
            online: 0,
            sample: [
              {
                name: "u mom gay",
                id: "00000000-0000-0000-0000-000000000000"
              }
            ]
          },
          description: {
            text: "Bob"
          }
        })
      });
    }.bind(this));
    this.on("ping", function(data) {
      this.write("pong", {
        time: data.time
      });
      this.socket.end();
    }.bind(this));
    
    let serverId;
    this.on("loginStart", function(data) {
      this.username = data.username;
      serverId = Crypto.randomBytes(4).toString("hex");
      this.verifyToken = Crypto.randomBytes(4);
      this.publicKey = new Buffer(this.server.serverKey.exportKey("pkcs8-public-pem").split("\n").slice(1, -1).join(""), "base64");
      this.write("encryptionRequest", {
        serverId: serverId,
        publicKey: this.publicKey,
        verifyToken: this.verifyToken
      });
    }.bind(this));
    this.on("encryptionResponse", function(data) {
      let sharedSecret;
      try {
        const verifyToken = Crypto.privateDecrypt({
          key: this.server.serverKey.exportKey(),
          padding: Crypto.constants.RSA_PKCS1_PADDING
        }, data.verifyToken);
        if(!bufferEqual(this.verifyToken, verifyToken)) {
          this.end(JSON.stringify({text: "DidNotEncryptVerifyTokenProperly"}));
          return;
        }
        sharedSecret = Crypto.privateDecrypt({
          key: this.server.serverKey.exportKey(),
          padding: Crypto.constants.RSA_PKCS1_PADDING
        }, data.sharedSecret);
      } catch(e) {
        this.end(JSON.stringify({text: "DidNotEncryptVerifyTokenProperly"}));
        return;
      }
      
      this.sharedSecret = sharedSecret;
      
      this.cipher = Crypto.createCipheriv("aes-128-cfb8", sharedSecret, sharedSecret);
      this.cipher.pipe(this.socket);
      this.decipher = Crypto.createDecipheriv("aes-128-cfb8", sharedSecret, sharedSecret);
      this.socket.unpipe(this.deserializer);
      this.socket.pipe(this.decipher).pipe(this.deserializer);
      
      // Verify user
      let hash = Crypto.createHash("sha1").update(serverId).update(sharedSecret).update(this.publicKey).digest();
      let negative = hash.readInt8(0) < 0;
      if (negative) {
        let carry = true;
        for (let i=hash.length - 1; i>=0; --i) {
          let value = hash.readUInt8(i);
          let newByte = ~value & 0xff;
          if (carry) {
            carry = newByte === 0xff;
            hash.writeUInt8(carry ? 0 : (newByte + 1), i);
          } else {
            hash.writeUInt8(newByte, i);
          }
        }
      }
      hash = hash.toString("hex").replace(/^0+/g, "");
      if (negative) {
        hash = "-" + hash;
      }
      Https.get("https://sessionserver.mojang.com/session/minecraft/hasJoined?username=" + this.username + "&serverId=" + hash + "&ip=" + this.socket.remoteAddress, function(res) {
        res.setEncoding("utf8");
        res.on("data", function(data) {
          let profile = JSON.parse(data);
          this.uuid = profile.id.replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, "$1-$2-$3-$4-$5");
          this.profile = profile;
          
          login();
        }.bind(this));
      }.bind(this)).on("error", function(error) {
        console.log(error);
      });
      
      let login = function() {
        this.write("setCompression", {
          threshold: 256
        });
        this.compressionThreshold = 256
        
        this.write("loginSuccess", {
          uuid: this.uuid,
          username: this.username
        });
        this.state = States.PLAY;
        this.emit("login");
      }.bind(this);
    }.bind(this));
    
    this.on("login", function() {
      this.write("joinGame", {
        entityId: 0,
        gamemode: 1,
        dimension: 0,
        difficulty: 0,
        maxPlayers: 100,
        levelType: "default",
        reducedDebugInfo: false
      });
      
      this.write("position", {
        x: 8,
        y: 8,
        z: 8,
        yaw: 0,
        pitch: 0,
        flags: 0x00000,
        teleportId: 0
      });
      this.write("spawnPosition", {
        location: {
          x: 0,
          y: 0,
          z: 0
        }
      });
      let inv = new Array(45).fill({itemId: -1});
      inv[36] = {
        itemId: 1,
        itemCount: 64
      };
      this.write("windowItems", {
        windowId: 0,
        slots: inv
      });
      
      for (let z=-6; z<=6; z++) {
        for (let x=-6; x<=6; x++) {
          this.write("chunkData", {
            chunkX: x,
            chunkZ: z,
            groundUp: true,
            primaryBitMask: 0b1111111111111111,
            data: this.server.world.getChunk(x, z).getData(0b1111111111111111),
            blockEntities: this.server.world.getChunk(x, z).blockEntities
          });
        }
      }
      
      let time = new Long(0);
      let interval = setInterval(function() {
        time = time.add(20);
        this.write("timeUpdate", {
          worldAge: [time.getHighBitsUnsigned(), time.getLowBitsUnsigned()],
          timeOfDay: [time.getHighBitsUnsigned(), time.getLowBitsUnsigned()]
        });
      }.bind(this), 1000);
      
      this.on("chatMessage", function(data) {
        this.write("chatMessage", {
          data: JSON.stringify({text: "<" + this.username + "> " + data.message}),
          position: 0
        });
      }.bind(this));
      
      this.on("end", function() {
        clearInterval(interval);
      });
      
      /*this.write("blockChange", {
        location: {
          x: 8,
          y: 0,
          z: 8
        },
        blockId: 1
      });*/
    }.bind(this));
  }
  
  write(packet, data) {
    let pack = Protocol.serialize(packet, data, this.state);
    if (this.compressionThreshold != -1) {
      // Wow this is ugly, please fix
      let pack2;
      if (pack.length >= this.compressionThreshold) {
        let result = Zlib.deflateSync(pack);
        pack2 = Buffer.concat([Buffer.alloc(Types.varint.size(Types.varint.size(pack.length) + result.length) + Types.varint.size(pack.length)), result]);
        let offset = Types.varint.write(Types.varint.size(pack.length) + result.length, pack2, 0);
        Types.varint.write(pack.length, pack2, offset);
      } else {
        pack2 = Buffer.concat([Buffer.alloc(Types.varint.size(1 + pack.length) + 1), pack]);
        Types.varint.write(1 + pack.length, pack2, 0);
      }
      
      if (this.cipher) {
        this.cipher.write(pack2);
      } else {
        this.socket.write(pack2);
      }
    } else {
      let length = pack.length;
      pack = Buffer.concat([Buffer.alloc(Types.varint.size(length)), pack]);
      Types.varint.write(length, pack, 0);
      if (this.cipher) {
        this.cipher.write(pack);
      } else {
        this.socket.write(pack);
      }
    }
  }
  
  end(reason) {
    if (!this.socket.destroyed) {
      if (this.state == States.PLAY) {
        this.write("kick_disconnect", {reason: reason});
      } else if (this.state == States.LOGIN) {
        this.write("disconnect", {reason: reason});
      }
    }
    
    delete this.server.clients[this.id];
    
    this.emit("end");
  }
}


class Server extends EventEmitter {
  constructor(options) {
    super();
    
    this.host = options.host || "0.0.0.0";
    this.port = options.port || 25566;
    this.online = options.online || true;
    
    this.serverKey = new NodeRSA({b: 1024});
    
    this.socketServer = null;
    
    this.clients = [];
    this.nextId = 0;
    
    this.world = new World();
    
    this.listen(this.port, this.host);
  }
  
  listen(port, host) {
    this.socketServer = Net.createServer();
    this.socketServer.on("connection", function(socket) {
      let client = new Client(this, socket);
      
      this.emit("connection", client);
    }.bind(this));
    this.socketServer.on("error", function(err) {
      this.emit("error", err);
    }.bind(this));
    this.socketServer.on("close", function() {
      this.emit("close");
    }.bind(this));
    this.socketServer.on("listening", function() {
      this.emit("listening");
    }.bind(this));
    this.socketServer.listen(port, host);
  }
}

let server = new Server({
  online: false,
  host: "0.0.0.0",
  port: 25566
});