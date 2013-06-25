"use strict";

Socket.SERVER = 'ws://localhost:12345/testsocket';

Socket.MESSAGE_TYPE_INIT = 0;
Socket.MESSAGE_TYPE_START = 1;
Socket.MESSAGE_TYPE_MOVE = 2;
Socket.MESSAGE_TYPE_NEXT_DROP = 3;
Socket.MESSAGE_TYPE_PUNISHMENT = 4;
Socket.MESSAGE_TYPE_UPDATE = 5;
Socket.MESSAGE_TYPE_END_GAME = 6;
Socket.NUM_MESSAGE_TYPES = 7;

function Socket() {
   this.ws = new WebSocket(Socket.SERVER);

   this.ws.onmessage = this.onMessage.bind(this);
   this.ws.onclose = this.onClose.bind(this);
   this.ws.onopen = this.onOpen.bind(this);
   this.ws.onerror = this.onError.bind(this);
}

Socket.prototype.onMessage = function(messageEvent) {
   var message = null;
   try {
      message = JSON.parse(messageEvent.data);
   } catch (ex) {
      error('Server message does not parse.');
      return false;
   }

   // TEST
   debug(message);
   console.log(message);

   switch (message.Type) {
      case Message.TYPE_START:
         startGame([new DropGroup(message.Payload.Drops[0]),
                    new DropGroup(message.Payload.Drops[1])]);
         break;
      case Message.TYPE_NEXT_DROP:
         enqueueDropGroup(new DropGroup(message.Payload.Drop));
         break;
      case Message.TYPE_PUNISHMENT:
         break;
      case Message.TYPE_UPDATE:
         break;
      case Message.TYPE_END_GAME:
         break;
      default:
         // Note: There are messages that are known, but just not expected from the server.
         error('Unknown Message Type: ' + message.Type);
         break;
   }

/*
   if (data.type == 'ack' && data.status == 'ok') {
      loadGame(data.seed);
   }
   else if (data.type == 'update') {
      window.game.updateOpponent(data.board);
   }
   else if (data.type == 'punishment') {
      window.game.addPunishments(data.colors);
   }
   else if (data.type == 'gameover') {
      if (data.reason == 'win') {
         window.game.win();
      }
   }
*/
};

Socket.prototype.onClose = function(messageEvent) {
   //console.log("Connection to server closed: " + JSON.stringify(messageEvent));
   debug("Connection to server closed.");
};

Socket.prototype.onOpen = function(messageEvent) {
   //console.log("Connection to server opened: " + JSON.stringify(messageEvent));
   debug("Connection to server opened.");

   this.ws.send(createInitMessage());
};

Socket.prototype.onError = function(messageEvent) {
   debug(JSON.stringify(messageEvent));
};

Socket.prototype.sendMove = function(dropGemLocations, boardHash) {
   this.ws.send(createMoveMessage(dropGemLocations, boardHash));
};
