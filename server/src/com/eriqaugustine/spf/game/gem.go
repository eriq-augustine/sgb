package game;

import (
   "fmt"
   "math/rand"
);

const (
   TYPE_NORMAL = iota
   TYPE_DESTROYER
   TYPE_LOCKED
   TYPE_STAR
   NUM_TYPES
);

const (
   COLOR_RED = iota
   COLOR_YELLOW
   COLOR_GREEN
   COLOR_BLUE
   NUM_COLORS
);

// Chances are given as percents.
const (
   STAR_CHANCE = 2;
   DESTROYER_CHANCE = 18;
);

type Gem struct {
   Type int;
   Color int;
   Timer int;
};

func (this Gem) String() string {
   return fmt.Sprintf("Type: %d, Color: %d, Timer: %d",
                      this.Type, this.Color, this.Timer);
}

// All new gems will be normal ones.
func NewGem(rand *rand.Rand) Gem {
   var typeRand int = rand.Intn(100);
   var gemType = TYPE_NORMAL;

   if typeRand <= STAR_CHANCE {
      gemType = TYPE_STAR;
   } else if typeRand <= DESTROYER_CHANCE {
      gemType = TYPE_DESTROYER;
   }

   return Gem{gemType, rand.Intn(NUM_COLORS), 0};
}
