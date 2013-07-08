package board;

import (
   "io"
   "fmt"
   "crypto/md5"
   "com/eriqaugustine/spf/game/gem"
   "com/eriqaugustine/spf/game/constants"
);

type Board struct {
   Height int;
   Width int;
   Board [][]*gem.Gem;
};

type location struct {
   row int;
   col int;
};

func NewBoard(height int, width int) *Board {
   var gameBoard *Board = new(Board);

   gameBoard.Height = height;
   gameBoard.Width = width;
   gameBoard.Board = make([][]*gem.Gem, height);

   for i := 0; i < height; i++ {
      gameBoard.Board[i] = make([]*gem.Gem, width);
   }

   return gameBoard;
}

func (this *Board) AdvanceTimers() {
   for _, row := range this.Board {
      for _, lockedGem := range row {
         if lockedGem != nil && lockedGem.Type == gem.TYPE_LOCKED {
            lockedGem.Timer -= 1;
            if lockedGem.Timer == 0 {
               lockedGem.Type = gem.TYPE_NORMAL;
            }
         }
      }
   }
}

// Place all punishments and return the punishments.
// The second return is false on lose, however the gems will still be valid..
func (this *Board) Punish(dropPattern int, punishments int) (*[][]*gem.Gem, bool) {
   var punishmentGems [][]*gem.Gem = make([][]*gem.Gem, 0);
   var success bool = true;
   var gemPtr *[][]*gem.Gem;

   if punishments > 0 {
      gemPtr, success = gem.GetPunishmentGems(dropPattern, punishments, &this.Board);
      punishmentGems = *gemPtr;

      var baselines *[]int = gem.GetBaselines(&this.Board);
      for col, gems := range punishmentGems {
         for rowOffset, punishmentGem := range gems {
            this.Board[(*baselines)[col] - rowOffset][col] = punishmentGem;
         }
      }
   }

   return &punishmentGems, success;
}

// Return true if a drop can happen on the boad.
func (this *Board) CanDrop() bool {
   return this.Board[0][constants.DROP_COLUMN] == nil && this.Board[1][constants.DROP_COLUMN] == nil;
}

func (this *Board) Hash() string {
   var boardString string = "";

   for _, row := range this.Board {
      for _, boardGem := range row {
         if (boardGem == nil) {
            boardString += "_"
         } else {
            boardString += boardGem.Hash();
         }
      }
   }

   hash := md5.New();
   io.WriteString(hash, boardString);
   return fmt.Sprintf("%x", hash.Sum(nil));
}

func (this *Board) Serialize() map[string]gem.Gem {
   var rtn map[string]gem.Gem = make(map[string]gem.Gem);

   for i, row := range this.Board {
      for j, boardGem := range row {
         if (boardGem != nil) {
            rtn[fmt.Sprintf("%d-%d", i, j)] = *boardGem;
         }
      }
   }

   return rtn;
}

// Fall and destroy any blocks.
// Return the number of gems destroyed.
func (this *Board) Stabalize() int {
   var destroyed int = 0;

   // Just keep falling and destroying until nither happens.
   for {
      var fell bool = this.fall();
      var iterationDestroyed int = this.destroy();

      destroyed += iterationDestroyed;

      if !fell && (iterationDestroyed == 0) {
         break;
      }
   }

   return destroyed;
}

// Return true if any pieces fell.
func (this *Board) fall() bool {
   var iterationDropped bool = true;
   var dropped bool = false;

   for iterationDropped {
      iterationDropped = false;

      // Start at the second to last row.
      for i := this.Height - 2; i >= 0; i-- {
         for j := 0; j < this.Width; j++ {
            if this.Board[i][j] != nil && this.Board[i + 1][j] == nil {
               this.moveGem(i, j, i + 1, j);
               iterationDropped = true;
               dropped = true;
            }
         }
      }
   }

   return dropped;
}

// Return the number of gems that were destroyed.
func (this *Board) destroy() int {
   // Keep a map (not list (dupes)) of gems to be destroyed
   // {location: true};
   var toDestroy map[location]bool = make(map[location]bool);

   var destroyers *map[string][]location = this.collectDestroyers();

   // colors to be destroyed by stars.
   var starColors map[int]bool = make(map[int]bool);

   // Take care of stars first.
   for _, starLocation := range (*destroyers)["stars"] {
      toDestroy[starLocation] = true;

      // If the position below the star is in-bounds, then it must be occupied.
      // But, make sure that the below gem is not a star.
      if this.inBounds(starLocation.row + 1, starLocation.col) &&
         this.Board[starLocation.row + 1][starLocation.col].Type != gem.TYPE_STAR {
         starColors[this.Board[starLocation.row + 1][starLocation.col].Color] =
            true;
      } else {
         // Just destroy the star
         // Some extra points should probably be allocated here.
      }
   }

   var starColorLocations *[]location = this.collectColors(starColors);
   for _, location := range *starColorLocations {
      toDestroy[location] = true;
   }

   // Handle standard destroyers
   for _, destroyerLocation := range (*destroyers)["destroyers"] {
      var connected *[]location = this.getConnectedByColor(destroyerLocation);
      if len(*connected) > 1 {
         for _, connectedLocation := range *connected {
            toDestroy[connectedLocation] = true;
         }
      }
   }

   for destroyLocation, _ := range toDestroy {
      this.clearGem(destroyLocation.row, destroyLocation.col);
   }

   return len(toDestroy);
}

func (this *Board) collectColors(colors map[int]bool) *[]location {
   var rtn []location = make([]location, 0);

   for row, boardRow := range this.Board {
      for col, boardGem := range boardRow {
         if boardGem != nil && boardGem.Type != gem.TYPE_STAR && colors[boardGem.Color] {
            rtn = append(rtn, location{row, col});
         }
      }
   }

   return &rtn;
}

func (this *Board) getConnectedByColor(start location) *[]location {
   var locationSet map[location]bool = map[location]bool{start: true};

   // [[row, col], ...]
   var offsets [][]int =
      [][]int{[]int{1, 0}, []int{-1, 0}, []int{0, 1}, []int{0, -1}};

   var searchStack []location = []location{start};
   var startColor int = this.Board[start.row][start.col].Color;

   for len(searchStack) > 0 {
      var currentLocation location = searchStack[len(searchStack) - 1];
      searchStack = searchStack[:len(searchStack) - 1];

      for _, offset := range offsets {
         var row int = currentLocation.row + offset[0];
         var col int = currentLocation.col + offset[1];

         if this.inBounds(row, col) &&
            !locationSet[location{row, col}] &&
            this.Board[row][col] != nil &&
            this.Board[row][col].Color == startColor &&
            this.Board[row][col].Type != gem.TYPE_LOCKED {
               searchStack = append(searchStack, location{row, col});
               locationSet[location{row, col}] = true;
         }
      }
   }

   var rtn []location = make([]location, 0);
   for location, _ := range locationSet {
      rtn = append(rtn, location);
   }

   return &rtn;
}

// {'stars'|'destroyers': []location}
func (this *Board) collectDestroyers() *map[string][]location {
   var rtn map[string][]location = make(map[string][]location);
   rtn["stars"] = make([]location, 0);
   rtn["destroyers"] = make([]location, 0);

   for row, boardRow := range this.Board {
      for col, boardGem := range boardRow {
         if boardGem != nil {
            if boardGem.Type == gem.TYPE_STAR {
               rtn["stars"] = append(rtn["stars"], location{row, col});
            } else if boardGem.Type == gem.TYPE_DESTROYER {
               rtn["destroyers"] = append(rtn["destroyers"], location{row, col});
            }
         }
      }
   }

   return &rtn;
}

func (this *Board) inBounds(row int, col int) bool {
   return row >= 0 && row < this.Height &&
          col >= 0 && col < this.Width;
}

func (this *Board) AvailableSpot(row int, col int) bool {
   return this.inBounds(row, col) &&
          this.Board[row][col] == nil;
}

func (this *Board) moveGem(fromRow int, fromCol int, toRow int, toCol int) bool {
   var boardGem = this.clearGem(fromRow, fromCol);
   return this.PlaceGem(boardGem, toRow, toCol);
}

func (this *Board) PlaceGem(boardGem *gem.Gem, row int, col int) bool {
   this.Board[row][col] = boardGem;
   return true;
}

func (this *Board) clearGem(row int, col int) *gem.Gem {
   var rtn = this.Board[row][col];
   this.Board[row][col] = nil;
   return rtn;
}
