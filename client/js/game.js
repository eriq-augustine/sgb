"use strict";

// TODO(eriq): Don't register handlers till game actually starts.
// TODO(eriq): Get keys from settings.
document.addEventListener('keydown', function(event) {
   switch(event.keyCode) {
      case 32:  // Space
         window.dropNow();
         break;
      case 37:  // Left Arrow
         window.goLeft();
         break;
      case 38:  // Up Arrow
         window.changeOrientation();
         break;
      case 39:  // Right Arrow
         window.goRight();
         break;
      case 40:  // Down Arrow
         window.goDown();
         break;
   }
});

function dropNow() {
   // TODO(eriq)
   console.log('TODO');
}

function goLeft() {
   window.spf.playerBoard.moveDropGroup(0, -1);
}

function goRight() {
   window.spf.playerBoard.moveDropGroup(0, 1);
}

function goDown() {
   window.spf.playerBoard.advanceDropGroup();
}

function changeOrientation() {
   window.spf.playerBoard.changeDropOrientation();
}

// TODO(eriq)
function gameTick() {
   // TEST
   goDown();
}

// TODO(eriq): All these should be grouped into an object.
function dropComplete() {
   // TODO(eriq);
}

function start() {
   window.spf.playerBoard.releaseGem();
}

function error(message) {
   console.log("Error: " + message);

   // TEST
   stopRenderer();
}

document.addEventListener('DOMContentLoaded', function() {
   window.spf = {};
   window.spf.logicWorker = new Worker("js/logicTimer.js");
   window.spf.logicWorker.onmessage = function(evt) {
      gameTick();
   };
   // TEST
   //window.logicWorker.postMessage('start');

   window.spf.lastDrop = 0;

   // TODO(eriq): The order here is off until the html set is taken out of
   //  Board.init().
   initRenderer();

   window.spf.playerBoard = new Board('js-player-board', 13, 6);
   window.spf.playerBoard.init();

   window.spf.opponentBoard = new Board('js-opponent-board', 13, 6);
   window.spf.opponentBoard.init();
});
