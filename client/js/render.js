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
   if (spfGet('_renderer_')) {
      error('Double init on renderer.');
      return false;
   }

   spfSet('_renderer_', new InternalRenderer());
   spfGet('_renderer_').start();

   return true;
}

function startRenderer() {
   if (!spfGet('_renderer_')) {
      error('There is no renderer to start.');
      return false;
   }

   spfGet('_renderer_').start();
   return true;
}

function stopRenderer() {
   if (spfGet('_renderer_')) {
      spfGet('_renderer_').start();
   }

   return true;
}

// Request an initial render of the board.
// This will layout the html.
function requestInitBoard(boardId) {
   if (spfGet('_renderer_')) {
      spfGet('_renderer_').addUpdate({type: 'boardInit', boardId: boardId});
   }
}

// Request a re-render of the entire board.
function requestBoardRender(boardId) {
   if (spfGet('_renderer_')) {
      // NOTE(eriq): This could be made more efficient by bucketing the requests by board.
      spfGet('_renderer_').addUpdate({type: 'board', boardId: boardId});
   }
}

// Request a re-render of a specific cell.
function requestCellRender(boardId, row, col) {
   if (spfGet('_renderer_')) {
      spfGet('_renderer_').addUpdate({type: 'cell', boardId: boardId, row: row, col: col});
   }
}

// Request a re-render of the next drop group display.
function requestNextDropGroupRender(boardId) {
   if (spfGet('_renderer_')) {
      spfGet('_renderer_').addUpdate({type: 'nextDropGroup', boardId: boardId});
   }
}

// The renderer class should never be accessed by anyone direclty.
// The static calls should be used instead.
function InternalRenderer() {
   this.render = true;
   this.updates = [];
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
         default:
            error('Unknown update type: ' + updateData.type);
            break;
      }
   }
};

InternalRenderer.prototype.initBoard = function(boardId) {
   var board = getBoard(boardId);
   var html = '<div class="next-drop-group">';
   // Default orientation is DOWN.
   html += '<div id="' + boardId + '-next-drop-group-first" class="next-group"></div>';
   html += '<div id="' + boardId + '-next-drop-group-second" class="next-group"></div>';
   html += '</div>';
   html += '<div class="inner-board">';

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

   html += '</div>';

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
};

// TODO(eriq): Don't break animations.
InternalRenderer.prototype.renderCell = function(boardId, row, col) {
   var gem = getBoard(boardId).getGem(row, col);
   var cellId = boardId + '-' + row + '-' + col;
   this.renderGem(cellId, gem);
};

InternalRenderer.prototype.renderGem = function(gemRenderId, gem) {
   var cell = $('#' + gemRenderId);
   // Remove all gem related classes.
   if (cell.attr('class')) {
      cell.attr('class', cell.attr('class').replace(/gem?\S*/g, ''));
   }

   if (gem) {
      switch (gem.type) {
         case Gem.TYPE_NORMAL:
            cell.addClass('gem gem-normal-' + gem.color);
            break;
         case Gem.TYPE_DESTROYER:
            cell.addClass('gem gem-destroyer-' + gem.color);
            break;
         case Gem.TYPE_STAR:
            cell.addClass('gem gem-star');
            break;
         default:
            error('Unknown gem type: ' + gem.type);
      }
   }
};

InternalRenderer.prototype.renderNextDropGroup = function(boardId) {
   var dropGroup = getBoard(boardId).getNextDropGroup();

   this.renderGem(boardId + '-next-drop-group-first', dropGroup.firstGem);
   this.renderGem(boardId + '-next-drop-group-second', dropGroup.secondGem);
};

InternalRenderer.prototype.start = function() {
   this.render = true;

   (function renderLoop() {
      if (spfGet('_renderer_').render) {
         window.requestAnimationFrame(renderLoop);
      }

      spfGet('_renderer_').update();

      //  TODO(eriq): Animations.
      // window.animationMachine.maybeAnimate();
   })();
};

InternalRenderer.prototype.stop = function() {
   this.render = false;
};

/*
document.addEventListener('DOMContentLoaded', function() {
   window.breakAnimation = false;
   window.animationMachine = new AnimationMachine();

   var gemAnimation = new Animation('theGem', [new AnimationFrame('gem-0', 100, console.log.bind(console, 'Hook: 0')),
                                               new AnimationFrame('gem-1', 100, console.log.bind(console, 'Hook: 1')),
                                               new AnimationFrame('gem-2', 100, console.log.bind(console, 'Hook: 2')),
                                               new AnimationFrame('gem-3', 100, console.log.bind(console, 'Hook: 3'))],
                                    true);
   window.animationMachine.addAnimation(gemAnimation);
   window.animationMachine.start();

   (function animloop(){
      if (!window.breakAnimation) {
         window.requestAnimationFrame(animloop);
      }

      window.animationMachine.maybeAnimate();
   })();
});
*/
