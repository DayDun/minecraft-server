const Chunk = require("./chunk");

class World {
  constructor() {
    this.chunks = {};
  }
  
  getChunk(chunkX, chunkZ) {
    if (!([chunkX, chunkZ] in this.chunks)) {
      let chunk = new Chunk();
      chunk.generate(chunkX, chunkZ, function(x, y, z) {
        return y < (Math.sin(Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2))) * 16 + 64) ? 1 : 0;
      });
      
      this.chunks[[chunkX, chunkZ]] = chunk;
    }
    return this.chunks[[chunkX, chunkZ]];
  }
}

module.exports = World;