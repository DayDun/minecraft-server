module.exports = {
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
          {name: "publicKey", type: "bytearray", options: {countType: "varint"}},
          {name: "verifyToken", type: "bytearray", options: {countType: "varint"}}
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
          {name: "sharedSecret", type: "bytearray", options: {countType: "varint"}},
          {name: "verifyToken", type: "bytearray", options: {countType: "varint"}}
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
          {name: "data", type: "bytearray", options: {countType: "varint"}},
          {name: "blockEntities", type: "array", options: {countType: "varint", type: "nbt"}}
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
			0x0d: {
				name: "position",
				definition: [
					{name: "x", type: "f64"},
					{name: "y", type: "f64"},
					{name: "z", type: "f64"},
					{name: "onGround", type: "boolean"}
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
			0x0f: {
				name: "look",
				definition: [
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