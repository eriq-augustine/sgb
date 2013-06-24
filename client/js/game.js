"use strict";

// Some constants.
Game.DROP_TIME = 750;
Game.UNSUPPORTED_DROP_TIME = 500;
Game.DESTROY_TIME = 250;
Game.NEXT_GEM_WAIT_TIME = 100;

// Wait for the server to schedule a start.
Game.STATE_INIT = 0;
Game.STATE_START = 1;
Game.STATE_PAUSE = 2;
Game.STATE_CONTROLLED_DROP = 3;
Game.STATE_UNCONTROLLED_DROP = 4;
// The DESTROY state is just a transition between when some gems are destroyed,
//  and when the next unsupported drop will attempt.
Game.STATE_TRY_DESTROY = 5;
Game.STATE_NEXT_GEM = 6;
Game.STATE_PUNISHMENT = 7;
Game.STATE_DONE = 8;
Game.STATE_LOSE = 9;
Game.STATE_WIN = 10;
Game.NUM_STATES = 11;

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
   spfGet('_game_').controlledDropComplete();
}

function loseGame() {
   spfGet('_game_').lose();
}

function startGame(dropGroups) {
   spfGet('_game_').start(dropGroups);
}

function Game() {
   this.logicWorker = new Worker("js/logicTimer.js");
   this.logicWorker.onmessage = function(evt) {
      spfGet('_game_').gameTick();
   };

   this.state = Game.STATE_INIT;
   this.lastDrop = 0;

   // Keep track of the drops in waiting.
   // The board is only allowed to know about the current and next drop.
   this.dropQueue = [];

   initRenderer();

   this.socket = new Socket();

   this.playerBoard = null;
   this.opponentBoard = null;
}

Game.prototype.controlledDropComplete = function() {
   this.lastDrop = Date.now();
   this.state = Game.STATE_UNCONTROLLED_DROP;
};

Game.prototype.dropNow = function() {
   this.playerBoard.advanceDropGroupFull();
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

Game.prototype.gameTick = function() {
   var now = Date.now();

   switch (this.state) {
      case Game.STATE_INIT:
         break;
      case Game.STATE_START:
         break;
      case Game.STATE_CONTROLLED_DROP:
         if (now - this.lastDrop >= Game.DROP_TIME) {
            this.goDown();
         }
         break;
      case Game.STATE_UNCONTROLLED_DROP:
         if (now - this.lastDrop >= Game.UNSUPPORTED_DROP_TIME) {
            this.playerBoard.dropUnsupported();
            this.lastDrop = now;
            this.state = Game.STATE_TRY_DESTROY;
         }
         break;
      case Game.STATE_TRY_DESTROY:
         if (now - this.lastDrop >= Game.DESTROY_TIME) {
            this.lastDrop = now;
            var destroyed = this.playerBoard.attemptDestroy();

            // See if there are any destroyed gems.
            if (destroyed > 0) {
               // TODO(eriq): Fancy destruction animation.
               this.state = Game.STATE_UNCONTROLLED_DROP;
            } else {
               this.state = Game.STATE_NEXT_GEM;
            }
         }
         break;
      case Game.STATE_NEXT_GEM:
         if (now - this.lastDrop >= Game.NEXT_GEM_WAIT_TIME) {
            this.lastDrop = now;
            // TODO(eriq): Deal with the situation where the sever
            //  has not given the next group yet.
            this.playerBoard.releaseGem(this.dropQueue.shift());
            this.state = Game.STATE_CONTROLLED_DROP;
         }
         break;
      case Game.STATE_DONE:
         break;
      default:
         error('Unsupported game state: ' + this.state);
         break;
   }
};

Game.prototype.start = function(dropGroups) {
   this.playerBoard = new Board('js-player-board', 13, 6, dropGroups[0]);
   this.opponentBoard = new Board('js-opponent-board', 13, 6, dropGroups[0]);

   this.dropQueue.push(dropGroups[1]);

   this.lastDrop = Date.now();
   this.state = Game.STATE_NEXT_GEM;
   this.logicWorker.postMessage('start');
};

Game.prototype.stop = function() {
   this.state = Game.STATE_DONE;
   this.logicWorker.postMessage('stop');
   stopRenderer();
};

Game.prototype.lose = function() {
   // TODO(eriq): Display some message.
   console.log('You Lose!');

   this.stop();
   this.state = Game.STATE_LOSE;
};

Game.prototype.win = function() {
   // TODO(eriq): Display some message.
};

document.addEventListener('DOMContentLoaded', function() {
   spfSet('debug', true);
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
