"use strict";

// Some constants.
Game.DROP_TIME = 750;
Game.UNSUPPORTED_DROP_TIME = 750;
Game.DESTROY_TIME = 500;
Game.NEXT_GEM_WAIT_TIME = 500;

Game.STATE_START = 0;
Game.STATE_PAUSE = 1;
Game.STATE_CONTROLLED_DROP = 2;
Game.STATE_UNCONTROLLED_DROP = 3;
// The DESTROY state is just a transition between when some gems are destroyed,
//  and when the next unsupported drop will attempt.
Game.STATE_TRY_DESTROY = 4;
Game.STATE_NEXT_GEM = 5;
Game.STATE_PUNISHMENT = 6;
Game.NUM_STATES = 7;

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

Game.prototype.controlledDropComplete = function() {
   this.lastDrop = Date.now();
   this.state = Game.STATE_UNCONTROLLED_DROP;
};

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

   switch (this.state) {
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
            this.playerBoard.releaseGem();
            this.state = Game.STATE_CONTROLLED_DROP;
         }
         break;
   }
};

Game.prototype.start = function() {
   this.lastDrop = Date.now();
   this.state = Game.STATE_NEXT_GEM;
};

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
