"use strict";

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik M??ller. fixes from Paul Irish and Tino Zijdel
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

function gemAnimation() {
   var frames = [];
   //TEST
   for (var i = 0; i < 10; i++) {
      frames.push(new AnimationFrame('animation-gem-normal-' + i,
                                     50));
   }

   //return new Animation('animation-target', frames, true);
   return new Animation('animation-target', frames, false);
}

document.addEventListener('DOMContentLoaded', function() {
   var machine = new AnimationMachine();

   window.animate = true;

   machine.addAnimation(gemAnimation());
   machine.start();

   (function renderLoop() {
      if (window.animate) {
         window.requestAnimationFrame(renderLoop);
         machine.maybeAnimate();
      }
   })();
});
