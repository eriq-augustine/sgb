package game;

import (
   "time"
   "math/rand"
   "com/eriqaugustine/spf/game/gem"
   "com/eriqaugustine/spf/game/board"
);

const (
   BOARD_HEIGHT = 14
   BOARD_WIDTH = 6
);

var nextId int = 0;

type Game struct {
   Id int;
   // Connection ids
   Players [2]int;
   Boards [2]*board.Board
   rand *rand.Rand;
   dropGroups [][2]gem.Gem;
   playerDropCursors [2]int;
   Punishments [2]int;
};

func NewGame(player1 int, player2 int) *Game {
   nextId++;

   var game = new(Game);

   game.Id = nextId;
   game.Players = [2]int{player1, player2};
   game.rand = rand.New(rand.NewSource(time.Now().UnixNano()));
   game.dropGroups = make([][2]gem.Gem, 0);
   // Becausse two groups are given out intially, the initial drop
   //  cursors must be kept track of.
   game.playerDropCursors = [2]int{-1, -1};
   game.Boards = [2]*board.Board{
      board.NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
      board.NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
   };
   game.Punishments = [2]int{0, 0};

   return game;
}

// Will advance the player's drop cursor.
func (this *Game) nextDrop(playerOrdinal int) [2]gem.Gem {
   if this.playerDropCursors[playerOrdinal] == len(this.dropGroups) {
      this.dropGroups =
         append(this.dropGroups, [2]gem.Gem{gem.NewGem(this.rand),
                                            gem.NewGem(this.rand)});
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
func (this *Game) NextDropForPlayer(playerId int) [2]gem.Gem {
   return this.nextDrop(this.GetPlayerOrdinal(playerId));
}

func (this *Game) InitialDrops() [2][2]gem.Gem {
   if (this.playerDropCursors[0] != -1 ||
       this.playerDropCursors[1] != -1 ||
       len(this.dropGroups) != 0) {
      panic("Board is not in initial state");
   }

   // Advance the cursors up two.
   this.playerDropCursors[0] = 2;
   this.playerDropCursors[1] = 2;

   this.dropGroups =
      append(this.dropGroups, [2]gem.Gem{gem.NewGem(this.rand),
                                         gem.NewGem(this.rand)});
   this.dropGroups =
      append(this.dropGroups, [2]gem.Gem{gem.NewGem(this.rand),
                                         gem.NewGem(this.rand)});

   return [2][2]gem.Gem{this.dropGroups[0], this.dropGroups[1]};
}

// Update the boards according to a player move.
// Return the next gem for that player and the punishments the player must take.
// If nil is returned, then that means the player lost.
func (this *Game) MoveUpdate(playerId int, locations [2][2]int, hash string) (*[2]gem.Gem, *[][]*gem.Gem) {
   var playerOrdinal int = this.GetPlayerOrdinal(playerId);

   // The group being dropped is two behind the current cursor for the player.
   var dropGroup = this.dropGroups[this.playerDropCursors[playerOrdinal] - 2];

   this.Boards[playerOrdinal].PlaceGem(&dropGroup[0], locations[0][0], locations[0][1]);
   this.Boards[playerOrdinal].PlaceGem(&dropGroup[1], locations[1][0], locations[1][1]);

   if hash != this.Boards[playerOrdinal].Hash() {
      // TODO(eriq): Real logging
      panic("Board hashes differ!");
   }

   var punishments *[][]*gem.Gem = this.advanceBoard(playerOrdinal);
   if punishments == nil {
      // Player loses.
      return nil, nil;
   }

   // The player just took all of their punishments.
   this.Punishments[playerOrdinal] = 0;

   var nextDrop = this.NextDropForPlayer(playerId);
   return &nextDrop, punishments;
}

func (this *Game) advanceBoard(playerOrdinal int) *[][]*gem.Gem {
   // Advance any timers first.
   this.Boards[playerOrdinal].AdvanceTimers();

   var destroyed int = this.Boards[playerOrdinal].Stabalize();

   // TODO(eriq): Take combos into consideration.
   var punishments int = this.adjustPunishments(playerOrdinal, destroyed);

   var punishmentGems *[][]*gem.Gem = this.Boards[playerOrdinal].Punish(punishments);

   if punishmentGems == nil || !this.Boards[playerOrdinal].CanDrop() {
      return nil;
   }

   return punishmentGems;
}

// |playerOrdinal| just destroyed |destroyed| number of gems.
// Adjust both players' punishments accordingly.
// Returns the new punishment value for |playerOrdinal|.
func (this *Game) adjustPunishments(playerOrdinal int, destroyed int) int {
   var newPunishment int = this.Punishments[playerOrdinal] - destroyed;
   if newPunishment < 0 {
      this.Punishments[(playerOrdinal + 1) % 2] -= newPunishment;
      newPunishment = 0;
   }

   this.Punishments[playerOrdinal] = newPunishment;

   return newPunishment;
}
