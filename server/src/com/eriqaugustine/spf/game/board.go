package game;

import (
   "io"
   "fmt"
   "crypto/md5"
);

type Board struct {
   height int;
   width int;
   board [][]*Gem;
};

type location struct {
   row int;
   col int;
};

func NewBoard(height int, width int) *Board {
   var gameBoard *Board = new(Board);

   gameBoard.height = height;
   gameBoard.width = width;
   gameBoard.board = make([][]*Gem, height);

   for i := 0; i < height; i++ {
      gameBoard.board[i] = make([]*Gem, width);
   }

   return gameBoard;
}

func (this *Board) advance() {
   this.stabalize();

   // Advance any timers.
   for _, row := range this.board {
      for _, gem := range row {
         if gem != nil && gem.Type == TYPE_LOCKED {
            gem.Timer -= 1;
            if gem.Timer == 0 {
               gem.Type = TYPE_NORMAL;
            }
         }
      }
   }
}

func (this *Board) hash() string {
   var boardString string = "";

   for _, row := range this.board {
      for _, gem := range row {
         if (gem == nil) {
            boardString += "_"
         } else {
            boardString += gem.hash();
         }
      }
   }

   hash := md5.New();
   io.WriteString(hash, boardString);
   return fmt.Sprintf("%x", hash.Sum(nil));
}

// Fall and destroy any blocks.
func (this *Board) stabalize() {
   for this.fall() || this.destroy() {
      // Just keep falling and destroying until there is nothing left to do.
   }
}

// Return true if any pieces fell.
func (this *Board) fall() bool {
   var iterationDropped bool = true;
   var dropped bool = false;

   for iterationDropped {
      iterationDropped = false;

      // Start at the second to last row.
      for i := this.height - 2; i >= 0; i-- {
         for j := 0; j < this.width; j++ {
            if this.board[i][j] != nil && this.board[i + 1][j] == nil {
               this.moveGem(i, j, i + 1, j);
               iterationDropped = true;
               dropped = true;
            }
         }
      }
   }

   return dropped;
}

// Return true if any piece was destroyed.
func (this *Board) destroy() bool {
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
         this.board[starLocation.row + 1][starLocation.col].Type != TYPE_STAR {
         starColors[this.board[starLocation.row + 1][starLocation.col].Color] =
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

   return len(toDestroy) != 0;
}

func (this *Board) collectColors(colors map[int]bool) *[]location {
   var rtn []location = make([]location, 0);

   for row, boardRow := range this.board {
      for col, gem := range boardRow {
         if gem != nil && gem.Type != TYPE_STAR && colors[gem.Color] {
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
   var startColor int = this.board[start.row][start.col].Color;

   for len(searchStack) > 0 {
      var currentLocation location = searchStack[len(searchStack) - 1];
      searchStack = searchStack[:len(searchStack) - 1];

      for _, offset := range offsets {
         var row int = currentLocation.row + offset[0];
         var col int = currentLocation.col + offset[1];

         if this.inBounds(row, col) &&
            !locationSet[location{row, col}] &&
            this.board[row][col] != nil &&
            this.board[row][col].Color == startColor {
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

   for row, boardRow := range this.board {
      for col, gem := range boardRow {
         if gem != nil {
            if gem.Type == TYPE_STAR {
               rtn["stars"] = append(rtn["stars"], location{row, col});
            } else if gem.Type == TYPE_DESTROYER {
               rtn["destroyers"] = append(rtn["destroyers"], location{row, col});
            }
         }
      }
   }

   return &rtn;
}

func (this *Board) inBounds(row int, col int) bool {
   return row >= 0 && row < this.height &&
          col >= 0 && col < this.width;
}

// TODO(eriq): Verify that each of these operations are proper.
func (this *Board) moveGem(fromRow int, fromCol int, toRow int, toCol int) bool {
   var gem = this.clearGem(fromRow, fromCol);
   return this.placeGem(gem, toRow, toCol);
}

func (this *Board) placeGem(gem *Gem, row int, col int) bool {
   this.board[row][col] = gem;
   return true;
}

func (this *Board) clearGem(row int, col int) *Gem {
   var rtn = this.board[row][col];
   this.board[row][col] = nil;
   return rtn;
}
