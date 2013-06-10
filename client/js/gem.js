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

function Gem(type) {
   this.type = type;
}

function NormalGem(color) {
   Gem.call(Gem.TYPE_NORMAL);
   this.color = color;
}
NormalGem.prototype = new Gem();
NormalGem.prototype.constructor = NormalGem;

function Destroyer(color) {
   Gem.call(Gem.TYPE_DESTROYER);
   this.color = color;
}
Destroyer.prototype = new Gem();
Destroyer.prototype.constructor = Destroyer;

function LockedGem(color) {
   Gem.call(Gem.TYPE_LOCKED);
   this.color = color;
   this.counter = Gem.MAX_COUNTER;
}
LockedGem.prototype = new Gem();
LockedGem.prototype.constructor = LockedGem;

function Star() {
   Gem.call(Gem.TYPE_STAR);
}
Star.prototype = new Gem();
Star.prototype.constructor = Star;

function DropGroup() {
   this.firstGem = nextGem();
   this.secondGem = nextGem();

   // Orientation is always from first to second.
   this.orientation = DropGroup.ORIENTATION_DOWN;
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
function nextGem() {
   return new NormalGem(Math.floor(Math.random() * Gem.NUM_COLORS));
}
