"use strict";

// Some time constants.
Game.DROP_TIME = 750;
Game.UNSUPPORTED_DROP_TIME = 200;
Game.NEXT_GEM_WAIT_TIME = 100;
Game.PUNISHMENT_WAIT_TIME = 10;
Game.DESTRUCTION_TIMEOUT = 700;

Game.BOARD_HEIGHT = 14;
Game.BOARD_WIDTH = 6;

// Wait for the server to schedule a start.
Game.STATE_INIT = 0;
Game.STATE_START = 1;
Game.STATE_PAUSE = 2;
Game.STATE_CONTROLLED_DROP = 3;
Game.STATE_UNCONTROLLED_DROP = 4;
Game.STATE_TRY_DESTROY = 5;
Game.STATE_PUNISHMENT = 6;
Game.STATE_NEXT_GEM = 7;
Game.STATE_DONE = 8;
Game.STATE_LOSE = 9;
Game.STATE_WIN = 10;
Game.STATE_NO_CONTEST = 11;
Game.NUM_STATES = 12;

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
function initGame(chosenPattern, gameStartCallback) {
   spfSet('debug', true);
   spfSet('_game_', new Game(chosenPattern, gameStartCallback));
}

function dropComplete(dropGemLocations, hash) {
   spfGet('_game_').controlledDropComplete(dropGemLocations, hash);
}

function loseGame() {
   spfGet('_game_').lose();
}

function winGame() {
   spfGet('_game_').win();
}

function noContest() {
   spfGet('_game_').noContest();
}

function startGame(dropGroups) {
   spfGet('_game_').start(dropGroups);
}

function nextTurnInfo(dropGroup, playerPunishments, opponentPunishments) {
   spfGet('_game_').nextTurnInfo(dropGroup,
                                 playerPunishments,
                                 opponentPunishments);
}

function updatePlayerPunishments(playerPunishmentCount) {
   spfGet('_game_').updatePlayerPunishments(playerPunishmentCount);
}

function updateOpponent(punishments, board, dropGroup) {
   spfGet('_game_').updateOpponent(punishments, board, dropGroup);
}

function destructionComplete() {
   spfGet('_game_').destructionComplete();
}

function opponentDropGroupUpdate(dropGemLocations) {
   spfGet('_game_').opponentDropGroupUpdate(dropGemLocations);
}

function connectionClosed() {
   spfGet('_game_').connectionClosed();
}

function Game(chosenPattern, gameStartCallback) {
   this.logicWorker = new Worker("js/logicTimer.js");
   this.logicWorker.onmessage = function(evt) {
      spfGet('_game_').gameTick();
   };

   this.state = Game.STATE_INIT;
   this.lastDrop = 0;

   // Call this when the game is ready to start.
   this.gameStartCallback = gameStartCallback;

   // Keep track of the drops in waiting.
   // The board is only allowed to know about the current and next drop.
   this.dropQueue = [];

   initRenderer();

   // True if there are destruction animations going on.
   this.activeDestruction = false;

   this.socket = new Socket(chosenPattern);

   this.playerBoard = null;
   this.opponentBoard = null;

   this.frozenPunishments = null;

   // When this turns true, the game should end.
   this.lost = false;
}

Game.prototype.opponentDropGroupUpdate = function(dropGemLocations) {
   this.opponentBoard.modifyOpponentDropGroup(
         dropGemLocations[0][0], dropGemLocations[0][1],
         dropGemLocations[1][0], dropGemLocations[1][1]);
};

Game.prototype.sendDropGroup = function() {
   if (this.playerBoard.dropGroup) {
      this.socket.sendDropGroupUpdate(this.playerBoard.getDropGemLocations());
   }
};

Game.prototype.controlledDropComplete = function(dropGemLocations, hash) {
   this.lastDrop = Date.now();
   this.state = Game.STATE_UNCONTROLLED_DROP;

   // Advance the timers before destructions are attempted.
   this.playerBoard.advanceTimers();

   // Tell the server that the drop is complete.
   this.socket.sendMove(dropGemLocations, hash);
};

Game.prototype.dropNow = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.playerBoard.advanceDropGroupFull();
   }

   this.sendDropGroup();
};

Game.prototype.goLeft = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.playerBoard.moveDropGroup(0, -1);
   }

   this.sendDropGroup();
};

Game.prototype.goRight = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.playerBoard.moveDropGroup(0, 1);
   }

   this.sendDropGroup();
};

Game.prototype.goDown = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.lastDrop = Date.now();
      this.playerBoard.advanceDropGroup();
   }

   this.sendDropGroup();
};

Game.prototype.changeOrientation = function() {
   if (this.state === Game.STATE_CONTROLLED_DROP) {
      this.playerBoard.changeDropOrientation();
   }

   this.sendDropGroup();
};

Game.prototype.destructionComplete = function() {
   this.activeDestruction = false;
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
         if (this.activeDestruction && now - this.lastDrop >= Game.DESTRUCTION_TIMEOUT) {
            this.activeDestruction = false;
            requestCancelDestruction(this.playerBoard.id);
         }

         if (!this.activeDestruction && now - this.lastDrop >= Game.UNSUPPORTED_DROP_TIME) {
            this.playerBoard.dropUnsupported();
            this.lastDrop = now;
            this.state = Game.STATE_TRY_DESTROY;
         }
         break;
      case Game.STATE_TRY_DESTROY:
         this.lastDrop = now;
         var destroyed = this.playerBoard.attemptDestroy();

         // See if there are any destroyed gems.
         if (destroyed > 0) {
            this.activeDestruction = true;
            this.state = Game.STATE_UNCONTROLLED_DROP;
         } else {
            this.state = Game.STATE_PUNISHMENT;
         }
         break;
      case Game.STATE_PUNISHMENT:
         // Block until the server gives information about the next turn.
         if (this.frozenPunishments == null) {
            break;
         }

         if (now - this.lastDrop >= Game.PUNISHMENT_WAIT_TIME) {
            this.lastDrop = now;

            // Drop the punishments down one level and place the next punishments.
            // If neither occur, then the punishment phase is over.
            var keepGoing = this.playerBoard.singleDropIteration();
            keepGoing |= this.playerBoard.dropPunishmentRow(this.frozenPunishments);

            if (!keepGoing) {
               // This is where a player is told they lost.
               // Do it here so that the player can see their potential punishments.
               if (this.lost) {
                  this.finalizeLoss();
               } else {
                  // Done with punishments.
                  this.frozenPunishments = null;
                  this.state = Game.STATE_NEXT_GEM;
               }
            }
         }
         break;
      case Game.STATE_NEXT_GEM:
         // There should always be a group ready in the queue.
         // Punishments blocked for it.
         if (this.dropQueue.length == 0) {
            error('Drop queue is empty.');
         }

         if (now - this.lastDrop >= Game.NEXT_GEM_WAIT_TIME) {
            this.lastDrop = now;
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
   if (this.gameStartCallback) {
      this.gameStartCallback();
   }

   this.playerBoard = new Board('js-player-board', Game.BOARD_HEIGHT,
                                 Game.BOARD_WIDTH, dropGroups[0]);
   this.opponentBoard = new Board('js-opponent-board', Game.BOARD_HEIGHT,
                                  Game.BOARD_WIDTH, dropGroups[0]);

   this.dropQueue.push(dropGroups[1]);

   // Release the opponent's drop group.
   this.opponentBoard.releaseGem(this.dropQueue[0]);

   this.lastDrop = Date.now();
   this.state = Game.STATE_NEXT_GEM;
   this.logicWorker.postMessage('start');
   startRenderer();
};

Game.prototype.stop = function() {
   this.state = Game.STATE_DONE;
   this.socket.close();
   this.logicWorker.postMessage('stop');

   stopRenderer();
};

Game.prototype.lose = function() {
   this.lost = true;
};

Game.prototype.finalizeLoss = function() {
   $('.board-message').text('You Lose').addClass('board-message-lose');
   console.log('You Lose!');

   this.stop();
   this.state = Game.STATE_LOSE;
};

Game.prototype.win = function() {
   $('.board-message').text('You Win!').addClass('board-message-win');
   console.log('You Win!');

   this.stop();
   this.state = Game.STATE_WIN;
};

Game.prototype.noContest = function() {
   if (this.state != Game.STATE_WIN && this.state != Game.STATE_LOSE) {
      $('.board-message').text('No Contest').addClass('board-message-no-contest');
      console.log('No Contest!');

      this.stop();
      this.state = Game.STATE_NO_CONTEST;
   }
};

Game.prototype.connectionClosed = function() {
   // If we lost, then finish the dropping first.
   if (!this.lost) {
      this.noContest();
   }
};

Game.prototype.updatePlayerPunishments = function(playerPunishmentCount) {
   this.playerBoard.modifyPunishments(playerPunishmentCount);
};

Game.prototype.nextTurnInfo = function(dropGroup,
                                       playerPunishments,
                                       opponentPunishments) {
   this.dropQueue.push(dropGroup);

   this.frozenPunishments = playerPunishments;

   // The player is taking all their punishments.
   this.updatePlayerPunishments(0);
   this.opponentBoard.modifyPunishments(opponentPunishments);
};

Game.prototype.updateOpponent = function(punishments, board, nextDrop) {
   this.opponentBoard.modifyPunishments(punishments);
   this.opponentBoard.updateBoard(board);

   if (nextDrop) {
      this.opponentBoard.releaseGem(nextDrop);
   }
};

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
