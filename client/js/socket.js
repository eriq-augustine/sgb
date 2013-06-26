"use strict";

Socket.SERVER = 'ws://localhost:12345/testsocket';

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
   console.log(message);

   switch (message.Type) {
      case Message.TYPE_START:
         startGame([new DropGroup(message.Payload.Drops[0]),
                    new DropGroup(message.Payload.Drops[1])]);
         break;
      case Message.TYPE_NEXT_TURN:
         nextTurnInfo(new DropGroup(message.Payload.Drop),
                      message.Payload.PlayerPunishment,
                      message.Payload.OpponentPunishment);
         break;
      case Message.TYPE_UPDATE:
         break;
      case Message.TYPE_RESOLVE_GAME:
         switch (message.Payload.Resolution) {
            case Message.END_GAME_LOSE:
               loseGame();
               break;
            case Message.END_GAME_WIN:
               winGame();
               break;
            case Message.END_GAME_NO_CONTEST:
               noContest();
               break;
            default:
               error('Unknown game resolution: ' + message.Payload.Resolution);
               break;
         }
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
   debug("Connection to server closed.");
   noContest();
};

Socket.prototype.onOpen = function(messageEvent) {
   debug("Connection to server opened.");
   this.ws.send(createInitMessage());
};

Socket.prototype.onError = function(messageEvent) {
   debug(JSON.stringify(messageEvent));
};

Socket.prototype.sendMove = function(dropGemLocations, boardHash) {
   this.ws.send(createMoveMessage(dropGemLocations, boardHash));
};

Socket.prototype.close = function() {
   this.ws.close();
};
