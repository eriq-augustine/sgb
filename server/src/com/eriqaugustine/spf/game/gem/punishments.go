package gem;

import (
   "time"
   "math/rand"
);

var random = rand.New(rand.NewSource(time.Now().UnixNano()));

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
// The second return is false if the player loses.
// The gems will always be returned so the loser can see their own defeat.
func GetPunishmentGems(punishments int,
                       board *[][]*Gem,
                       pattern DropPattern) (*[][]*Gem, bool) {
   var gems [][]*Gem = make([][]*Gem, len((*board)[0]));

   colCounts, success := getColCounts(punishments, board);

   for col, count := range *colCounts {
      pattern.fillCol(&gems, col, count);
   }

   return &gems, success;
}

// Get the number of punishments for each column.
// The second return is false if the player loses.
func getColCounts(punishments int, board *[][]*Gem) (*[]int, bool) {
   // Number of gems to be placed in each column.
   var colCounts []int = make([]int, len((*board)[0]));
   var baselines *[]int = GetBaselines(board);
   var availableCols *[]int = getAvailableCols(board, baselines, &colCounts);

   // First allocate full rows.
   for punishments >= len(*availableCols) && len(*availableCols) > 0 {
      for _, col := range *availableCols {
         colCounts[col]++;
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
      return &colCounts, false;
   }

   return &colCounts, true;
};

// The first open slot in each column, -1 if there is no empty slot.
func GetBaselines(board *[][]*Gem) *[]int {
   var baselines []int = make([]int, 0);
   for col := 0; col < len((*board)[0]); col++ {
      baselines = append(baselines, -1);

      for row := len(*board) - 1; row >= 0; row-- {
         if (*board)[row][col] == nil {
            baselines[col] = row;
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
