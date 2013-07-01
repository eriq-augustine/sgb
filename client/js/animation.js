"use strict";

// Must be larger than every animation frame.
AnimationMachine.WINDOW_SIZE = 5 * 1000;

// Must be smaller than every animation frame.
AnimationMachine.BUCKET_SIZE = 20;

AnimationMachine.NUM_BUCKETS = AnimationMachine.WINDOW_SIZE / AnimationMachine.BUCKET_SIZE;

function AnimationMachine() {
   this.nextId = 0;
   this.animationLookup = {};

   this.bucketStartTime = 0;
   this.currentBucket = 0;
   this.buckets = [];

   for (var i = 0; i < AnimationMachine.NUM_BUCKETS; i++) {
      this.buckets[i] = [];
   }
}

AnimationMachine.prototype.start = function() {
   this.bucketStartTime = Date.now();
};

AnimationMachine.prototype.removeAnimation = function(animationId) {
   var bucket = this.animationLookup[animationId].bucket;
   this.animationLookup[animationId].animation.removeFrame();
   delete this.animationLookup.animationId;

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

   var bucket = (this.currentBucket + Math.floor(duration / AnimationMachine.BUCKET_SIZE)) % AnimationMachine.NUM_BUCKETS;

   this.animationLookup[id] = {bucket: bucket, animation: animation};
   this.buckets[bucket].push({id: id, animation: animation});

   return id;
};

AnimationMachine.prototype.maybeAnimate = function() {
   var now = Date.now();
   var delta = now - this.bucketStartTime;

   // Move through all buckets between |this.currentBucket| and |endBucket| (inclusivley).
   var absoluteBucketDelta = Math.floor(delta / AnimationMachine.BUCKET_SIZE);
   // TODO(eriq): What happens when all buckets need to be iterated?
   //  Buckets will get cut off.
   var endBucket = (this.currentBucket + absoluteBucketDelta) % AnimationMachine.NUM_BUCKETS;

   for (var i = 0; i <= absoluteBucketDelta; i++) {
      var bucket = (this.currentBucket + i) % AnimationMachine.NUM_BUCKETS;

      var animation = null;
      while (animation = this.buckets[bucket].shift()) {
         var duration = animation.animation.advance();

         if (duration == 0) {
            delete this.animationLookup[animation.id];
         } else {
            var bucketDelta = Math.floor(duration / AnimationMachine.BUCKET_SIZE);
            // Must always advance at least one bucket.
            var nextBucket = (bucket + Math.max(1, bucketDelta)) % AnimationMachine.NUM_BUCKETS;

            this.animationLookup[animation.id].bucket = nextBucket;
            this.buckets[nextBucket].push(animation);
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
Animation.prototype.removeFrame = function(element) {
   element = element || $('#' + this.objectId);

   if (this.currentFrame != -1) {
      element.removeClass(this.frames[this.currentFrame].animationClass);

      if (this.frames[this.currentFrame].postAnimationHook) {
         this.frames[this.currentFrame].postAnimationHook.call(true);
      }
   }
};

// Return the next duration for this animation, or 0 if the animation is done.
Animation.prototype.advance = function(now) {
   if (this.currentFrame >= this.frames.length) {
      // This should never happen.
      return 0;
   }

   var delta = now - this.lastFrameStart;
   var element = $('#' + this.objectId);

   this.removeFrame(element);

   do {
      this.currentFrame++;

      if (this.currentFrame == this.frames.length) {
         if (!this.repeat) {
            return 0;
         }

         this.currentFrame = 0;
      }

      // Go until the proper frame is found.
      delta -= this.frames[this.currentFrame].duration;

      // If the frame has expired, it still may want its callback to be invoked.
      if (delta > 0 && this.frames[this.currentFrame].expire &&
          this.frames[this.currentFrame].postAnimationHook &&
          this.frames[this.currentFrame].callHookIfExpired) {
         this.frames[this.currentFrame].postAnimationHook(false);
      }
   } while (delta > 0 && this.frames[this.currentFrame].expire);

   element.addClass(this.frames[this.currentFrame].animationClass);
   this.lastFrameStart = now;

   return this.frames[this.currentFrame].duration;
};

// If |expire|, the frame will be skipped if the duration has already passed.
// If |callHookIfExpired| is true, then |postAnimationHook| will always be called.
// The first parameter passed to |postAnimationHook| will be a boolean indicating
//  successfull completion of the frame (true if successful, false if canceled).
function AnimationFrame(animationClass,
                        duration,
                        expire,
                        postAnimationHook,
                        callHookIfExpired) {
   if (duration <= AnimationMachine.BUCKET_SIZE ||
       duration >= AnimationMachine.WINDOW_SIZE) {
      error('Invalid animation frame duration: ' + duration + '.' +
            ' Must be ' + AnimationMachine.BUCKET_SIZE + ' < duration < ' + AnimationMachine.WINDOW_SIZE);
   }

   this.animationClass = animationClass;
   this.duration = duration;
   this.expire = expire || false;
   this.postAnimationHook = postAnimationHook || null;
   this.callHookIfExpires = callHookIfExpired || false;
}
