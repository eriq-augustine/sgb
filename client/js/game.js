"use strict";

// Some constants.
Game.DROP_TIME = 750;

Game.STATE_START = 0;
Game.STATE_PAUSE = 1;
Game.STATE_CONTROLLED_DROP = 2;
Game.STATE_UNCONTROLLED_DROP = 3;
Game.STATE_PUNISHMENT = 4;
Game.NUM_STATES = 5;

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
      spfGet('_game_').gameTick();
   };
   this.logicWorker.postMessage('start');

   this.state = Game.STATE_START;
   this.lastDrop = 0;

   initRenderer();

   this.playerBoard = new Board('js-player-board', 13, 6);
   this.opponentBoard = new Board('js-opponent-board', 13, 6);
}

Game.prototype.dropNow = function() {
   // TODO(eriq)
   console.log('TODO: drop now');
};

Game.prototype.goLeft = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.playerBoard.moveDropGroup(0, -1);
   }
};

Game.prototype.goRight = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.playerBoard.moveDropGroup(0, 1);
   }
};

Game.prototype.goDown = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.lastDrop = Date.now();
      this.playerBoard.advanceDropGroup();
   }
};

Game.prototype.changeOrientation = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.playerBoard.changeDropOrientation();
   }
};

// TODO(eriq)
Game.prototype.gameTick = function() {
   var now = Date.now();

   if (this.state === Game.STATE_CONTROLLED_DROP &&
       now - this.lastDrop >= Game.DROP_TIME) {
      this.goDown();
   }
};

Game.prototype.start = function() {
   this.state = Game.STATE_CONTROLLED_DROP;
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
