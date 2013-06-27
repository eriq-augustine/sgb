"use strict";

var GEM_ANIMATION_LENGTH = 100;

// Get an animation for a stndard gem.
function normalGemAnimation(color, id) {
   return new Animation(id,
                        [new AnimationFrame('animation-gem-normal-' + color + '-0', GEM_ANIMATION_LENGTH),
                         new AnimationFrame('animation-gem-normal-' + color + '-1', GEM_ANIMATION_LENGTH),
                         new AnimationFrame('animation-gem-normal-' + color + '-2', GEM_ANIMATION_LENGTH),
                         new AnimationFrame('animation-gem-normal-' + color + '-3', GEM_ANIMATION_LENGTH)],
                        true);
}
