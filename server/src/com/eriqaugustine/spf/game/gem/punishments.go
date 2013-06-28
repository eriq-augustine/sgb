package gem;

import (
   "time"
   "math/rand"
);

// TODO(eriq): Different characters and combos.

var random = rand.New(rand.NewSource(time.Now().UnixNano()));

// TODO(eriq)
var DebugDropPattern DropPattern = DropPattern{[][]int{
   []int{COLOR_RED, COLOR_RED, COLOR_RED, COLOR_RED, COLOR_RED, COLOR_RED},
   []int{COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW},
   []int{COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN},
   []int{COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE},
}};

type DropPattern struct {
   colors [][]int;
};

// Fill |col| in |gems| with |count| gems.
func (this *DropPattern) fillCol(gems *[][]*Gem, col int, count int) {
   for i := 0; i < count; i++ {
      var color = this.colors[i % len(this.colors)][col];
      var newGem = Gem{TYPE_LOCKED, color, MAXED_LOCKED_TIMER};
      (*gems)[col] = append((*gems)[col], &newGem);
   }
}

// Get the punishments gems. Note that the returned array is NOT
//  a grid. It is the gems that go in each column.
// Returns nil on lose.
// TODO(eriq): Give the drops even on lose show the player can
//  see their own defeat.
func GetPunishmentGems(punishments int,
                       board *[][]*Gem,
                       pattern DropPattern) *[][]*Gem {
   var colCounts *[]int = getColCounts(punishments, board);

   if colCounts == nil {
      return nil;
   }

   var gems [][]*Gem = make([][]*Gem, len((*board)[0]));

   for col, count := range *colCounts {
      pattern.fillCol(&gems, col, count);
   }

   return &gems;
}

// Get the number of punishments for each column.
func getColCounts(punishments int, board *[][]*Gem) *[]int {
   var colCounts []int = make([]int, len((*board)[0]));
   var baselines *[]int = GetBaselines(board);
   var availableCols *[]int = getAvailableCols(board, baselines, &colCounts);

   // First allocate full rows.
   for punishments >= len(*availableCols) && len(*availableCols) > 0 {
      for i := 0; i < len(*availableCols); i++ {
         colCounts[i]++;
         punishments--;
      }

      availableCols = getAvailableCols(board, baselines, &colCounts);
   }

   // Randomize the final drop columns.
   var randCols []int = random.Perm(len(*availableCols));
   for _, colIndex := range randCols {
      colCounts[(*availableCols)[colIndex]]++;
      punishments--;

      if punishments == 0 {
         break;
      }
   }

   if punishments > 0 {
      // Lose.
      return nil;
   }

   return &colCounts;
};

// The first open slot in each column.
func GetBaselines(board *[][]*Gem) *[]int {
   var baselines []int = make([]int, 0);
   for col := 0; col < len((*board)[0]); col++ {
      for row := len(*board) - 1; row >= 0; row-- {
         if (*board)[row][col] == nil {
            baselines = append(baselines, row);
            break;
         }
      }
   }

   return &baselines;
}

func getAvailableCols(board *[][]*Gem, baselines *[]int, colCounts *[]int) *[]int {
   // Get available (non-full) columns.
   var availableCols []int = make([]int, 0);
   for i := 0; i < len((*board)[0]); i++ {
      if (*baselines)[i] - (*colCounts)[i] >= 0 {
         availableCols = append(availableCols, i);
      }
   }

   return &availableCols;
}
