"use strict";

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
}

Board.prototype.init = function() {
   var html = '<div class="inner-board">';

   for (var row = 0; row < this.height; row++) {
      html += '<div id="' + this.id + '-' + row + '" class="board-row board-row-' + row + '">';

      for (var col = 0; col < this.width; col++) {
         html += '<div id="' + this.id + '-' + row + '-' + col + '"' +
                 ' class="board-cell' +
                         ' board-cell-' + row + '-' + col +
                         ' board-col-' + col + '"></div>';
      }

      html += '</div>';
   }

   html += '</div>';

   $('#' + this.id).html(html);
};

// TODO(eriq): This is where end game is checked for (one of two places).
Board.prototype.releaseGem = function() {
   this.dropGroup = new DropGroup();
   this.dropGroupLocation = {row: 0, col: this.DROP_COLUMN}

   var delta = orientationDelta(this.dropGroup.orientation);

   this.placeGem(this.dropGroup.firstGem,
                 this.dropGroupLocation.row,
                 this.dropGroupLocation.col);
   this.placeGem(this.dropGroup.secondGem,
                 this.dropGroupLocation.row + delta.row,
                 this.dropGroupLocation.col + delta.col);
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
   var dropGems = this.getDropGemLocations();

   if (this.canMoveDropGroup(rowDelta, colDelta)) {
      // Because we don't want to have to check the orientations,
      //  just remove both then place them.
      var firstGem = this.clearGem(dropGems.first.row, dropGems.first.col);
      var secondGem = this.clearGem(dropGems.second.row, dropGems.second.col);

      this.placeGem(firstGem, dropGems.first.row + rowDelta, dropGems.first.col + colDelta);
      this.placeGem(secondGem, dropGems.second.row + rowDelta, dropGems.second.col + colDelta);

      this.dropGroupLocation.row = this.dropGroupLocation.row + rowDelta;
      this.dropGroupLocation.col = this.dropGroupLocation.col + colDelta;

      return true;
   }
   return false;
};

Board.prototype.canMoveDropGroup = function(rowDelta, colDelta) {
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

   toCheck.forEach(function(gemLocation) {
      if (!this.validMoveLocation(gemLocation.row + 1, gemLocation.col)) {
         return false;
      }
   }, this);

   return true;
};

// Is the given location valid to move into?
Board.prototype.validMoveLocation = function(row, col) {
   if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
      return false;
   }

   return this.getGem(row, col) === null;
};

// TODO(eriq): Get direction and pivot from preferences.
Board.prototype.changeDropOrientation = function() {
   this.changeDropOrientationImpl(true, DropGroup.PIVOT_FIRST);
};

Board.prototype.changeDropOrientationImpl = function(clockwise, pivot) {
   if (pivot < 0 || pivot >= DropGroup.NUM_PIVOTS) {
      error("Invalid pivot (" + pivot + ").");
      return false;
   }

   var orientationDelta = clockwise ? 1 : -1;

   var newOrientation =
      (this.dropGroup.orientation + DropGroup.NUM_ORIENTATIONS + 1) %
      DropGroup.NUM_ORIENTATIONS;

   var delta = orientationDelta(newOrientation);
   var oldSpot = null;
   var newSpot = null;

   // TODO(eriq): Deal with changes that can't happen because of blockages.
   // If there is room let it slide, otherwise just swap.

   if (pivot === DropGroup.PIVOT_FIRST) {
      var secondGemDelta = orientationDelta(this.dropGroup.orientation);
      var secondGemLocation =
         {row: this.dropGroupLocation.row + secondGemDelta.row,
          col: this.dropGroupLocation.col + secondGemDelta.col};
      oldSpot = secondGemLocation;
      newSpot = {row: oldSpot.row + delta.row,
                 col: colSpot.col + delta.col};
   } else {
      oldSpot = this.dropGroupLocation;
      newSpot = {row: oldSpot.row + delta.row,
                 col: colSpot.col + delta.col};
      this.dropGroupLocation = newSpot;
   }

   this.moveGem(oldSpot.row, oldSpot.col, newSpot.row, newSpot.col);

   return true;
};

// null if no gem.
Board.prototype.getGem = function(row, col) {
   if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      error("Gem retrieval out-of-bounds. Requested (" + row + ", " + col +
            "). Dimensions: " + this.height + " x " + this.width + ".");
      return null;
   }

   return this._board_[row][col];
}

// A convience function to use instead of using clearGem() then placeGem().
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
   if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      error("Gem placement out-of-bounds. Requested (" + row + ", " + col +
            "). Dimensions: " + this.height + " x " + this.width + ".");
      return false;
   }

   if (this._board_[row][col] != null) {
      error("Double placed gem at (" + row + ", " + col + ").");
      return false;
   }

   this._board_[row][col] = gem;

   requestCellRender(row, col);

   return true;
};

// This should be the ONLY way that gems are cleared from the board.
// It is an error to try to remove a gem that doesn't exist.
Board.prototype.clearGem = function(row, col) {
   if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
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

   requestCellRender(row, col);

   return tempGem;
};
