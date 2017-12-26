const Long = require("long");

const Types = require("./types");

const BITS_PER_BLOCK = 13;

class ChunkSection {
  constructor() {
    this.data = Buffer.alloc(2 * 4096);
  }
  
  getSize() {
    let palette = this.getPalette();
    
    let dataLength = Math.max(Math.ceil(Math.log2(palette.length)), 1) * 64;
    let size = 1;
    size += Types.array.size(palette, {type: "varint", countType: "varint"});
    size += Types.varint.size(dataLength) + dataLength * 8;
    size += 4096;
    
    return size;
  }
  
  getPalette() {
    let palette = [];
    for (let i=0; i<4096 * 2; i+=2) {
      let id = this.data.readUInt16BE(i);
      if (!palette.includes(id)) {
        palette.push(id);
      }
    }
    return palette;
  }
  
  setBlock(x, y, z, block) {
    this.data.writeUInt16BE(block, (x + (z * 16) + (y * 256)) * 2);
  }
  
  getBlock(x, y, z) {
    return this.data.readUInt16BE((x + (z * 16) + (y * 256)) * 2);
  }
}

class Chunk {
  constructor(data) {
    this.sections = [];
    for (let i=0; i<16; i++) {
      this.sections[i] = new ChunkSection();
    }
    this.blockEntities = [];
  }
  
  generate(chunkX, chunkZ, generator) {
    for (let y=0; y<256; y++) {
      for (let z=0; z<16; z++) {
        for (let x=0; x<16; x++) {
          this.setBlock(x, y, z, generator(chunkX * 16 + x, y, chunkZ * 16 + z));
        }
      }
    }
  }
  
  setBlock(x, y, z, block) {
    this.sections[Math.floor(y / 16)].setBlock(x, y % 16, z, block);
  }
  
  getBlock(x, y, z) {
    return this.sections[Math.floor(y / 16)].getBlock(x, y % 16, z);
  }
  
  getData(bitMask) {
    let size = 0;
    for (let i=0; i<16; i++) {
      size += this.sections[i].getSize();
    }
    let buffer = Buffer.alloc(size + 256);
    
    let cursor = 0;
    
    for (let i=0; i<16; i++) {
      let palette = this.sections[i].getPalette();
      let bitsPerBlock = Math.max(Math.ceil(Math.log2(palette.length)), 1);
      let valueMask = (1 << bitsPerBlock) - 1;
      
      cursor = Types.u8.write(bitsPerBlock, buffer, cursor);
      
      // Palette
      cursor = Types.array.write(palette, buffer, cursor, {type: "varint", countType: "varint"});
      
      // Data Array
      cursor = Types.varint.write(bitsPerBlock * 64, buffer, cursor);
      let workLong = new Long(0);
      let currentLong = 0;
      for (let y=0; y<16; y++) {
        for (let z=0; z<16; z++) {
          for (let x=0; x<16; x++) {
            let blockNumber = (y * 16 + z) * 16 + x;
            let startLong = Math.floor((blockNumber * bitsPerBlock) / 64);
            let startOffset = (blockNumber * bitsPerBlock) % 64;
            let endLong = Math.floor(((blockNumber + 1) * bitsPerBlock - 1) / 64);
            
            if (startLong != currentLong) {
              // We've finished one long at the border.  Write it and start another.
              cursor = Types.i64.write([workLong.getHighBitsUnsigned(), workLong.getLowBitsUnsigned()], buffer, cursor);
              workLong = new Long(0);
              currentLong = startLong;
            }
            
            let value = new Long(this.getBlock(x, i * 16 + y, z));
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
      // bug? plz fix
      cursor += 8;
      
      // Block light
      for (let y=0; y<16; y++) {
        for (let z=0; z<16; z++) {
          for (let x=0; x<16; x+=2) {
            let blockLight1 = 15;
            let blockLight2 = 15;
            cursor = Types.u8.write(blockLight1 | (blockLight2 << 4), buffer, cursor);
          }
        }
      }
      
      // Sky light
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
    
    // Biome data
    for (let z=0; z<16; z++) {
      for (let x=0; x<16; x++) {
        cursor = Types.u8.write(127, buffer, cursor);
      }
    }
    return buffer;
  }
}

module.exports = Chunk;