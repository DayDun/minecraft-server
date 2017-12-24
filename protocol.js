const Stream = require("stream");

const Types = require("./types");

const Packets = require("./packets");

function serialize(packet, data, state) {
  let packetId;
  // Figure out what id the packet has
  for (let i in Packets[state].toClient) {
    if (Packets[state].toClient[i].name == packet) {
      packetId = parseInt(i);
      break;
    }
  }
  let length = Types.varint.size(packetId);
  let pack = Packets[state].toClient[packetId];
  let orderedData = [];
  // Order the data and get length of all data (length of packet)
  for (let i=0; i<pack.definition.length; i++) {
    for (let j in data) {
      if (pack.definition[i].name == j) {
        orderedData.push(data[j]);
        length += Types[pack.definition[i].type].size(data[j]);
        break;
      }
    }
  }
  
  let buffer = Buffer.alloc(Types.varint.size(length) + length);
  let offset = 0;
  offset = Types.varint.write(length, buffer, offset);
  offset = Types.varint.write(packetId, buffer, offset);
  for (let i=0; i<pack.definition.length; i++) {
    offset = Types[pack.definition[i].type].write(orderedData[i], buffer, offset);
  }
  console.log("serialize", length, buffer);
  return buffer;
}

class Deserializer extends Stream.Writable {
  constructor(client) {
    super();
    this.client = client;
  }
  
  _write(buffer, encoding, done) {
    if (buffer.readUInt8(0) == 0xFE) {
      console.log("Legacy");
      return [];
    } else {
      console.log(buffer);
      let offset = 0;
      
      while (offset < buffer.length) {
        let length = Types.varint.read(buffer, offset);
        offset += length.size;
        let packetId = Types.varint.read(buffer, offset);
        offset += packetId.size;
        console.log(packetId.value);
        let packet = Packets[this.client.state].toServer[packetId.value];

        let output = {};

        for (let i=0; i<packet.definition.length; i++) {
          let def = packet.definition[i];

          let parsed = Types[def.type].read(buffer, offset);
          offset += parsed.size;

          output[def.name] = parsed.value;
        }
        this.client.emit(packet.name, output);
        console.log(packet.name, output);
        if (packet.name == "setState") {
          this.client.state = ["handshake", "status", "login", "play"][output.nextState];
        }
      }
    }
    done();
  }
}

module.exports = {
  serialize: serialize,
  Deserializer: Deserializer
};