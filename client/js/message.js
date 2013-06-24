"use strict";

// TODO(eriq): Namespace all the files.
var Message = {};
Message.TYPE_INIT = 0;
Message.TYPE_START = 1;
Message.TYPE_MOVE = 2;
Message.TYPE_NEXT_DROP = 3;
Message.TYPE_PUNISHMENT = 4;
Message.TYPE_UPDATE = 5;
Message.TYPE_END_GAME = 6;
Message.NUM_TYPES = 7;

function createBaseMessage(type, payload) {
   return JSON.stringify({Type: type, Payload: payload});
}

function createInitMessage() {
   return createBaseMessage(Message.TYPE_INIT, {Time: new Date()});
}
