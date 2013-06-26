package game;

// TODO(eriq): Different characters and combos.

func GetPunishmentGems(num int, boardWidth int) []Gem {
   var rtn []Gem = make([]Gem, 0);

   for i := 0; i < num; i++ {
      var color int = (i / boardWidth) % NUM_COLORS;
      rtn = append(rtn, Gem{TYPE_LOCKED, color, MAXED_LOCKED_TIMER});
   }

   return rtn;
}
