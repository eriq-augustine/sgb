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

// Request a re-render of the entire board.
function requestBoardRender(boardId) {
   // NOTE(eriq): This could be made more efficient by bucketing the requests by board.
   window.spf.updates.push({type: 'board', boardId: boardId});
}

// Request a re-render of a specific cell.
function requestCellRender(boardId, row, col) {
   window.spf.updates.push({type: 'cell', boardId: boardId, row: row, col: col});
}

function update() {
   window.spf.updates.forEach(function(updateData) {
      switch (updateData.type) {
         case 'board':
            renderBoard(updateData.boardId);
            break;
         case 'cell':
            renderCell(updateData.boardId, updateData.row, updateData.col);
            break;
         default:
            error('Unknown update type: ' + updateData.type);
            break;
      }
   }, this);
}

function renderBoard(boardId) {
   var board = boardLookup[boardId];

   for (var i = 0; i < board.height; i++) {
      for (var j = 0; j < board.width; j++) {
         renderCell(boardId, i, j);
      }
   }
}

// TODO(eriq): Don't break animations.
function renderCell(boardId, row, col) {
   var gem = boardLookup[boardId].getGem(row, col);
   var cellId = '#' + boardId + '-' + row + '-' + col;

   var cell = $(cellId);
   // Remove all gem related classes.
   cell.attr('class', cell.attr('class').replace(/gem?\S*/g, ''));

   if (gem) {
      // TODO(eriq): Need more complete naming scheme for other types.
      if (gem.type === Gem.TYPE_NORMAL) {
         cell.addClass('gem gem-' + gem.color);
      } else {
         // TODO(eriq): not implemnted
         error('Rendering different types of gems not yet implemented.');
      }
   }
}

function initRenderer() {
   window.spf.render = true;
   window.spf.updates = [];

   (function animloop(){
      if (window.spf.render) {
         window.requestAnimationFrame(animloop);
      }

      update();

      //  TODO(eriq): Animations.
      // window.animationMachine.maybeAnimate();
   })();
}

function stopRenderer() {
   window.spf.render = false;
}

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
