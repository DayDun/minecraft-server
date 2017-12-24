const Stream = require("stream");

const Types = {
  varint: {
    read: function(buffer, offset) {
      let result = 0;
      let shift = 0;
      let cursor = offset;
      
      while (true) {
        if (cursor + 1 > buffer.length) {
          throw "loleut";
        }
        
        const b = buffer.readUInt8(cursor);
        result |= ((b & 0x7f) << shift); // Add the bits to our number, except MSB
        cursor++;
        if (!(b & 0x80)) { // If the MSB is not set, we return the number
          return {
            value: result,
            size: cursor - offset
          };
        }
        shift += 7; // we only have 7 bits, MSB being the return-trigger
        if (shift >= 64) { // Make sure our shift don't overflow
          throw "Varin is too big";
        }
      }
    },
    write: function(value, buffer, offset) {
      let cursor = 0;
      while(value & ~0x7F) {
        buffer.writeUInt8((value & 0xFF) | 0x80, offset + cursor);
        cursor++;
        value >>>= 7;
      }
      buffer.writeUInt8(value, offset + cursor);
      return offset + cursor + 1;
    },
    size: function(value) {
      let cursor = 0;
      while (value & ~0x7f) {
        value >>>= 7;
        cursor++;
      }
      return cursor + 1;
    }
  },
  i8: {
    read: function(buffer, offset) {
      if (offset + 1 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readInt8(offset);
      return {
        value: value,
        size: 1
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeInt8(value, offset);
      return offset + 1;
    },
    size: function(value) {
      return 1;
    }
  },
  u8: {
    read: function(buffer, offset) {
      if (offset + 1 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readUInt8(offset);
      return {
        value: value,
        size: 1
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeUInt8(value, offset);
      return offset + 1;
    },
    size: function(value) {
      return 1;
    }
  },
  i16: {
    read: function(buffer, offset) {
      if (offset + 2 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readInt16BE(offset);
      return {
        value: value,
        size: 2
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeInt16BE(value, offset);
      return offset + 2;
    },
    size: function(value) {
      return 2;
    }
  },
  u16: {
    read: function(buffer, offset) {
      if (offset + 2 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readUInt16BE(offset);
      return {
        value: value,
        size: 2
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeUInt16BE(value, offset);
      return offset + 2;
    },
    size: function(value) {
      return 2;
    }
  },
  i32: {
    read: function(buffer, offset) {
      if (offset + 4 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readInt32BE(offset);
      return {
        value: value,
        size: 4
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeInt32BE(value, offset);
      return offset + 4;
    },
    size: function(value) {
      return 4;
    }
  },
  u32: {
    read: function(buffer, offset) {
      if (offset + 4 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readUInt32BE(offset);
      return {
        value: value,
        size: 4
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeUInt32BE(value, offset);
      return offset + 4;
    },
    size: function(value) {
      return 4;
    }
  },
  i64: {
    read: function(buffer, offset) {
      if (offset + 8 > buffer.length) {
        throw "nigger";
      }
      const value = [buffer.readInt32BE(offset), buffer.readInt32BE(offset + 4)];
      return {
        value: value,
        size: 8
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeInt32BE(value[0], offset);
      buffer.writeInt32BE(value[1], offset + 4);
      return offset + 8;
    },
    size: function(value) {
      return 8;
    }
  },
  f32: {
    read: function(buffer, offset) {
      if (offset + 4 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readFloatBE(offset);
      return {
        value: value,
        size: 4
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeFloatBE(value, offset);
      return offset + 4;
    },
    size: function(value) {
      return 4;
    }
  },
  f64: {
    read: function(buffer, offset) {
      if (offset + 8 > buffer.length) {
        throw "nigger";
      }
      const value = buffer.readDoubleBE(offset);
      return {
        value: value,
        size: 8
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeDoubleBE(value, offset);
      return offset + 8;
    },
    size: function(value) {
      return 8;
    }
  },
  boolean: {
    read: function(buffer, offset) {
      return {
        value: buffer.readUInt8(offset) !== 0,
        size: 1
      };
    },
    write: function(value, buffer, offset) {
      buffer.writeUInt8(value ? 1 : 0, offset);
      return offset + 1;
    },
    size: function(value) {
      return 1;
    }
  },
  string: {
    read: function(buffer, offset) {
      let length = Types.varint.read(buffer, offset);
      
      return {
        value: buffer.toString("utf8", offset + length.size, offset + length.size + length.value),
        size: length.size + length.value
      }
    },
    write: function(value, buffer, offset) {
      let length = Buffer.byteLength(value, "utf8");
      let cursor = Types.varint.write(length, buffer, offset);
      buffer.write(value, cursor, cursor + length, "utf8");
      return cursor + length;
    },
    size: function(value) {
      let length = Buffer.byteLength(value, "utf8");
      return Types.varint.size(length) + length;
    }
  },
  varintbytearray: {
    read: function(buffer, offset) {
      let length = Types.varint.read(buffer, offset);
      
      let output = Buffer.alloc(length.value);
      for (let i=0; i<length.value; i++) {
        output.writeUInt8(buffer.readUInt8(offset + length.size + i), i);
      }
      
      return {
        value: output,
        size: length.size + length.value
      }
    },
    write: function(value, buffer, offset) {
      let cursor = Types.varint.write(value.length, buffer, offset);
      for (let i=0; i<value.length; i++) {
        buffer.writeUInt8(value.readUInt8(i), cursor + i);
      }
      return cursor + value.length;
    },
    size: function(value) {
      return Types.varint.size(value.length) + value.length;
    }
  },
  restbuffer: {
    read: function(buffer, offset) {
      return {
        value: buffer.slice(offset),
        size: buffer.length - offset
      };
    },
    write: function(value, buffer, offset) {
      for (let i=0; i<value.length; i++) {
        buffer.writeUInt8(value.readUInt8(i), offset + i);
      }
      return offset + value.length;
    },
    size: function(value) {
      return value.length;
    }
  },
  position: {
    read: function(buffer, offset) {
      return {
        value: {
          x: buffer.readInt32BE(offset) >>> 6,
          y: (buffer.readInt16BE(offset + 3) >>> 2) & 0b00111111111111,
          z: buffer.readInt32BE(offset + 4) & 0b00000011111111111111111111111111
        },
        size: 8
      }
    },
    write: function(value, buffer, offset) {
      buffer.writeInt32BE((value.x & 0x3FFFFFF) << 6 | (value.y >>> 6), offset);
      buffer.writeInt32BE(((value.y & 0b111111) << 26) | (value.z & 0x3FFFFFF), offset + 4);
      return offset + 8;
    },
    size: function(value) {
      return 8;
    }
  },
  nbt: {
    read: function(buffer, offset) {
			
		},
		write: function(value, buffer, offset) {
			
		},
		size: function(value) {
			
		}
	},
  varintnbt: {
    read: function(buffer, offset) {
			
		},
		write: function(value, buffer, offset) {
			let length = Types.varint.write(value.length, buffer, offset);
      return offset + length.size;
		},
		size: function(value) {
			return Types.varint.size(value.length);
		}
  },
	slot: {
    read: function(buffer, offset) {
			let itemId = buffer.readInt16BE(offset);
			if (itemId == -1) {
				return {
					value: {
						itemId: itemId
					},
					size: 2
				};
			} else if (buffer.readInt8(offset + 3) === 0) {
				return {
					value: {
						itemId: itemId,
						itemCount: buffer.readInt8(offset + 2)
					},
					size: 3
				};
			} else {
				let nbt = Types.nbt.read(buffer, offset + 3);
				return {
					value: {
						itemId: itemId,
						itemCount: buffer.readInt8(offset + 2),
						nbt: nbt.value
					},
					size: 3 + nbt.size
				};
			}
		},
		write: function(value, buffer, offset) {
			
		},
		size: function(value) {
			
		}
  }
};

const Packets = {
  handshake: {
    toClient: {},
    toServer: {
      0x00: {
        name: "setState",
        definition: [
          {name: "protocolVersion", type: "varint"},
          {name: "serverHost", type: "string"},
          {name: "serverPort", type: "u16"},
          {name: "nextState", type: "varint"}
        ]
      }
    }
  },
  status: {
    toClient: {
      0x00: {
        name: "serverInfo",
        definition: [
          {name: "response", type: "string"}
        ]
      },
      0x01: {
        name: "pong",
        definition: [
          {name: "time", type: "i64"}
        ]
      }
    },
    toServer: {
      0x00: {
        name: "pingStart",
        definition: []
      },
      0x01: {
        name: "ping",
        definition: [
          {name: "time", type: "i64"}
        ]
      }
    }
  },
  login: {
    toClient: {
      0x00: {
        name: "disconnect",
        definition: [
          {name: "reason", type: "string"}
        ]
      },
      0x01: {
        name: "encryptionRequest",
        definition: [
          {name: "serverId", type: "string"},
          {name: "publicKey", type: "varintbytearray"},
          {name: "verifyToken", type: "varintbytearray"}
        ]
      },
      0x02: {
        name: "loginSuccess",
        definition: [
          {name: "uuid", type: "string"},
          {name: "username", type: "string"}
        ]
      }
    },
    toServer: {
      0x00: {
        name: "loginStart",
        definition: [
          {name: "username", type: "string"}
        ]
      },
      0x01: {
        name: "encryptionResponse",
        definition: [
          {name: "sharedSecret", type: "varintbytearray"},
          {name: "verifyToken", type: "varintbytearray"}
        ]
      }
    }
  },
  play: {
    toClient: {
      0x21: {
        name: "chunkData",
        definition: [
          {name: "chunkX", type: "i32"},
          {name: "chunkY", type: "i32"},
          {name: "groundUp", type: "boolean"},
          {name: "primaryBitMask", type: "varint"},
          {name: "data", type: "varintbytearray"},
          {name: "blockEntities", type: "varintnbt"}
        ]
      },
      0x24: {
        name: "joinGame",
        definition: [
          {name: "entityId", type: "i32"},
          {name: "gamemode", type: "u8"},
          {name: "dimension", type: "i32"},
          {name: "difficulty", type: "u8"},
          {name: "maxPlayers", type: "u8"},
          {name: "levelType", type: "string"},
          {name: "reducedDebugInfo", type: "boolean"}
        ]
      },
      0x30: {
        name: "position",
        definition: [
          {name: "x", type: "f64"},
          {name: "y", type: "f64"},
          {name: "z", type: "f64"},
          {name: "yaw", type: "f32"},
          {name: "pitch", type: "f32"},
          {name: "flags", type: "i8"},
          {name: "teleportId", type: "varint"}
        ]
      },
      0x47: {
        name: "spawnPosition",
        definition: [
          {name: "location", type: "position"}
        ]
      }
    },
    toServer: {
      0x00: {
        name: "teleportConfirm",
        definition: [
          {name: "teleportId", type: "varint"}
        ]
      },
      0x01: {
        name: "chatMessage",
        definition: [
          {name: "message", type: "string"}
        ]
      },
      0x02: {
        name: "clientStatus",
        definition: [
          {name: "actionId", type: "varint"}
        ]
      },
      0x03: {
        name: "clientSettings",
        definition: [
          {name: "locale", type: "string"},
          {name: "viewDistance", type: "i8"},
          {name: "chatMode", type: "varint"},
          {name: "chatColors", type: "boolean"},
          {name: "displayedSkinParts", type: "u8"},
          {name: "mainHand", type: "varint"}
        ]
      },
      0x07: {
        name: "clickWindow",
        definition: [
          {name: "windowId", type: "u8"},
          {name: "slot", type: "i16"},
          {name: "button", type: "i8"},
          {name: "actionNumber", type: "i16"},
          {name: "mode", type: "varint"},
          {name: "clickedItem", type: "slot"}
        ]
      },
			0x08: {
				name: "closeWindow",
				definition: [
					{name: "windowId", type: "u8"}
				]
			},
      0x09: {
        name: "pluginMessage",
        definition: [
          {name: "channel", type: "string"},
          {name: "data", type: "restbuffer"}
        ]
      },
			0x0e: {
				name: "positionLook",
				definition: [
					{name: "x", type: "f64"},
					{name: "y", type: "f64"},
					{name: "z", type: "f64"},
					{name: "yaw", type: "f32"},
					{name: "pitch", type: "f32"},
					{name: "onGround", type: "boolean"}
				]
			},
      0x17: /*incomplete*/ {
        name: "craftingBookData",
        definition: [
          {name: "type", type: "varint"}
        ]
      }
    }
  }
};

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