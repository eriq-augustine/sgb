"use strict";

var GEM_ANIMATION_LENGTH = 50;

var NUM_DESTRUCTION_FRAMES = 10;

// Get the destruction animation.
function destructionAnimation(color, id, callback) {
   var frames = [];
   for (var i = 0; i < NUM_DESTRUCTION_FRAMES; i++) {
      frames.push(new AnimationFrame('animation-gem-destroy-' + color + '-' + i,
                                     GEM_ANIMATION_LENGTH,
                                     true /* expire */));
   }

   if (callback) {
      frames[frames.length - 1].postAnimationHook = callback;
      frames[frames.length - 1].callHookIfExpired = true;
   }

   return new Animation(id, frames, false);
}
