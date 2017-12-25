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
      0x0b: {
        name: "blockChange",
        definition: [
          {name: "location", type: "position"},
          {name: "blockId", type: "varint"}
        ]
      },
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
      },
      0x48: {
        name: "timeUpdate",
        definition: [
          {name: "worldAge", type: "i64"},
          {name: "timeOfDay", type: "i64"}
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
      0x04: {
        name: "tabComplete",
        definition: [
          {name: "transactionId", type: "varint"},
          {name: "text", type: "string"}
        ]
      },
      0x05: {
        name: "confirmTransaction",
        definition: [
          {name: "windowId", type: "i8"},
          {name: "actionNumber", type: "i16"},
          {name: "accepted", type: "boolean"}
        ]
      },
      0x06: {
        name: "enchantItem",
        definition: [
          {name: "windowId", type: "i8"},
          {name: "enchantment", type: "i8"}
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
      0x0a: {
        name: "useEntity",
        definition: [
          {name: "target", type: "varint"},
          {name: "type", type: "varint"},
          {name: "targetX", type: "f32"},
          {name: "targetY", type: "f32"},
          {name: "targetZ", type: "f32"},
          {name: "hand", type: "varint"}
        ]
      },
      0x0b: {
        name: "keepAlive",
        definition: [
          {name: "keepAliveId", type: "i64"}
        ]
      },
      0x0c: {
        name: "player",
        definition: [
          {name: "onGround", type: "boolean"}
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
      0x10: {
        name: "vehicleMove",
        definition: [
          {name: "x", type: "f64"},
          {name: "y", type: "f64"},
          {name: "z", type: "f64"},
          {name: "yaw", type: "f32"},
          {name: "pitch", type: "f32"}
        ]
      },
      0x11: {
        name: "steerBoat",
        definition: [
          {name: "rightPaddleTurning", type: "boolean"},
          {name: "leftPaddleTurning", type: "boolean"}
        ]
      },
      0x12: {
        name: "craftRecipeRequest",
        definition: [
          {name: "windowId", type: "i8"},
          {name: "recipe", type: "varint"},
          {name: "makeAll", type: "boolean"}
        ]
      },
      0x13: {
        name: "playerAbilities",
        definition: [
          {name: "flags", type: "i8"},
          {name: "flyingSpeed", type: "f32"},
          {name: "walkingSpeed", type: "f32"}
        ]
      },
      0x14: {
        name: "playerDigging",
        definition: [
          {name: "status", type: "varint"},
          {name: "location", type: "position"},
          {name: "face", type: "i8"}
        ]
      },
      0x15: {
        name: "entityAction",
        definition: [
          {name: "entityId", type: "varint"},
          {name: "actionId", type: "varint"},
          {name: "jumpBoost", type: "varint"}
        ]
      },
      0x16: {
        name: "steerVehicle",
        definition: [
          {name: "sideways", type: "f32"},
          {name: "forward", type: "f32"},
          {name: "flags", type: "u8"}
        ]
      },
      0x17: {
        name: "craftingBookData",
        definition: [
          {name: "type", type: "varint"},
          {type: "switch", compareTo: "type", frames: {
            0: [
              {name: "recipeId", type: "i32"}
            ],
            1: [
              {name: "craftingBookOpen", type: "boolean"},
              {name: "craftingFilter", type: "boolean"}
            ]
          }}
        ]
      },
      0x18: {
        name: "resourcePackStatus",
        definition: [
          {name: "result", type: "varint"}
        ]
      },
      0x19: {
        name: "advancementTab",
        definition: [
          {name: "action", type: "varint"},
          {type: "switch", compareTo: "action", frames: {
            0: [
              {name: "tabId", type: "string"}
            ],
            1: []
          }}
        ]
      },
      0x1a: {
        name: "heldItemChange",
        definition: [
          {name: "slot", type: "i16"}
        ]
      },
      0x1b: {
        name: "creativeInventoryAction",
        definition: [
          {name: "slot", type: "i16"},
          {name: "clickedItem", type: "slot"}
        ]
      },
      0x1c: {
        name: "updateSign",
        definition: [
          {name: "location", type: "position"},
          {name: "line1", type: "string"},
          {name: "line2", type: "string"},
          {name: "line3", type: "string"},
          {name: "line4", type: "string"}
        ]
      },
      0x1d: {
        name: "animation",
        definition: [
          {name: "hand", type: "varint"}
        ]
      },
      0x1e: {
        name: "spectate",
        definition: [
          {name: "targetPlayer", type: "uuid"}
        ]
      },
      0x1f: {
        name: "playerBlockPlacement",
        definition: [
          {name: "location", type: "position"},
          {name: "face", type: "varint"},
          {name: "hand", type: "varint"},
          {name: "cursorX", type: "f32"},
          {name: "cursorY", type: "f32"},
          {name: "cursorZ", type: "f32"}
        ]
      },
      0x20: {
        name: "useItem",
        definition: [
          {name: "hand", type: "varint"}
        ]
      }
    }
  }
};