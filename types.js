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
  bytearray: {
    read: function(buffer, offset, options) {
      let length = Types[options.countType].read(buffer, offset);
      
      let output = Buffer.alloc(length.value);
      for (let i=0; i<length.value; i++) {
        output.writeUInt8(buffer.readUInt8(offset + length.size + i), i);
      }
      
      return {
        value: output,
        size: length.size + length.value
      }
    },
    write: function(value, buffer, offset, options) {
      let cursor = Types[options.countType].write(value.length, buffer, offset);
      for (let i=0; i<value.length; i++) {
        buffer.writeUInt8(value.readUInt8(i), cursor + i);
      }
      return cursor + value.length;
    },
    size: function(value, options) {
      return Types[options.countType].size(value.length) + value.length;
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
  },
	array: {
    read: function(buffer, offset, options) {
			let length = Types[options.countType].read(buffer, offset);
			let cursor = offset + length.size;
			let output = [];
			for (let i=0; i<length.value; i++) {
				let val = Types[options.type].read(buffer, cursor);
				output.push(val.value);
				cursor += val.size;
			}
			return {
				value: output,
				size: cursor - offset
			};
		},
		write: function(value, buffer, offset, options) {
			let cursor = Types[options.countType].write(value.length, buffer, offset);
			for (let i=0; i<value.length; i++) {
				cursor = Types[options.type].write(value[i], buffer, cursor);
			}
      return cursor;
		},
		size: function(value, options) {
			let length = Types[options.countType].size(value.length);
			for (let i=0; i<value.length; i++) {
				length += Types[options.type].size(value[i]);
			}
			return length;
		}
	}
};

module.exports = Types;