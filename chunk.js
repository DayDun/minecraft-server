const Long = require("long");

const Types = require("./types");

const BITS_PER_BLOCK = 13;

class ChunkSection {
  constructor() {
    
  }
}

class Chunk {
  constructor(x, y, sections, blockEntities) {
    this.x = x;
    this.y = y;
    this.sections = sections;
    for (let i=0; i<16; i++) {
      if (!this.sections[i]) {
        this.sections[i] = new ChunkSection();
      }
    }
    this.blockEntities = blockEntities;
    
    this.data = Buffer.alloc((16 * 256 * 16) * 3)
  }
  
  setBlock() {
    
  }
  
  getData(bitMask) {
    let palette = [0, 33, 1, 3185, 4, 102, 103, 155, 82, 2, 6];
    var bpb = Math.ceil(Math.log2(palette.length));
    
    let valueMask = (1 << bpb) - 1;
    let dataLength = 64 * bpb;
    let buffer = Buffer.alloc((1 + Types.array.size(palette, {type: "varint", countType: "varint"}) + (Types.varint.size(dataLength) + dataLength * 8) + 2048 + 2048) * 1 + 256);
    let cursor = 0;
    
    for (let i=0; i<1; i++) {
      cursor = Types.u8.write(bpb, buffer, cursor);
      
      // Palette
      cursor = Types.array.write(palette, buffer, cursor, {type: "varint", countType: "varint"});
      
      // Data Array
      cursor = Types.varint.write(dataLength, buffer, cursor);
      let workLong = new Long(0);
      let currentLong = 0;
      for (let y=0; y<16; y++) {
        for (let z=0; z<16; z++) {
          for (let x=0; x<16; x++) {
            let blockNumber = (y * 16 + z) * 16 + x;
            let startLong = Math.floor((blockNumber * bpb) / 64);
            let startOffset = (blockNumber * bpb) % 64;
            let endLong = Math.floor(((blockNumber + 1) * bpb - 1) / 64);
            
            if (startLong != currentLong) {
              // We've finished one long at the border.  Write it and start another.
              cursor = Types.i64.write([workLong.getHighBitsUnsigned(), workLong.getLowBitsUnsigned()], buffer, cursor);
              workLong = new Long(0);
              currentLong = startLong;
            }
            
            let value = new Long(Math.random() < 0.25 ? Math.floor(Math.random() * 11) : 0);
            value = value.and(valueMask);
            
            workLong = workLong.or(value.shiftLeft(startOffset));
            
            if (startLong != endLong) {
              // We've finished part of one long; write it and start the next.
              cursor = Types.i64.write([workLong.getHighBitsUnsigned(), workLong.getLowBitsUnsigned()], buffer, cursor);
              currentLong = endLong;
              
              workLong = value.shiftRight(64 - startOffset);
            }
          }
        }
      }
      cursor += 8;
      console.log(currentLong);
      
      for (let y=0; y<16; y++) {
        for (let z=0; z<16; z++) {
          for (let x=0; x<16; x+=2) {
            let blockLight1 = 15;
            let blockLight2 = 15;
            cursor = Types.u8.write(blockLight1 | (blockLight2 << 4), buffer, cursor);
          }
        }
      }

      for (let y=0; y<16; y++) {
        for (let z=0; z<16; z++) {
          for (let x=0; x<16; x+=2) {
            let skyLight1 = 15;
            let skyLight2 = 15;
            cursor = Types.u8.write(skyLight1 | (skyLight2 << 4), buffer, cursor);
          }
        }
      }
    }
    
    for (let z=0; z<16; z++) {
      for (let x=0; x<16; x++) {
        cursor = Types.u8.write(127, buffer, cursor);
      }
    }
    return buffer;
  }
}

module.exports = Chunk;