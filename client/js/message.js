"use strict";

var Message = {};
Message.TYPE_INIT = 0;
Message.TYPE_START = 1;
Message.TYPE_MOVE = 2;
Message.TYPE_NEXT_TURN = 3;
Message.TYPE_UPDATE = 4;
Message.TYPE_DROP_GROUP_UPDATE = 5;
Message.TYPE_NO_CONTEST = 6;
Message.NUM_TYPES = 7;

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

function createDropGroupUpdateMessage(dropGemLocations) {
   return createBaseMessage(Message.TYPE_DROP_GROUP_UPDATE,
                            {Locations: [[dropGemLocations.first.row,
                                          dropGemLocations.first.col],
                                         [dropGemLocations.second.row,
                                          dropGemLocations.second.col]]});
}
