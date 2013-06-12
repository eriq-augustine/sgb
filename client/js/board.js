"use strict";

var boardLookup = {};

function addBoard(board) {
   if (!spfGet('_boardLookup_')) {
      spfSet('_boardLookup_', {});
   }

   spfGet('_boardLookup_')[board.id] = board;
}

function getBoard(id) {
   if (spfGet('_boardLookup_')) {
      return spfGet('_boardLookup_')[id];
   }

   return undefined;
}

// TODO(eriq): Delete board on destruction.
function removeBoard(id) {
   if (spfGet('_boardLookup_')) {
      delete spfGet('_boardLookup_')[id];
   }
}

function Board(id, height, width) {
   this.DROP_COLUMN = 3;

   this.id = id;
   this.height = height;
   this.width = width;

   this.dropGroup = null;
   // TODO(eriq): Should the gem maintain it's own location?
   // The location of the first gem in the drop group.
   this.dropGroupLocation = null;

   this._board_ = [];
   for (var i = 0; i < height; i++) {
      this._board_[i] = [];

      for (var j = 0; j < width; j++) {
         this._board_[i][j] = null;
      }
   }

   addBoard(this);
   requestInitBoard(this.id);
}

// TODO(eriq): Also check end game during punishment.
Board.prototype.releaseGem = function() {
   this.dropGroup = new DropGroup();
   this.dropGroupLocation = {row: 0, col: this.DROP_COLUMN}

   var delta = orientationDelta(this.dropGroup.orientation);

   if (this.getGem(0, this.DROP_COLUMN) || this.getGem(1, this.DROP_COLUMN)) {
      loseGame();
      return false;
   }

   this.placeGem(this.dropGroup.firstGem,
                 this.dropGroupLocation.row,
                 this.dropGroupLocation.col);
   this.placeGem(this.dropGroup.secondGem,
                 this.dropGroupLocation.row + delta.row,
                 this.dropGroupLocation.col + delta.col);

   return true;
};

Board.prototype.getDropGemLocations = function() {
   if (this.dropGroup == null) {
      error("There is no drop gem to get the location of.");
      return null;
   }

   var delta = orientationDelta(this.dropGroup.orientation);

   var firstGem = this.dropGroupLocation;
   var secondGem = {row: this.dropGroupLocation.row + delta.row,
                    col: this.dropGroupLocation.col + delta.col};

   return {first: firstGem, second: secondGem};
};

// Drop the drop group all the way.
Board.prototype.advanceDropGroupFull = function() {
   // Note(eriq): This is fairly inefficient (moving by one each time).
   while (this.moveDropGroup(1, 0)) {}

   dropComplete();
   this.dropGroup = null;
   this.dropGroupLocation = null;
};

Board.prototype.advanceDropGroup = function() {
   if (!this.moveDropGroup(1, 0)) {
      // TODO(eriq): Make sure
      dropComplete();
      this.dropGroup = null;
      this.dropGroupLocation = null;

      return false;
   }

   return true;
};

Board.prototype.moveDropGroup = function(rowDelta, colDelta) {
   if (!this.canMoveDropGroup(rowDelta, colDelta)) {
      return false;
   }

   var dropGems = this.getDropGemLocations();

   // Because we don't want to have to check the orientations,
   //  just remove both then place them.
   var firstGem = this.clearGem(dropGems.first.row, dropGems.first.col);
   var secondGem = this.clearGem(dropGems.second.row, dropGems.second.col);

   this.placeGem(firstGem, dropGems.first.row + rowDelta, dropGems.first.col + colDelta);
   this.placeGem(secondGem, dropGems.second.row + rowDelta, dropGems.second.col + colDelta);

   this.dropGroupLocation.row = this.dropGroupLocation.row + rowDelta;
   this.dropGroupLocation.col = this.dropGroupLocation.col + colDelta;

   return true;
};

Board.prototype.canMoveDropGroup = function(rowDelta, colDelta) {
   if (this.dropGroup === null) {
      return false;
   }

   if (rowDelta != 0 && colDelta != 0) {
      error('Cannot move diagonally');
      return false;
   }

   if (rowDelta == 0 && colDelta == 0) {
      return true;
   }

   if (rowDelta < 0) {
      error('Cannot move up.');
      return false;
   }

   if (Math.abs(rowDelta) > 1 || Math.abs(colDelta) > 1) {
      // TODO(eriq): Possibly reconsider for a fast drop.
      error('Cannot move more than one at a time.');
      return false;
   }

   var toCheck = [];

   var dropGems = this.getDropGemLocations();

   if (rowDelta != 0 &&
       this.dropGroup.orientation === DropGroup.ORIENTATION_UP) {
      toCheck.push(dropGems.first);
   } else if (rowDelta != 0 &&
              this.dropGroup.orientation === DropGroup.ORIENTATION_DOWN) {
      toCheck.push(dropGems.second);
   } else if (colDelta === 1 &&
              this.dropGroup.orientation === DropGroup.ORIENTATION_LEFT) {
      toCheck.push(dropGems.first);
   } else if (colDelta === -1 &&
              this.dropGroup.orientation === DropGroup.ORIENTATION_LEFT) {
      toCheck.push(dropGems.second);
   } else if (colDelta === 1 &&
              this.dropGroup.orientation === DropGroup.ORIENTATION_RIGHT) {
      toCheck.push(dropGems.second);
   } else if (colDelta === -1 &&
              this.dropGroup.orientation === DropGroup.ORIENTATION_RIGHT) {
      toCheck.push(dropGems.first);
   } else {
      toCheck.push(dropGems.first);
      toCheck.push(dropGems.second);
   }

   for (var i = 0; i < toCheck.length; i++) {
      if (!this.validMoveLocation(toCheck[i].row + rowDelta, toCheck[i].col + colDelta)) {
         return false;
      }
   }

   return true;
};

Board.prototype.inBounds = function(row, col) {
   return !(row < 0 || row >= this.height || col < 0 || col >= this.width);
};

// Is the given location valid to move into?
Board.prototype.validMoveLocation = function(row, col) {
   if (!this.inBounds(row, col)) {
      return false;
   }

   return this.getGem(row, col) === null;
};

// TODO(eriq): Get direction and pivot from preferences.
Board.prototype.changeDropOrientation = function() {
   if (this.dropGroup) {
      this.changeDropOrientationImpl(true, DropGroup.PIVOT_FIRST);
   }
};

Board.prototype.changeDropOrientationImpl = function(clockwise, pivot) {
   if (pivot < 0 || pivot >= DropGroup.NUM_PIVOTS) {
      error("Invalid pivot (" + pivot + ").");
      return false;
   }

   var orientationTurn = clockwise ? 1 : -1;

   var newOrientation =
      (this.dropGroup.orientation + DropGroup.NUM_ORIENTATIONS + orientationTurn) %
      DropGroup.NUM_ORIENTATIONS;

   var delta = orientationDelta(newOrientation);
   var oldSpot = null;
   var newSpot = null;
   var pivotSpot = null;

   var dropGems = this.getDropGemLocations();
   // New spot is the pivots spot plus the orientation delta.
   if (pivot === DropGroup.PIVOT_FIRST) {
      pivotSpot = dropGems.first;
      oldSpot = dropGems.second;
      newSpot = {row: pivotSpot.row + delta.row,
                 col: pivotSpot.col + delta.col};
   } else {
      pivotSpot = dropGems.second;
      oldSpot = dropGems.first;
      newSpot = {row: pivotSpot.row + delta.row,
                 col: pivotSpot.col + delta.col};
   }

   // If the spot we are horizontally pivoting into is taken (or
   //  past the wall, then slide the piece over if possible).
   //  Allowing for a vertical slide can cause an infinite stall.
   if (delta.col != 0 && !this.validMoveLocation(newSpot.row, newSpot.col)) {
      // Move in the opposite direction as the position.
      var slideDelta = delta.col * -1;

      // No need to check the orientation for the outside gem,
      //  just check both. If they are both occupied, then there
      //  is a blockage.
      if (this.validMoveLocation(pivotSpot.row, pivotSpot.col + slideDelta) ||
          this.validMoveLocation(newSpot.row, newSpot.col + slideDelta)) {
         // Can slide.
         pivotSpot = {row: pivotSpot.row, col: pivotSpot.col + slideDelta};
         newSpot = {row: newSpot.row, col: newSpot.col + slideDelta};

         if (pivot === DropGroup.PIVOT_FIRST) {
            var firstGem = this.clearGem(dropGems.first.row, dropGems.first.col);
            var secondGem = this.clearGem(dropGems.second.row, dropGems.second.col);
            this.placeGem(firstGem, pivotSpot.row, pivotSpot.col);
            this.placeGem(secondGem, newSpot.row, newSpot.col);
         } else {
            var firstGem = this.clearGem(dropGems.first.row, dropGems.first.col);
            var secondGem = this.clearGem(dropGems.second.row, dropGems.second.col);
            this.placeGem(firstGem, newSpot.row, newSpot.col);
            this.placeGem(secondGem, pivotSpot.row, pivotSpot.col);
         }
      } else {
         // Blockage, just swap.
         var firstGem = this.clearGem(dropGems.first.row, dropGems.first.col);
         var secondGem = this.clearGem(dropGems.second.row, dropGems.second.col);
         this.placeGem(firstGem, dropGems.second.row, dropGems.second.col);
         this.placeGem(secondGem, dropGems.first.row, dropGems.first.col);

         // Orientation is currently vertical, get the next vertical.
         newOrientation = (this.dropGroup.orientation + 2) % DropGroup.NUM_ORIENTATIONS;

         if (pivot === DropGroup.PIVOT_FIRST) {
            pivotSpot = dropGems.second;
            newSpot = dropGems.first;
         } else {
            pivotSpot = dropGems.first;
            newSpot = dropGems.second;
         }
      }
   // It is possible to run into this situation from a horozontal orientation.
   } else if (delta.row != 0 && !this.validMoveLocation(newSpot.row, newSpot.col)) {
      // Vertical slides are disallowed, but we can still swap.
      var firstGem = this.clearGem(dropGems.first.row, dropGems.first.col);
      var secondGem = this.clearGem(dropGems.second.row, dropGems.second.col);
      this.placeGem(firstGem, dropGems.second.row, dropGems.second.col);
      this.placeGem(secondGem, dropGems.first.row, dropGems.first.col);

      // Orientation is currently horizontal, get the next horizontal.
      newOrientation = (this.dropGroup.orientation + 2) % DropGroup.NUM_ORIENTATIONS;

      if (pivot === DropGroup.PIVOT_FIRST) {
         pivotSpot = dropGems.second;
         newSpot = dropGems.first;
      } else {
         pivotSpot = dropGems.first;
         newSpot = dropGems.second;
      }
   } else {
      this.moveGem(oldSpot.row, oldSpot.col, newSpot.row, newSpot.col);
   }

   // Update the orientation.
   this.dropGroup.orientation = newOrientation;

   // Update the internal location.
   if (pivot !== DropGroup.PIVOT_FIRST) {
      this.dropGroupLocation = newSpot;
   } else {
      this.dropGroupLocation = pivotSpot;
   }

   return true;
};

// Move all unsupported gems down until they are supported.
// Returns true if a srop occured.
Board.prototype.dropUnsupported = function() {
   var iterationDropped = true;
   var dropped = false;

   while (iterationDropped) {
      iterationDropped = false;

      // Start at the second to bottom row (bottom one does not need to drop).
      for (var i = this.height - 2; i >= 0; i--) {
         for (var j = 0; j < this.width; j++) {
            // If there is a gem here and not bellow it, then drop.
            if (this.getGem(i, j) && !this.getGem(i + 1, j)) {
               this.moveGem(i, j, i + 1, j);
               iterationDropped = true;
               dropped = true;
            }
         }
      }
   }

   return dropped;
};

// NOTE(eriq): There are many inefficiencies in this.
Board.prototype.attemptDestroy = function() {
   var destroyers = this.collectDestroyers();

   var gemsByColor = null;
   if (destroyers.stars.length > 0) {
      gemsByColor = this.collectByColor();
   }

   // Keep a map and not a list so there are no dupes {(row * this.width + col): true}.
   var toDestroy = {};

   // Handle stars
   for (var i = 0; i < destroyers.stars.length; i++) {
      var star = destroyers.stars[i];
      toDestroy[(star.row * this.width) + star.col] = true;

      // Check the bellow gem for color.
      if (this.inBounds(star.row + 1, star.col)) {
         var gem = this.getGem(star.row + 1, star.col);

         // Depending on the rules of the game, it may be possible to have
         //  two stars out at a time. In this case, just don't do anthing
         //  with the upper star, the lower one will take care of the work.
         if (gem.type === Gem.TYPE_STAR) {
            continue;
         }

         if (!gem) {
            error('Tried to destroy with a star before a full drop.');
            return 0;
         }

         gemsByColor[gem.color].forEach(function(colorGem) {
            toDestroy[(colorGem.row * this.width) + colorGem.col] = true;
         }, this);
      } else {
         // Just destroy the gem.
         // NOTE(eriq): This should accumulate extra points.
      }
   }

   // Handle standard destroyers.
   destroyers.destroyers.forEach(function(destroyer) {
      var connectedGems = this.getConnectedByColor(destroyer.row, destroyer.col);
      if (connectedGems.length > 1) {
         connectedGems.forEach(function(gem) {
            toDestroy[(gem.row * this.width) + gem.col] = true;
         }, this);
      }
   }, this);

   var destroyed = 0;

   // TODO(eriq): Fancy animation.
   for (var index in toDestroy) {
      this.clearGem(Math.floor(index / this.width), index - (Math.floor(index / this.width) * this.width));
      destroyed++;
   }

   return destroyed;
};

// This will also get the starting gem.
// Returns a list of gems: [{gem: <gem>, row: <row>, col: <col>}].
Board.prototype.getConnectedByColor = function(sourceRow, sourceCol) {
   var sourceGem = this.getGem(sourceRow, sourceCol);

   if (!sourceGem) {
      error('There is no source gem.');
      return null;
   }

   var gems = {};
   gems[(sourceRow * this.width) + sourceCol] = {gem: sourceGem, row: sourceRow, col: sourceCol};
   var searchStack = [{row: sourceRow, col: sourceCol}];

   var offsets = [{row: 1, col: 0}, {row: -1, col: 0}, {row: 0, col: 1}, {row: 0, col: -1}];

   while (searchStack.length > 0) {
      var searchSpot = searchStack.pop();

      offsets.forEach(function(offset) {
         var row = searchSpot.row + offset.row;
         var col = searchSpot.col + offset.col;

         if (this.inBounds(row, col) && !(((row * this.width) + col) in gems)) {
            var gem = this.getGem(row, col);
            if (gem && gem.color === sourceGem.color) {
               searchStack.push({row: row, col: col});
               gems[(row * this.width) + col] = {gem: gem, row: row, col: col};
            }
         }
      }, this);
   }

   var rtn = [];
   for (var index in gems) {
      rtn.push(gems[index]);
   }

   return rtn;
};

Board.prototype.collectByColor = function() {
   var gems = {};

   for (var color = 0; color < Gem.NUM_COLORS; color++) {
      gems[color] = [];
   }

   for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
         var gem = this.getGem(i, j);

         if (gem && gem.type !== Gem.TYPE_STAR) {
            gems[gem.color].push({row: i, col: j, gem: gem});
         }
      }
   }

   return gems;
};

Board.prototype.collectDestroyers = function() {
   // Could potentially keep track of all the destroyers/stars to speed this up.
   var destroyers = [];
   var stars = [];

   for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
         var gem = this.getGem(i, j);
         if (gem && gem.type === Gem.TYPE_DESTROYER) {
            destroyers.push({gem: gem, row: i, col: j});
         } else if (gem && gem.type === Gem.TYPE_STAR) {
            stars.push({gem: gem, row: i, col: j});
         }
      }
   }

   return {stars: stars, destroyers: destroyers};
};

// null if no gem.
Board.prototype.getGem = function(row, col) {
   if (!this.inBounds(row, col)) {
      error("Gem retrieval out-of-bounds. Requested (" + row + ", " + col +
            "). Dimensions: " + this.height + " x " + this.width + ".");
      return null;
   }

   return this._board_[row][col];
}

// A convince function to use instead of using clearGem() then placeGem().
Board.prototype.moveGem = function(fromRow, fromCol, toRow, toCol) {
   var gem = this.clearGem(fromRow, fromCol);
   return this.placeGem(gem, toRow, toCol);
};

// This is a key rendering function.
// This should be the ONLY way that gems are placed on |this._board_|.
// NOTE: This function disallows overriding gems.
//  That is a rare situation that should ONLY happen as a gem falls vertically.
//  The lower gem should be cleared using clearGem() first.
Board.prototype.placeGem = function(gem, row, col) {
   if (!this.inBounds(row, col)) {
      error("Gem placement out-of-bounds. Requested (" + row + ", " + col +
            "). Dimensions: " + this.height + " x " + this.width + ".");
      return false;
   }

   if (this._board_[row][col] != null) {
      error("Double placed gem at (" + row + ", " + col + ").");
      return false;
   }

   this._board_[row][col] = gem;

   requestCellRender(this.id, row, col);

   return true;
};

// This should be the ONLY way that gems are cleared from the board.
// It is an error to try to remove a gem that doesn't exist.
Board.prototype.clearGem = function(row, col) {
   if (!this.inBounds(row, col)) {
      error("Gem removal out-of-bounds. Requested (" + row + ", " + col +
            "). Dimensions: " + this.height + " x " + this.width + ".");
      return null;
   }

   if (this._board_[row][col] == null) {
      error("Removal of non-existant gem at (" + row + ", " + col + ").");
      return null;
   }

   var tempGem = this._board_[row][col];
   this._board_[row][col] = null;

   requestCellRender(this.id, row, col);

   return tempGem;
};
