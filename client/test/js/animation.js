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

function AnimationMachine() {
   this.nextId = 0;
   this.animationLookup = {};

   // This machine handles long animations by putthing it in whatever bucket it belongs in
   //  and then just not evaluating it if it is not active until the next iteration.
   // Each bucket represents the animations that need to take place within the
   //  next |this.animationBucketTime| ms.
   this.numAnimationBuckets = 20;
   this.animationBucketTime = 100;
   this.animationBuckets = [];
   this.currentBucket = 0;
   this.bucketStartTime = 0;

   for (var i = 0; i < this.numAnimationBuckets; i++) {
      this.animationBuckets[i] = [];
   }
}

AnimationMachine.prototype.start = function() {
   this.bucketStartTime = Date.now();
};

// Returns the unique id for the animaiton.
AnimationMachine.prototype.addAnimation = function(animation) {
   var id = this.nextId++;

   var now = Date.now();
   var duration = animation.advance();
   var animationTime = now + duration;

   var bucket = (this.currentBucket + Math.floor(duration / this.animationBucketTime)) % this.numAnimationBuckets;

   this.animationLookup[id] = {bucket: bucket, animation: animation};
   this.animationBuckets[bucket].push({id: id, time: animationTime, animation: animation});
};

// TODO(eriq): This does not handle long deltas (from an inactive tab) well.
AnimationMachine.prototype.maybeAnimate = function() {
   var now = Date.now();
   var delta = now - this.bucketStartTime;

   // Move through all buckets between |this.currentBucket| and |endBucket| (inclusivley).
   var absoluteBucketDelta = Math.floor(delta / this.animationBucketTime);
   var endBucket = (this.currentBucket + absoluteBucketDelta) % this.numAnimationBuckets;

   for (var i = 0; i <= absoluteBucketDelta; i++) {
      var bucket = (this.currentBucket + i) % this.numAnimationBuckets;
      var toRemove = [];

      for (var j = 0; j < this.animationBuckets[bucket].length; j++) {
         if (this.animationBuckets[bucket][j].time <= now) {
            var duration = this.animationBuckets[bucket][j].animation.advance();
            toRemove.push({index: j, duration: duration});
         }
      }

      // Remove all the used animations, and possibly reschedule them.
      for (var j = toRemove.length - 1; j >= 0; j--) {
         var removedAnimation = this.animationBuckets[bucket].splice(toRemove[j].index, 1)[0];

         if (toRemove[j].duration == 0) {
            delete this.animationLookup[removedAnimation.id];
         } else {
            var bucketDelta = Math.floor(toRemove[j].duration / this.animationBucketTime);
            var nextBucket = (this.currentBucket + Math.min(bucketDelta, absoluteBucketDelta)) % this.numAnimationBuckets;

            removedAnimation.time = now + toRemove[j].duration;

            this.animationLookup[removedAnimation.id].bucket = nextBucket;
            this.animationBuckets[nextBucket].push(removedAnimation);
         }
      }
   }

   if (absoluteBucketDelta != 0) {
      this.currentBucket = endBucket;
      this.bucketStartTime = now;
   }
};

// TODO(eriq): Is it faster to hold the element, or pass the id?
function Animation(objectId, frames, repeat) {
   this.objectId = objectId;
   this.frames = frames || [];
   this.repeat = repeat || false;

   this.currentFrame = -1;
};

// Return the next duration for this animation, or 0 if the animation is done.
Animation.prototype.advance = function() {
   if (this.currentFrame >= this.frames.length) {
      // This should never happen.
      return 0;
   }

   if (this.currentFrame != -1) {
      $('#' + this.objectId).removeClass(this.frames[this.currentFrame].animationClass);

      if (this.frames[this.currentFrame].postAnimationHook) {
         this.frames[this.currentFrame].postAnimationHook.call();
      }
   }

   this.currentFrame++;

   if (this.currentFrame == this.frames.length) {
      if (!this.repeat) {
         return 0;
      }

      this.currentFrame = 0;
   }

   $('#' + this.objectId).addClass(this.frames[this.currentFrame].animationClass);

   return this.frames[this.currentFrame].duration;
};

function AnimationFrame(animationClass, duration, postAnimationHook) {
   this.animationClass = animationClass;
   this.duration = duration;
   this.postAnimationHook = postAnimationHook;
}
