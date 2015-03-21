package gem;

import (
   "time"
   "math/rand"
   "com/eriqaugustine/sgb/game/constants"
);

var random = rand.New(rand.NewSource(time.Now().UnixNano()));

type DropPattern struct {
   colors [][]int;
};

const NUM_PATTERNS = 3;

var patterns = []DropPattern{
   // Ken
   DropPattern{[][]int{
      []int{COLOR_RED, COLOR_RED, COLOR_RED, COLOR_RED, COLOR_RED, COLOR_RED},
      []int{COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN, COLOR_GREEN},
      []int{COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE, COLOR_BLUE},
      []int{COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW, COLOR_YELLOW},
   }},
   // Ryu
   DropPattern{[][]int{
      []int{COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_RED, COLOR_GREEN},
      []int{COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_RED, COLOR_GREEN},
      []int{COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_RED, COLOR_GREEN},
      []int{COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_RED, COLOR_GREEN},
   }},
   // Hsien-Ko
   DropPattern{[][]int{
      []int{COLOR_YELLOW, COLOR_BLUE, COLOR_BLUE, COLOR_GREEN, COLOR_GREEN, COLOR_RED},
      []int{COLOR_BLUE, COLOR_BLUE, COLOR_GREEN, COLOR_GREEN, COLOR_RED, COLOR_RED},
      []int{COLOR_BLUE, COLOR_GREEN, COLOR_GREEN, COLOR_RED, COLOR_RED, COLOR_YELLOW},
      []int{COLOR_GREEN, COLOR_GREEN, COLOR_RED, COLOR_RED, COLOR_YELLOW, COLOR_YELLOW},
   }},
};

// Fill |gems| with the appropriatley colored and timed gems.
// |colCounts| will be destroyed in the process.
func (this *DropPattern) fillPunishments(gems *[][]*Gem,
                                         colCounts *[]int,
                                         starPunishments int) {
   var gemCount int = 0;
   var row int = 0;
   var placed bool = true;

   for placed {
      placed = false;

      for col := 0; col < len(*colCounts); col++ {
         if ((*colCounts)[col] > 0) {
            var timer = MAXED_LOCKED_TIMER;
            if (gemCount < starPunishments) {
               timer = STAR_LOCKED_TIMER;
            }

            var color = this.colors[row % len(this.colors)][col];
            var newGem = Gem{TYPE_LOCKED, color, timer};
            (*gems)[col] = append((*gems)[col], &newGem);

            (*colCounts)[col]--;
            placed = true;
            gemCount++;
         }
      }

      row++;
   }
}

// Get the punishments gems. Note that the returned array is NOT
//  a grid. It is the gems that go in each column.
// The second return is false if the player loses.
// The gems will always be returned so the loser can see their own defeat.
func GetPunishmentGems(dropPattern int,
                       starPunishments int,
                       normalPunishments int,
                       board *[][]*Gem) (*[][]*Gem, bool) {
   var gems [][]*Gem = make([][]*Gem, len((*board)[0]));

   colCounts, success := getColCounts(starPunishments + normalPunishments, board);
   patterns[dropPattern].fillPunishments(&gems, colCounts, starPunishments);

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

// Note: The drop positions will be given ONLY if all other columns are filled.
func getAvailableCols(board *[][]*Gem, baselines *[]int, colCounts *[]int) *[]int {
   // Get available (non-full) columns.
   var availableCols []int = make([]int, 0);
   for col := 0; col < len((*board)[0]); col++ {

      // Try to leave the first two rows open in the drop column.
      if ((*baselines)[col] - (*colCounts)[col] >= 0) &&
         !(col == constants.DROP_COLUMN && (*baselines)[col] - (*colCounts)[col] <= 1) {
         availableCols = append(availableCols, col);
      }
   }

   // If there were no available columns, then try the drop column.
   if (len(availableCols) == 0 &&
       (*baselines)[constants.DROP_COLUMN] - (*colCounts)[constants.DROP_COLUMN] >= 0) {
      availableCols = append(availableCols, constants.DROP_COLUMN);
   }

   return &availableCols;
}
