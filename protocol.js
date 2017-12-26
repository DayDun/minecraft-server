const Stream = require("stream");
const Zlib = require("zlib");

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
        length += Types[pack.definition[i].type].size(data[j], pack.definition[i].options);
        break;
      }
    }
  }
  
  let buffer = Buffer.alloc(length);
  let offset = 0;
  offset = Types.varint.write(packetId, buffer, offset);
  for (let i=0; i<pack.definition.length; i++) {
    offset = Types[pack.definition[i].type].write(orderedData[i], buffer, offset, pack.definition[i].options);
  }
  //console.log("serialize", length, buffer);
  return buffer;
}

class Deserializer extends Stream.Writable {
  constructor(client) {
    super();
    this.client = client;
  }
  
  _write(buffer, encoding, done) {
    function parse(attribute, buf, output, offset) {
      let cursor = offset;
      
      if (attribute.type == "switch") {
        let items = attribute.frames[output[attribute.compareTo]];
        console.log(items);
        for (let j=0; j<items.length; j++) {
          let result = parse(items[j], output, cursor);
          cursor = result.offset;
          output = result.output;
        }
      } else {
        let parsed = Types[attribute.type].read(buf, cursor, attribute.options);
        cursor += parsed.size;

        output[attribute.name] = parsed.value;
      }
      
      return {
        offset: cursor,
        output: output
      };
    }
    
    if (this.client.state == "handshake" && buffer.readUInt8(0) == 0xFE) {
      console.log("Legacy");
      return [];
    } else {
      //console.log(buffer);
      let offset = 0;
      
      while (offset < buffer.length) {
        let resume = function(buf) {
          let packetId = Types.varint.read(buf, offset);
          offset += packetId.size;
          //console.log(packetId.value);
          let packet = Packets[this.client.state].toServer[packetId.value];

          let output = {};

          for (let i=0; i<packet.definition.length; i++) {
            let result = parse(packet.definition[i], buf, output, offset);
            offset = result.offset;
            output = result.output;
          }
          this.client.emit(packet.name, output);
          if (!["position", "positionLook", "look"].includes(packet.name)) {
            console.log(packet.name, output);
          }
          if (packet.name == "setState") {
            this.client.state = ["handshake", "status", "login", "play"][output.nextState];
          }
        }.bind(this);
        
        let length = Types.varint.read(buffer, offset);
        offset += length.size;
        if (this.client.compressionThreshold != -1) {
          let dataLength = Types.varint.read(buffer, offset);
          offset += dataLength.size;
          if (dataLength.value !== 0) {
            let result = Zlib.gunzipSync(buffer.slice(offset, offset + dataLength.value));
            offset = 0;
            resume(result);
          } else {
            resume(buffer);
          }
        } else {
          resume(buffer);
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