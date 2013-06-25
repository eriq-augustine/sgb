package game;

import (
   "fmt"
   "time"
   "math/rand"
);

const (
   BOARD_HEIGHT = 13
   BOARD_WIDTH = 6
);

var nextId int = 0;

type Game struct {
   Id int;
   // Connection ids
   Players [2]int;
   boards [2]*Board
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
   // Becausse two groups are given out intially, the initial drop
   //  cursors must be kept track of.
   game.playerDropCursors = [2]int{-1, -1};
   game.boards = [2]*Board{
      NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
      NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
   };

   return game;
}

// Will advance the player's drop cursor.
func (this *Game) nextDrop(playerOrdinal int) [2]Gem {
   if this.playerDropCursors[playerOrdinal] == len(this.dropGroups) {
      this.dropGroups =
         append(this.dropGroups, [2]Gem{NewGem(this.rand), NewGem(this.rand)});
   }

   this.playerDropCursors[playerOrdinal]++;
   return this.dropGroups[this.playerDropCursors[playerOrdinal] - 1];
}

func (this *Game) getPlayerOrdinal(playerId int) int {
   if this.Players[0] == playerId {
      return 0;
   } else if this.Players[1] == playerId {
      return 1;
   } else {
      panic("No such player");
   }
}

// Get the next drop for the player with the given id (not ordinal).
func (this *Game) NextDropForPlayer(playerId int) [2]Gem {
   return this.nextDrop(this.getPlayerOrdinal(playerId));
}

func (this *Game) InitialDrops() [2][2]Gem {
   if (this.playerDropCursors[0] != -1 ||
       this.playerDropCursors[1] != -1 ||
       len(this.dropGroups) != 0) {
      panic("Board is not in initial state");
   }

   // Advance the cursors up two.
   this.playerDropCursors[0] = 2;
   this.playerDropCursors[1] = 2;

   this.dropGroups =
      append(this.dropGroups, [2]Gem{NewGem(this.rand), NewGem(this.rand)});
   this.dropGroups =
      append(this.dropGroups, [2]Gem{NewGem(this.rand), NewGem(this.rand)});

   return [2][2]Gem{this.dropGroups[0], this.dropGroups[1]};
}

// Update the boards according to a player move.
// Also return the next gem for that player.
func (this *Game) MoveUpdate(playerId int, locations [2][2]int, hash string) *[2]Gem {
   var playerOrdinal int = this.getPlayerOrdinal(playerId);

   // The group being dropped is two behind the current cursor for the player.
   var dropGroup = this.dropGroups[this.playerDropCursors[playerOrdinal] - 2];

   this.boards[playerOrdinal].placeGem(&dropGroup[0], locations[0][0], locations[0][1]);
   this.boards[playerOrdinal].placeGem(&dropGroup[1], locations[1][0], locations[1][1]);

   if hash != this.boards[playerOrdinal].hash() {
      // TODO(eriq): Real logging
      println("Board hashes differ!");
      return nil;
   }

   this.boards[playerOrdinal].advance();

   var nextDrop = this.NextDropForPlayer(playerId);
   return &nextDrop;
}
