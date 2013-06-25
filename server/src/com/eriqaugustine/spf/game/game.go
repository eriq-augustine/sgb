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

// Get the next drop for the player with the given id (not ordinal).
func (this *Game) NextDropForPlayer(playerId int) [2]Gem {
   var playerOrdinal int = -1;

   if this.Players[0] == playerId {
      playerOrdinal = 0;
   } else if this.Players[1] == playerId {
      playerOrdinal = 1;
   } else {
      panic("No such player");
   }

   return this.nextDrop(playerOrdinal);
}

func (this *Game) InitialDrops() [2][2]Gem {
   if (this.playerDropCursors[0] != 0 ||
       this.playerDropCursors[1] != 0 ||
       len(this.dropGroups) != 0) {
      panic("Board is not in initial state");
   }

   this.dropGroups =
      append(this.dropGroups, [2]Gem{NewGem(this.rand), NewGem(this.rand)});
   this.dropGroups =
   append(this.dropGroups, [2]Gem{NewGem(this.rand), NewGem(this.rand)});

   return [2][2]Gem{this.dropGroups[0], this.dropGroups[1]};
}

// Update the boards according to a player move.
// Also return the next gem for that player.
func (this *Game) MoveUpdate(playerId int, locations [2][2]int, hash string) [2]Gem {
   // TODO(eriq): Update board

   return this.NextDropForPlayer(playerId);
}
