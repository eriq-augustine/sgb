package server;

import (
   "encoding/json"
   "fmt"
   "net"
   "io"
   "code.google.com/p/go.net/websocket"
   "com/eriqaugustine/sgb/game"
   "com/eriqaugustine/sgb/game/gem"
   "com/eriqaugustine/sgb/message"
   "com/eriqaugustine/sgb/game/player"
);

var connectionId int = 0;

// {connection/player id => websocket}
var connections = make(map[int]*websocket.Conn);

// {connection/player id => Game}
// Note: there are two entries per game (one per player).
var activeGames = make(map[int]*game.Game);

var waitingPlayer *player.PendingPlayer = nil;

func GameSocket(ws *websocket.Conn) {
   connectionId++;
   var id = connectionId;
   connections[id] = ws;

   defer func(id int) {
      // If this player i waiting (in the queue), remove them.
      if (waitingPlayer != nil && waitingPlayer.PlayerId == id) {
         waitingPlayer = nil;
      }

      closeGame(id);
   }(id);

   var msg message.Message;

   SocketLifeLoop:
   for {
      var err = websocket.JSON.Receive(ws, &msg);
      if err != nil {
         switch err.(type) {
            case *json.SyntaxError:
               continue;
            case *net.OpError:
               break SocketLifeLoop;
            default:
               // EOFs are ok, client just closed.
               if (err != io.EOF) {
                  fmt.Printf("ERROR: %s\n", err.Error());
               }
               break SocketLifeLoop;
         }
      }

      var messagePart = msg.DecodeMessagePart();
      switch msgType := messagePart.(type) {
         case message.InitMessagePart:
            var initPart, _ = messagePart.(message.InitMessagePart);
            var player player.PendingPlayer = player.PendingPlayer{id, initPart.Pattern};

            if (initPart.Pattern < 0 || initPart.Pattern >= gem.NUM_PATTERNS) {
               fmt.Printf("ERROR: Unknown drop pattern (%d)\n", initPart.Pattern);
               break SocketLifeLoop;
            }

            if (waitingPlayer == nil) {
               waitingPlayer = &player;
            } else {
               var newGame *game.Game = game.NewGame(&player, waitingPlayer);

               activeGames[id] = newGame;
               activeGames[waitingPlayer.PlayerId] = newGame;

               waitingPlayer = nil;
               broadcastStart(newGame);
            }
         case message.MoveMessagePart:
            var movePart, _ = messagePart.(message.MoveMessagePart);

            var dropGroup, punishments, success =
               activeGames[id].MoveUpdate(id, movePart.Locations,
                                          movePart.BoardHash);

            signalNextTurn(id, dropGroup, punishments, !success);

            if !success {
               break SocketLifeLoop;
            }
         case message.DropGroupUpdateMessagePart:
            var dropGroupUpdatePart, _ = messagePart.(message.DropGroupUpdateMessagePart);

            // Verify that the given location is valid.
            // If invalid, just ignore.
            if !activeGames[id].AvailableSpot(id, dropGroupUpdatePart.Locations[0][0],
                                              dropGroupUpdatePart.Locations[0][1]) ||
               !activeGames[id].AvailableSpot(id, dropGroupUpdatePart.Locations[1][0],
                                              dropGroupUpdatePart.Locations[1][1]) {
               fmt.Println("Bad Drop Group Update: %+v", dropGroupUpdatePart.Locations);
               continue;
            }

            sendDropGroupUpdate(id, dropGroupUpdatePart);
         default:
            fmt.Println("Unknow type: ", msgType);
            continue;
      }
   }
}

func sendDropGroupUpdate(playerId int, messagePart message.DropGroupUpdateMessagePart) {
   var msg = message.NewMessage(message.MESSAGE_TYPE_DROP_GROUP_UPDATE,
                                    messagePart);
   var ws = connections[activeGames[playerId].GetOpponentId(playerId)];
   websocket.JSON.Send(ws, msg);
}

func closeGame(playerId int) {
   var currentGame, exists = activeGames[playerId];
   if exists {
      var opponentId = currentGame.GetOpponentId(playerId);

      conn, exists := connections[opponentId];
      if exists {
         conn.Close();
      }

      delete(activeGames, playerId);
      delete(activeGames, opponentId);

      delete(connections, opponentId);
   }

   conn, exists := connections[playerId];
   if exists {
      conn.Close();
   }

   delete(connections, playerId);
}

func broadcastStart(currentGame *game.Game) {
   // Initial drop will be the same for both players.
   var message = message.NewMessage(message.MESSAGE_TYPE_START,
                                    message.StartMessagePart{currentGame.InitialDrops()});

   for _, playerId := range currentGame.Players {
      websocket.JSON.Send(connections[playerId], message);
   }
}

func signalNextTurn(playerId int, dropGroup *[2]gem.Gem, punishments *[][]*gem.Gem, playerLost bool) {
   var currentGame *game.Game = activeGames[playerId];
   var opponentId int = currentGame.GetOpponentId(playerId);
   var opponentPunishments int = currentGame.GetTotalPunishments(opponentId);
   var playerBoard = currentGame.Boards[currentGame.GetPlayerOrdinal(playerId)];
   var playerScore = currentGame.Scores[currentGame.GetPlayerOrdinal(playerId)];

   // Tell the player the next turn info
   var playerMessage =
      message.NewMessage(message.MESSAGE_TYPE_NEXT_TURN,
                         message.NextTurnMessagePart{*dropGroup,
                                                     punishments,
                                                     playerScore,
                                                     opponentPunishments,
                                                     playerLost});

   websocket.JSON.Send(connections[playerId], playerMessage);

   websocket.JSON.Send(
      connections[opponentId],
      message.NewMessage(message.MESSAGE_TYPE_UPDATE,
                         message.UpdateMessagePart{opponentPunishments,
                                                   0,
                                                   playerScore,
                                                   playerBoard.Board,
                                                   currentGame.CurrentDropForPlayer(playerId),
                                                   playerLost}));
}

func broadcastNoContest(currentGame *game.Game) {
   var message = message.NewMessage(message.MESSAGE_TYPE_NO_CONTEST,
                                    message.NoContestMessagePart{});

   for _, playerId := range currentGame.Players {
      websocket.JSON.Send(connections[playerId], message);
   }
}
