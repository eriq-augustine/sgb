package gem;

import (
   "fmt"
   "strconv"
   "time"
   "math/rand"
);

const (
   STAR_LOCKED_TIMER = 3
   MAXED_LOCKED_TIMER = 5
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

const STAR_INTERVAL = 50;

type GemGenerator struct {
   rand *rand.Rand;
   // Need to keep track of the count because stars come at regular intervals.
   count int;
};

func NewGemGenerator() *GemGenerator {
   var generator GemGenerator = GemGenerator{rand.New(rand.NewSource(time.Now().UnixNano())), 0};
   return &generator;
}

func (this *GemGenerator) NextGem() Gem {
   this.count++;

   if (this.count % STAR_INTERVAL == 0) {
      return Gem{TYPE_STAR, 0, 0};
   } else {
      var typeRand int = rand.Intn(100);
      var gemType = TYPE_NORMAL;

      if typeRand <= DESTROYER_CHANCE {
         gemType = TYPE_DESTROYER;
      }

      return Gem{gemType, rand.Intn(NUM_COLORS), 0};
   }
}

type Gem struct {
   Type int;
   Color int;
   Timer int;
};

func (this *Gem) GoString() string {
   return fmt.Sprintf("Type: %d, Color: %d, Timer: %d",
                      this.Type, this.Color, this.Timer);
}

func (this *Gem) String() string {
   var rtn string = "";

   switch this.Type {
      case TYPE_NORMAL:
         rtn += "N";
      case TYPE_DESTROYER:
         rtn += "D";
      case TYPE_LOCKED:
         rtn += "L";
      case TYPE_STAR:
         rtn += "S";
   }

   switch this.Color {
      case COLOR_RED:
         rtn += "R";
      case COLOR_YELLOW:
         rtn += "Y";
      case COLOR_GREEN:
         rtn += "G";
      case COLOR_BLUE:
         rtn += "B";
   }

   rtn += fmt.Sprintf("%d", this.Timer);

   return rtn;
}

func (this *Gem) Hash() string {
   var hash string = "gem-" + strconv.Itoa(this.Type);

   // Stars are the only gem without a color.
   if this.Type != TYPE_STAR {
      hash += "-color-" + strconv.Itoa(this.Color);
   }

   switch this.Type {
      case TYPE_DESTROYER:
         hash += "-destroyer";
      case TYPE_LOCKED:
         hash += "-locked-" + strconv.Itoa(this.Timer);
      case TYPE_STAR:
         hash += "-star";
   }

   return hash;
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
