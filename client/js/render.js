"use strict";

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function initRenderer() {
   if (sgbGet('_renderer_')) {
      error('Double init on renderer.');
      return false;
   }

   sgbSet('_renderer_', new InternalRenderer());

   return true;
}

function startRenderer() {
   if (!sgbGet('_renderer_')) {
      error('There is no renderer to start.');
      return false;
   }

   sgbGet('_renderer_').start();
   return true;
}

function stopRenderer() {
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').stop();
   }

   return true;
}

// Statically render the drop patterns.
function staticRenderDropPatterns(targetId, clickHandler) {
   var html = '<div class="punishment-patterns">';

   for (var index = 0; index < punishments.NUM_PUNISHMENT_PATTERNS; index++) {
      html += '<div class="punishment-pattern">';

      var pattern = getPunishmentPattern(index);
      for (var i = pattern.length - 1; i >= 0; i--) {
         html += '<div class="pattern-row">';
         for (var j = 0; j < pattern[i].length; j++) {
            var classes = 'board-cell renderer-gem renderer-gem-normal-' + pattern[i][j];
            var handler = '';
            if (clickHandler) {
               handler = 'onClick="' + clickHandler + '(' + index + ');"';
            }
            html += '<div class="' + classes + '" ' + handler + '></div>';
         }
         html += '</div>';
      }

      html += '</div>';
   }

   html += '</div>';

   $('#' + targetId).html(html);
}

// Request an initial render of the board.
// This will layout the html.
function requestInitBoard(boardId) {
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').addUpdate({type: 'boardInit', boardId: boardId});
   }
}

// Request a re-render of the entire board.
function requestBoardRender(boardId) {
   if (sgbGet('_renderer_')) {
      // NOTE(eriq): This could be made more efficient by bucketing the requests by board.
      sgbGet('_renderer_').addUpdate({type: 'board', boardId: boardId});
   }
}

// Request a re-render of a specific cell.
function requestCellRender(boardId, row, col) {
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').addUpdate({type: 'cell', boardId: boardId, row: row, col: col});
   }
}

// Request the destruction of a gem. This will trigger an animation on the cell.
function requestDestroy(boardId, row, col, type, color) {
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').addUpdate({type: 'destroyGem',
                                      boardId: boardId,
                                      row: row, col: col,
                                      gemType: type, color: color});
   }
}

// Request a re-render of the next drop group display.
function requestNextDropGroupRender(boardId) {
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').addUpdate({type: 'nextDropGroup', boardId: boardId});
   }
}

function requestPunishmentRender(boardId) {
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').addUpdate({type: 'punishments', boardId: boardId});
   }
}

function requestScoreRender(boardId, score) {
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').addUpdate({type: 'score',
                                      boardId: boardId,
                                      score: score});
   }
}

// This is current not really a request.
// All destruction animations are immediatley canceled.
function requestCancelDestruction(boardId) {
   // TODO(eriq): Is this threadsafe?
   if (sgbGet('_renderer_')) {
      sgbGet('_renderer_').cancelDestructions(boardId);
   }
}

// The renderer class should never be accessed by anyone direclty.
// The static calls should be used instead.
function InternalRenderer() {
   this.render = true;
   this.updates = [];

   // All the ids for the active destructions.
   // Where there are no more, callback to the game.
   this.activeDestructions = {};
   this.activeDestructionsCount = 0;

   this.animationMachine = new AnimationMachine();
}

InternalRenderer.prototype.addUpdate = function(updateRequest) {
   this.updates.push(updateRequest);
}

InternalRenderer.prototype.update = function() {
   while (this.updates.length > 0) {
      var updateData = this.updates.pop();
      switch (updateData.type) {
         case 'board':
            this.renderBoard(updateData.boardId);
            break;
         case 'cell':
            this.renderCell(updateData.boardId, updateData.row, updateData.col);
            break;
         case 'boardInit':
            this.initBoard(updateData.boardId);
            break;
         case 'nextDropGroup':
            this.renderNextDropGroup(updateData.boardId);
            break;
         case 'punishments':
            this.renderPunishments(updateData.boardId);
            break;
         case 'cancelDestructions':
            this.cancelDestructions(updateData.boardId);
            break;
         case 'destroyGem':
            this.renderDestroy(updateData.boardId,
                               updateData.row, updateData.col,
                               updateData.gemType, updateData.color);
            break;
         case 'score':
            this.renderScore(updateData.boardId, updateData.score);
            break;
         default:
            error('Unknown update type: ' + updateData.type);
            break;
      }
   }

   // It is very important that the logical requests be handled before the
   //  animation machine runs.
   // Especially a request to cancel animations before their callbacks get a chance to run.
   this.animationMachine.maybeAnimate();
};

InternalRenderer.prototype.initBoard = function(boardId) {
   var board = getBoard(boardId);
   var html = '<div class="board-area">';

   html += '<div class="board-meta-area">';

   html += ' <div class="next-drop-group">';
   // Default orientation is DOWN.
   html += '  <div id="' + boardId + '-next-drop-group-first" class="next-group"></div>';
   html += '  <div id="' + boardId + '-next-drop-group-second" class="next-group"></div>';
   html += ' </div>';

   html += ' <div class="board-score-area">';
   html += '  <div id="' + boardId + '-board-score" class="board-score">0</div>';
   html += ' </div>';

   html += '</div>';

   html += '<div class="inner-board">';

   html += ' <div class="board-warnings on-board-notification">';
   html += '  <div id="' + boardId + '-warning-text"></div>'
   html += ' </div>';

   html += ' <div class="punishments on-board-notification">';
   html += '  <div id="' + boardId + '-punishments-number">0</div>'
   html += ' </div>';

   for (var row = 0; row < board.height; row++) {
      html += '<div id="' + boardId + '-' + row + '" class="board-row board-row-' + row + '">';

      for (var col = 0; col < board.width; col++) {
         html += '<div id="' + boardId + '-' + row + '-' + col + '"' +
                 ' class="board-cell' +
                         ' board-cell-' + row + '-' + col +
                         ' board-col-' + col + '"></div>';
      }

      html += '</div>';
   }

   // Close inner-board and board-area
   html += '</div></div>';

   $('#' + boardId).html(html);

   this.renderBoard(boardId);
};

InternalRenderer.prototype.renderBoard = function(boardId) {
   var board = getBoard(boardId);

   for (var i = 0; i < board.height; i++) {
      for (var j = 0; j < board.width; j++) {
         this.renderCell(boardId, i, j);
      }
   }

   this.renderNextDropGroup(boardId);
   this.renderPunishments(boardId);
};

InternalRenderer.prototype.renderCell = function(boardId, row, col) {
   var gem = getBoard(boardId).getGem(row, col);
   var cellId = boardId + '-' + row + '-' + col;
   this.renderGem(cellId, gem);
};

// Remove all renderer related classes.
InternalRenderer.prototype.removeRenderClasses = function(cell) {
   if (cell.attr('class')) {
      cell.attr('class', cell.attr('class').replace(/renderer-gem?\S*/g, ''));
   }
};

InternalRenderer.prototype.renderGem = function(gemRenderId, gem) {
   var cell = $('#' + gemRenderId);
   this.removeRenderClasses(cell);

   if (gem) {
      switch (gem.type) {
         case Gem.TYPE_NORMAL:
            cell.addClass('renderer-gem renderer-gem-normal-' + gem.color);
            break;
         case Gem.TYPE_DESTROYER:
            cell.addClass('renderer-gem renderer-gem-destroyer-' + gem.color);
            break;
         case Gem.TYPE_STAR:
            cell.addClass('renderer-gem renderer-gem-star');
            break;
         case Gem.TYPE_LOCKED:
            if (gem.counter < 1 || gem.counter > Gem.MAX_COUNTER) {
               error("Don't know how to render out gem with counter " + gem.counter);
            }
            // gem-locked-<color>-<timer>
            cell.addClass('renderer-gem renderer-gem-locked-' + gem.color + '-' + gem.counter);
            break;
         default:
            error('Unknown gem type: ' + gem.type);
            break;
      }
   }
};

InternalRenderer.prototype.renderDestroy = function(boardId, row, col, type, color) {
   var cellId = boardId + '-' + row + '-' + col;
   var cell = $('#' + cellId);
   this.removeRenderClasses(cell);

   cell.addClass('renderer-gem');

   var callback = this.completeDestructionAnimation.bind(this, cellId);
   var animationId = this.animationMachine.addAnimation(destructionAnimation(type, color, cellId, callback));

   this.activeDestructions[cellId] = animationId;
   this.activeDestructionsCount++;
};

// The final callback in a gem animation.
// Will complete the render.
InternalRenderer.prototype.completeDestructionAnimation = function(cellId, expired) {
   this.removeRenderClasses($('#' + cellId));

   delete this.activeDestructions[cellId];
   this.activeDestructionsCount--;

   if (this.activeDestructionsCount == 0) {
      destructionComplete();
   }
};

InternalRenderer.prototype.cancelDestructions = function() {
   this.activeDestructionsCount = 0;

   for (var cellId in this.activeDestructions) {
      this.removeRenderClasses($('#' + cellId));
      this.animationMachine.removeAnimation(this.activeDestructions[cellId], true);
   }
   this.activeDestructions = {};
};

InternalRenderer.prototype.renderNextDropGroup = function(boardId) {
   var dropGroup = getBoard(boardId).getNextDropGroup();

   this.renderGem(boardId + '-next-drop-group-first', dropGroup.firstGem);
   this.renderGem(boardId + '-next-drop-group-second', dropGroup.secondGem);
};

InternalRenderer.prototype.renderPunishments = function(boardId) {
   var punishments = getBoard(boardId).getPunishments();
   $('#' + boardId + '-punishments-number').html(punishments);
};

InternalRenderer.prototype.renderScore = function(boardId, score) {
   $('#' + boardId + '-board-score').html(score);
};

InternalRenderer.prototype.start = function() {
   this.render = true;
   this.animationMachine.start();

   (function renderLoop() {
      if (sgbGet('_renderer_').render) {
         window.requestAnimationFrame(renderLoop);
      }

      // Even if the renderer has been stopped, do one last render.
      sgbGet('_renderer_').update();
   })();
};

InternalRenderer.prototype.stop = function() {
   this.render = false;
};
