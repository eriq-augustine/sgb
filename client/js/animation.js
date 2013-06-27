"use strict";

function AnimationMachine() {
   this.nextId = 0;
   this.animationLookup = {};

   // This machine handles long animations by putting it in whatever bucket it belongs in
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

AnimationMachine.prototype.removeAnimation = function(animationId) {
   var bucket = this.animationLookup[animationId].bucket;
   this.animationLookup[animationId].animation.removeFrame();
   delete this.animationLookup.animationId;

   // TODO(eriq): the buckets are arrays, remove from them
   for (var i = 0; i < this.animationBuckets[bucket].length; i++) {
      if (this.animationBuckets[bucket][i].id == animationId) {
         this.animationBuckets[bucket].splice(i, 1);
         break;
      }
   }
};

// Returns the unique id for the animaiton.
// This id is critical if you want to stop the animation early.
AnimationMachine.prototype.addAnimation = function(animation) {
   var id = this.nextId++;

   var now = Date.now();
   var duration = animation.advance();
   var animationTime = now + duration;

   var bucket = (this.currentBucket + Math.floor(duration / this.animationBucketTime)) % this.numAnimationBuckets;

   this.animationLookup[id] = {bucket: bucket, animation: animation};
   this.animationBuckets[bucket].push({id: id, time: animationTime, animation: animation});

   return id;
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

// Remove the current animation frame from the target.
Animation.prototype.removeFrame = function() {
   //TEST
   console.log('remove');

   if (this.currentFrame != -1) {
      //TEST
      console.log('remove ' + this.frames[this.currentFrame].animationClass + ' from ' + this.objectId);

      $('#' + this.objectId).removeClass(this.frames[this.currentFrame].animationClass);

      if (this.frames[this.currentFrame].postAnimationHook) {
         this.frames[this.currentFrame].postAnimationHook.call();
      }
   }
};

// Return the next duration for this animation, or 0 if the animation is done.
Animation.prototype.advance = function() {
   if (this.currentFrame >= this.frames.length) {
      // This should never happen.
      return 0;
   }

   this.removeFrame();
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
