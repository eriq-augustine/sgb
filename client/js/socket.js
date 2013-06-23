"use strict";

function loadSocket() {
   var ws = new WebSocket("ws://localhost:12345/testsocket");
   //var ws = new WebSocket("ws://50.131.15.127:7070/websocket");

   ws.onmessage = onMessage;
   ws.onclose = onClose;
   ws.onopen = onOpen;
   ws.onerror = onError;

   window.socket = ws;
}

function onMessage(messageEvent) {
   // TEST
   debug("Message from server: " + messageEvent.data);

   // TODO(eriq): Catch the parse error.
   // data = JSON.parse(messageEvent.data);

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
}

function onClose(messageEvent) {
   //console.log("Connection to server closed: " + JSON.stringify(messageEvent));
   debug("Connection to server closed.");
}

function onOpen(messageEvent) {
   //console.log("Connection to server opened: " + JSON.stringify(messageEvent));
   debug("Connection to server opened.");
}

function onError(messageEvent) {
   debug(JSON.stringify(messageEvent));
}

// TEST
document.addEventListener('DOMContentLoaded', function() {
   loadSocket();
});
