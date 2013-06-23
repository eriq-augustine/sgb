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

   gems []Gem;
};

func NewGame(player1 int, player2 int) *Game {
   nextId++;

   var game = new(Game);

   game.Id = nextId;
   game.Players = [2]int{player1, player2};
   game.rand = rand.New(rand.NewSource(time.Now().UnixNano()));
   game.gems = make([]Gem, 100);

   return game;
}

func (this *Game) nextDrop(playerOrdinal int) [2]Gem {
   // TODO;
   return [2]Gem{Gem{0, 0, 0}, Gem{1, 1, 1}};
}

func (this *Game) NextPlayer1Drop() [2]Gem {
   return this.nextDrop(0);
}

func (this *Game) NextPlayer2Drop() [2]Gem {
   return this.nextDrop(1);
}
