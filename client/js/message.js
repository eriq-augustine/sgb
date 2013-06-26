"use strict";

// TODO(eriq): Namespace all the files.
var Message = {};
Message.TYPE_INIT = 0;
Message.TYPE_START = 1;
Message.TYPE_MOVE = 2;
Message.TYPE_NEXT_TURN = 3;
Message.TYPE_UPDATE = 4;
Message.TYPE_RESOLVE_GAME = 5;
Message.NUM_TYPES = 6;

Message.END_GAME_LOSE = 0;
Message.END_GAME_WIN = 1;
Message.END_GAME_NO_CONTEST = 2;
Message.NUM_END_GAMES = 3;

function createBaseMessage(type, payload) {
   return JSON.stringify({Type: type, Payload: payload});
}

function createInitMessage() {
   return createBaseMessage(Message.TYPE_INIT, {Time: new Date()});
}
   
function createMoveMessage(dropGemLocations, boardHash) {
   return createBaseMessage(Message.TYPE_MOVE,
                            {Locations: [[dropGemLocations.first.row, dropGemLocations.first.col],
                                         [dropGemLocations.second.row, dropGemLocations.second.col]],
                             BoardHash: boardHash});
}
