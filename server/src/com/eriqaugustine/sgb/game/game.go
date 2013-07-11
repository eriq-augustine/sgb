package game;

import (
   "time"
   "math/rand"
   "com/eriqaugustine/sgb/util"
   "com/eriqaugustine/sgb/game/gem"
   "com/eriqaugustine/sgb/game/board"
   "com/eriqaugustine/sgb/game/player"
);

const (
   // The score just for dropping a gem.
   SCORE_DROP = 10
   // Destroying a gem normally.
   SCORE_NORMAL_DESTROY = 100
   // Destroying a gem with a star.
   SCORE_STAR_DESTROY = 50
);

const (
   BOARD_HEIGHT = 14
   BOARD_WIDTH = 6
);

var nextId int = 0;

// Need to keep track of how many of each punishments come in.
// Stars have a lower timer than normals.
type Punishments struct {
   stars int;
   normals int;
};

func (this *Punishments) reset() {
   this.stars = 0;
   this.normals = 0;
}

// Returns the number of cancels made.
func (this *Punishments) cancel(totalDestroyed int) int {
   var initialTotal = this.total();

   // Any canceling first comes out of the star puishments, then the normals.
   var starCount = this.stars;
   this.stars = math.Max(0, this.stars - totalDestroyed);
   totalDestroyed -= (starCount - this.stars);
   this.normals = math.Max(0, this.normals - totalDestroyed);

   return initialTotal - this.total();
}

func (this *Punishments) add(starDestroyed int, normalDestroyed int) {
   this.stars += starDestroyed;
   this.normals += normalDestroyed;
}

func (this *Punishments) total() int {
   return this.stars + this.normals;
}

type Game struct {
   Id int;
   // Connection ids
   Players [2]int;
   Patterns [2]int;
   Boards [2]*board.Board
   rand *rand.Rand;
   dropGroups [][2]gem.Gem;
   playerDropCursors [2]int;
   punishments [2]Punishments;
   Scores [2]int;
};

func NewGame(player1 *player.PendingPlayer, player2 *player.PendingPlayer) *Game {
   nextId++;

   var game = new(Game);

   game.Id = nextId;
   game.Players = [2]int{player1.PlayerId, player2.PlayerId};
   game.Patterns = [2]int{player1.DropPattern, player2.DropPattern};
   game.rand = rand.New(rand.NewSource(time.Now().UnixNano()));
   game.dropGroups = make([][2]gem.Gem, 0);
   // Becausse two groups are given out intially, the initial drop
   //  cursors must be kept track of.
   game.playerDropCursors = [2]int{-1, -1};
   game.Boards = [2]*board.Board{
      board.NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
      board.NewBoard(BOARD_HEIGHT, BOARD_WIDTH),
   };
   game.punishments = [2]Punishments{Punishments{0, 0}, Punishments{0, 0}};

   game.Scores = [2]int{0, 0};

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

func (this *Game) GetOppositeOrdinal(playerOrdinal int) int {
   return (playerOrdinal + 1) % 2;
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

func (this *Game) CurrentDropForPlayer(playerId int) [2]gem.Gem {
   return this.dropGroups[this.playerDropCursors[this.GetPlayerOrdinal(playerId)] - 1];
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
func (this *Game) MoveUpdate(playerId int, locations [2][2]int, hash string) (*[2]gem.Gem, *[][]*gem.Gem, bool) {
   var playerOrdinal int = this.GetPlayerOrdinal(playerId);

   // The group being dropped is two behind the current cursor for the player.
   var dropGroup = this.dropGroups[this.playerDropCursors[playerOrdinal] - 2];

   this.Boards[playerOrdinal].PlaceGem(&dropGroup[0], locations[0][0], locations[0][1]);
   this.Boards[playerOrdinal].PlaceGem(&dropGroup[1], locations[1][0], locations[1][1]);

   if hash != this.Boards[playerOrdinal].Hash() {
      println(this.Boards[playerOrdinal].String());
      panic("Board hashes differ!");
   }

   punishments, success := this.advanceBoard(playerOrdinal);

   // The player just took all of their punishments.
   this.punishments[playerOrdinal].reset();

   var nextDrop = this.NextDropForPlayer(playerId);
   return &nextDrop, punishments, success;
}

// Returns false on lose.
func (this *Game) advanceBoard(playerOrdinal int) (*[][]*gem.Gem, bool) {
   // Advance any timers first.
   this.Boards[playerOrdinal].AdvanceTimers();

   starDestroyed, normalDestroyed := this.Boards[playerOrdinal].Stabalize();

   // Calculate scores.
   this.Scores[playerOrdinal] += SCORE_DROP +
                                 (SCORE_NORMAL_DESTROY * normalDestroyed) +
                                 (SCORE_STAR_DESTROY * starDestroyed);

   this.adjustPunishments(playerOrdinal, starDestroyed, normalDestroyed);

   punishmentGems, success :=
      this.Boards[playerOrdinal].Punish(
         this.Patterns[this.GetOppositeOrdinal(playerOrdinal)],
         this.punishments[playerOrdinal].stars,
         this.punishments[playerOrdinal].normals);

   return punishmentGems, success && this.Boards[playerOrdinal].CanDrop();
}

// |playerOrdinal| just destroyed |destroyed| number of gems.
// Adjust both players' punishments accordingly.
func (this *Game) adjustPunishments(playerOrdinal int, starDestroyed int, normalDestroyed int) {
   var cancels int = this.punishments[playerOrdinal].cancel(starDestroyed + normalDestroyed);

   var enemyStarPunishments = math.Max(0, starDestroyed - cancels);
   cancels -= (starDestroyed - enemyStarPunishments);
   var enemyNormalPunishments = math.Max(0, normalDestroyed - cancels);

   this.punishments[this.GetOppositeOrdinal(playerOrdinal)].add(enemyStarPunishments, enemyNormalPunishments);
}

// Check to see if the spot on the player's board is open.
func (this *Game) AvailableSpot(playerId int, row int, col int) bool {
   return this.Boards[this.GetPlayerOrdinal(playerId)].AvailableSpot(row, col);
}

func (this *Game) GetTotalPunishments(playerId int) int {
   return this.punishments[this.GetPlayerOrdinal(playerId)].total();
}
