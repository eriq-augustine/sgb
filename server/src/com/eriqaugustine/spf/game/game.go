package game;

import (
   "time"
   "math/rand"
   "com/eriqaugustine/spf/message"
   . "com/eriqaugustine/spf/game/gem"
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
   Boards [2]*Board
   rand *rand.Rand;
   dropGroups [][2]Gem;
   playerDropCursors [2]int;
   Punishments [2]int;
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
   game.Boards = [2]*Board{
      NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
      NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
   };
   game.Punishments = [2]int{0, 0};

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

// Get the id (not ordinal) for the opponent.
func (this *Game) GetOpponentId(playerId int) int {
   return this.Players[this.GetOpponentOrdinal(playerId)];
}

func (this *Game) GetOpponentOrdinal(playerId int) int {
   return (this.GetPlayerOrdinal(playerId) + 1) % 2;
}

func (this *Game) GetPlayerOrdinal(playerId int) int {
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
   return this.nextDrop(this.GetPlayerOrdinal(playerId));
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
// Return the next gem for that player and the number of punishments the plater must take.
// If nil is returned, then that means the game is over.
//  The the second return will be the game resolution.
func (this *Game) MoveUpdate(playerId int, locations [2][2]int, hash string) (*[2]Gem, int) {
   var playerOrdinal int = this.GetPlayerOrdinal(playerId);

   // The group being dropped is two behind the current cursor for the player.
   var dropGroup = this.dropGroups[this.playerDropCursors[playerOrdinal] - 2];

   this.Boards[playerOrdinal].placeGem(&dropGroup[0], locations[0][0], locations[0][1]);
   this.Boards[playerOrdinal].placeGem(&dropGroup[1], locations[1][0], locations[1][1]);

   if hash != this.Boards[playerOrdinal].hash() {
      // TODO(eriq): Real logging
      println("Board hashes differ!");
      return nil, message.END_GAME_NO_CONTEST;
   }

   if !this.Boards[playerOrdinal].advance(this, playerId) {
      // Player loses.
      return nil, message.END_GAME_LOSE;
   }

   // The player just took all of their punishments, should keep the number to send to
   //  the client, but reset the internal number to zero.
   var punishments = this.Punishments[playerOrdinal];
   this.Punishments[playerOrdinal] = 0;

   var nextDrop = this.NextDropForPlayer(playerId);
   return &nextDrop, punishments;
}

// |playerId| just destroyed |destroyed| number of gems.
// Adjust both players' punishments accordingly.
// Returns the new punishment value for |playerId|.
func (this *Game) AdjustPunishments(playerId int, destroyed int) int {
   var playerOrdinal int = this.GetPlayerOrdinal(playerId);

   var newPunishment int = this.Punishments[playerOrdinal] - destroyed;
   if newPunishment < 0 {
      this.Punishments[(playerOrdinal + 1) % 2] -= newPunishment;
      newPunishment = 0;
   }

   this.Punishments[playerOrdinal] = newPunishment;

   return newPunishment;
}
