package game;

import (
   "time"
   "math/rand"
);

var nextId int = 0;

type Game struct {
   Id int;

   // Connection ids
   Players [2]int;

   // Boards
   // TODO(eriq)

   rand *rand.Rand;

   dropGroups [][2]Gem;

   playerDropCursors [2]int;
};

func NewGame(player1 int, player2 int) *Game {
   nextId++;

   var game = new(Game);

   game.Id = nextId;
   game.Players = [2]int{player1, player2};
   game.rand = rand.New(rand.NewSource(time.Now().UnixNano()));
   game.dropGroups = make([][2]Gem, 0);
   game.playerDropCursors = [2]int{0, 0};

   return game;
}

func (this *Game) nextDrop(playerOrdinal int) [2]Gem {
   if this.playerDropCursors[playerOrdinal] == len(this.dropGroups) {
      this.dropGroups =
         append(this.dropGroups, [2]Gem{NewGem(this.rand), NewGem(this.rand)});
   }

   this.playerDropCursors[playerOrdinal]++;
   return this.dropGroups[this.playerDropCursors[playerOrdinal] - 1];
}

func (this *Game) NextPlayer1Drop() [2]Gem {
   return this.nextDrop(0);
}

func (this *Game) NextPlayer2Drop() [2]Gem {
   return this.nextDrop(1);
}
