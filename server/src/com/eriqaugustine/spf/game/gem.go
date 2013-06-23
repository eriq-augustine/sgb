package game;

import "fmt";

type Gem struct {
   Type int;
   Color int;
   Timer int;
};

func (this Gem) String() string {
   return fmt.Sprintf("Type: %d, Color: %d, Timer: %d",
                      this.Type, this.Color, this.Timer);
}
