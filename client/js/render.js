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
function requestBoardRender() {
   // TODO(eriq);
}

// Request a re-render of a specific cell.
function requestCellRender(row, col) {
   // TODO(eriq);
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
