"use strict";

var NORMAL_DESTRUCTION_ANIMATION_LENGTH = 50;

var NUM_DESTRUCTION_FRAMES = 10;

// Get the destruction animation.
function destructionAnimation(type, color, id, callback) {
   var frames = getDestructionFrames(type, color);

   if (callback) {
      frames[frames.length - 1].postAnimationHook = callback;
      frames[frames.length - 1].callHookIfExpired = true;
   }

   return new Animation(id, frames, false);
}

function getDestructionFrames(type, color) {
   switch (type) {
      case Gem.TYPE_NORMAL:
      case Gem.TYPE_LOCKED:
         return getNormalDestructionFrames(color);
         break;
      case Gem.TYPE_DESTROYER:
         return getDestroyerDestructionFrames(color);
         break;
      case Gem.TYPE_STAR:
         return getStarDestructionFrames();
         break;
      default:
         error('Unknown gem type: ' + type);
         break;
   }
}

function getNormalDestructionFrames(color) {
   var frames = [];

   for (var i = 0; i < NUM_DESTRUCTION_FRAMES; i++) {
      frames.push(new AnimationFrame('animation-gem-normal-destroy-' + color + '-' + i,
                                     NORMAL_DESTRUCTION_ANIMATION_LENGTH,
                                     true /* expire */));
   }

   return frames;
}

function getDestroyerDestructionFrames(color) {
   var frames = [];

   for (var i = 0; i < NUM_DESTRUCTION_FRAMES; i++) {
      frames.push(new AnimationFrame('animation-gem-destroyer-destroy-' + color + '-' + i,
                                     NORMAL_DESTRUCTION_ANIMATION_LENGTH,
                                     true /* expire */));
   }

   return frames;
}

function getStarDestructionFrames() {
   var frames = [];

   for (var i = 0; i < NUM_DESTRUCTION_FRAMES; i++) {
      frames.push(new AnimationFrame('animation-gem-star-destroy-' + i,
                                     NORMAL_DESTRUCTION_ANIMATION_LENGTH,
                                     true /* expire */));
   }

   return frames;
}
