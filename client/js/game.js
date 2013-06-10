"use strict";

// Provide controled access to spf variables.
function spfGet(key) {
   if (window._spf_) {
      return window._spf_[key];
   }

   return undefined;
}

function spfSet(key, value) {
   if (!window._spf_) {
      window._spf_ = {};
   }

   window._spf_[key] = value;
}

function spfRemove(key) {
   if (window._spf_) {
      var temp = window._spf_[key];
      delete window._spf_[key];
      return temp;
   }

   return undefined;
}

// Static access to the game.
function dropComplete() {
   // TODO(eriq);
}

function Game() {
   this.logicWorker = new Worker("js/logicTimer.js");
   this.logicWorker.onmessage = function(evt) {
      this.gameTick();
   };
   // TEST
   //window.logicWorker.postMessage('start');

   this.lastDrop = 0;

   // TODO(eriq): The order here is off until the html set is taken out of
   //  Board.init().
   initRenderer();

   this.playerBoard = new Board('js-player-board', 13, 6);
   this.playerBoard.init();

   this.opponentBoard = new Board('js-opponent-board', 13, 6);
   this.opponentBoard.init();
}

Game.prototype.dropNow = function() {
   // TODO(eriq)
   console.log('TODO');
};

Game.prototype.goLeft = function() {
   this.playerBoard.moveDropGroup(0, -1);
};

Game.prototype.goRight = function() {
   this.playerBoard.moveDropGroup(0, 1);
};

Game.prototype.goDown = function() {
   this.playerBoard.advanceDropGroup();
};

Game.prototype.changeOrientation = function() {
   this.playerBoard.changeDropOrientation();
};

// TODO(eriq)
Game.prototype.gameTick = function() {
   // TEST
   goDown();
};

Game.prototype.start = function() {
   this.playerBoard.releaseGem();
};

function error(message) {
   console.log("Error: " + message);

   // TEST
   stopRenderer();
}

document.addEventListener('DOMContentLoaded', function() {
   spfSet('_game_', new Game());
});

// TODO(eriq): Don't register handlers till game actually starts.
// TODO(eriq): Get keys from settings.
document.addEventListener('keydown', function(event) {
   switch(event.keyCode) {
      case 32:  // Space
         spfGet('_game_').dropNow();
         break;
      case 37:  // Left Arrow
         spfGet('_game_').goLeft();
         break;
      case 38:  // Up Arrow
         spfGet('_game_').changeOrientation();
         break;
      case 39:  // Right Arrow
         spfGet('_game_').goRight();
         break;
      case 40:  // Down Arrow
         spfGet('_game_').goDown();
         break;
   }
});
