Gem.STAR_CHANCE = 0.05;
Gem.DESTROYER_CHANCE = 0.20;

Gem.TYPE_NORMAL = 0;
Gem.TYPE_DESTROYER = 1;
Gem.TYPE_LOCKED = 2;
Gem.TYPE_STAR = 3;
Gem.NUM_TYPES = 4;

Gem.COLOR_RED = 0;
Gem.COLOR_YELLOW = 1;
Gem.COLOR_GREEN = 2;
Gem.COLOR_BLUE = 3;
Gem.NUM_COLORS = 4;

DropGroup.ORIENTATION_UP = 0;
DropGroup.ORIENTATION_RIGHT = 1;
DropGroup.ORIENTATION_DOWN = 2;
DropGroup.ORIENTATION_LEFT = 3;
DropGroup.NUM_ORIENTATIONS = 4;

DropGroup.PIVOT_FIRST = 0;
DropGroup.PIVOT_SECOND = 1;
DropGroup.NUM_PIVOTS = 2;

Gem.MAX_COUNTER = 5;

// Used to give unique ids to gems.
var gemCount = 0;

function Gem(type) {
   this.type = type;
   this.count = gemCount++;
}

// All gems can be hashed which will aid in creating a hash of the board.
// The hash schedme is fairly simplistic.
Gem.prototype.hash = function() {
   return 'gem-' + this.type;
};

function ColorGem(type, color) {
   Gem.call(this, type);
   this.color = color;
}
ColorGem.prototype = new Gem();
ColorGem.prototype.constructor = ColorGem;

ColorGem.prototype.hash = function() {
   return Gem.prototype.hash.call(this) + '-color-' + this.color;
};

// The standard style gem.
function NormalGem(color) {
   ColorGem.call(this, Gem.TYPE_NORMAL, color);
}
NormalGem.prototype = new ColorGem();
NormalGem.prototype.constructor = NormalGem;

// Standard destroyers.
function Destroyer(color) {
   ColorGem.call(this, Gem.TYPE_DESTROYER, color);
}
Destroyer.prototype = new ColorGem();
Destroyer.prototype.constructor = Destroyer;

Destroyer.prototype.hash = function() {
   return ColorGem.prototype.hash.call(this) + '-destroyer';
};

// A locked gem, keeps track of its own counter.
function LockedGem(color, counter) {
   ColorGem.call(this, Gem.TYPE_LOCKED, color);
   this.counter = counter || Gem.MAX_COUNTER;
}
LockedGem.prototype = new ColorGem();
LockedGem.prototype.constructor = LockedGem;

LockedGem.prototype.hash = function() {
   return ColorGem.prototype.hash.call(this) + '-locked-' + this.counter;
};

// Destroyers all of the color it lands on.
function Star() {
   Gem.call(this, Gem.TYPE_STAR);
}
Star.prototype = new Gem();
Star.prototype.constructor = Star;

Star.prototype.hash = function() {
   return Gem.prototype.hash.call(this) + '-star';
};

// TODO(eriq): construct from message
function DropGroup(marshaledGroup) {
   if (marshaledGroup) {
      this.firstGem = constructGem(marshaledGroup[0]);
      this.secondGem = constructGem(marshaledGroup[1]);
   } else {
      debug('Attempting to create a drop group from nothing.');
      this.firstGem = nextGem();
      this.secondGem = nextGem();
   }

   // Orientation is always from first to second.
   this.orientation = DropGroup.ORIENTATION_DOWN;
}

function constructGem(marshaledGem) {
   switch (marshaledGem.Type) {
      case Gem.TYPE_NORMAL:
         return new NormalGem(marshaledGem.Color);
         break;
      case Gem.TYPE_DESTROYER:
         return new Destroyer(marshaledGem.Color);
         break;
      case Gem.TYPE_LOCKED:
         return new LockedGem(marshaledGem.Color, marshaledGem.Timer);
         break;
      case Gem.TYPE_STAR:
         return new Star();
         break;
      default:
         error('Unknown gem type: ' + marshaledGem.Type);
         return null;
   }
}

function orientationDelta(orientation) {
   switch (orientation) {
      case DropGroup.ORIENTATION_UP:
         return {row: -1, col: 0};
         break;
      case DropGroup.ORIENTATION_RIGHT:
         return {row: 0, col: 1};
         break;
      case DropGroup.ORIENTATION_DOWN:
         return {row: 1, col: 0};
         break;
      case DropGroup.ORIENTATION_LEFT:
         return {row: 0, col: -1};
         break;
      default:
         error('Unknown orientation: ' + orientation);
         return null;
   }
}

// TODO(eriq): Get seed from server.
// There is a constant chance that the gem will be a destroyer.
function nextGem() {
   var color = Math.floor(Math.random() * Gem.NUM_COLORS);

   var rand = Math.random();

   if (rand <= Gem.STAR_CHANCE) {
      return new Star();
   } else if (rand <= Gem.DESTROYER_CHANCE) {
      return new Destroyer(color);
   } else {
      return new NormalGem(color);
   }
}
