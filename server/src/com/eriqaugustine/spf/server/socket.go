package server;

import (
   "encoding/json"
   "fmt"
   "net"
   "code.google.com/p/go.net/websocket"
   "com/eriqaugustine/spf/game"
   "com/eriqaugustine/spf/game/gem"
   "com/eriqaugustine/spf/message"
);

var connectionId int = 0;

// {connection/player id => websocket}
var connections = make(map[int]*websocket.Conn);

// {connection/player id => Game}
// Note: there are two entries per game (one per player).
var activeGames = make(map[int]*game.Game);

// TODO(eriq): queue
var waitingPlayer int = -1;

func GameSocket(ws *websocket.Conn) {
   connectionId++;
   var id = connectionId;
   connections[id] = ws;

   var msg message.Message;

   println("On Connect");

   SocketLifeLoop:
   for {
      var err = websocket.JSON.Receive(ws, &msg);
      if err != nil {
         switch err.(type) {
            case *json.SyntaxError:
               println("unmarshal error!");
               websocket.Message.Send(ws, "unmarshal error");
               continue;
            case *net.OpError:
               break SocketLifeLoop;
            default:
               fmt.Printf("ERROR: %s\n", err.Error());
               break SocketLifeLoop;
         }
      }

      var messagePart = msg.DecodeMessagePart();
      switch msgType := messagePart.(type) {
         case message.InitMessagePart:
            if (waitingPlayer == -1) {
               waitingPlayer = id;
            } else {
               var newGame *game.Game = game.NewGame(id, waitingPlayer);

               activeGames[id] = newGame;
               activeGames[waitingPlayer] = newGame;

               waitingPlayer = -1;
               broadcastStart(newGame);
            }
         case message.MoveMessagePart:
            var movePart, _ = messagePart.(message.MoveMessagePart);

            // TEST
            println("Move");

            // TODO(eriq): This panics on no contest.
            var dropGroup, punishments, success =
               activeGames[id].MoveUpdate(id, movePart.Locations,
                                          movePart.BoardHash);

            signalNextTurn(id, dropGroup, punishments, !success);

            if !success {
               // TODO(eriq): Close the connections now.
               break SocketLifeLoop;
            }
         case message.DropGroupUpdateMessagePart:
            //TEST
            fmt.Println("%+v", messagePart);

            var dropGroupUpdatePart, _ = messagePart.(message.DropGroupUpdateMessagePart);

            // Verify that the given location is valid.
            // If invalid, just ignore.
            if !activeGames[id].AvailableSpot(id, dropGroupUpdatePart.Locations[0][0],
                                              dropGroupUpdatePart.Locations[0][1]) ||
               !activeGames[id].AvailableSpot(id, dropGroupUpdatePart.Locations[1][0],
                                              dropGroupUpdatePart.Locations[1][1]) {
               // TODO(eriq): Log
               fmt.Println("Bad Drop Group Update: %+v", dropGroupUpdatePart.Locations);
               continue;
            }

            sendDropGroupUpdate(id, dropGroupUpdatePart);
         default:
            fmt.Println("Unknow type: ", msgType);
            continue;
      }
   }

   // TODO(eriq): If in queue, remove self.
   closeGame(id);

   println("On Close");
}

func sendDropGroupUpdate(playerId int, messagePart message.DropGroupUpdateMessagePart) {
   var msg = message.NewMessage(message.MESSAGE_TYPE_DROP_GROUP_UPDATE,
                                    messagePart);
   var ws = connections[activeGames[playerId].GetOpponentId(playerId)];
   websocket.JSON.Send(ws, msg);
}

func closeGame(playerId int) {
   var currentGame, exists = activeGames[playerId];
   if !exists {
      // Already destroyed this game.
      return;
   }

   var opponentId = currentGame.GetOpponentId(playerId);

   conn, exists := connections[playerId];
   if exists {
      conn.Close();
   }

   conn, exists = connections[opponentId];
   if exists {
      conn.Close();
   }

   delete(connections, playerId);
   delete(connections, opponentId);

   delete(activeGames, playerId);
   delete(activeGames, opponentId);
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
   var opponentOrdinal int = currentGame.GetOpponentOrdinal(playerId);
   var opponentId int = currentGame.GetOpponentId(playerId);
   var opponentPunishments = currentGame.Punishments[opponentOrdinal];
   var playerBoard = currentGame.Boards[currentGame.GetPlayerOrdinal(playerId)];

   // Tell the player the next turn info
   var playerMessage =
      message.NewMessage(message.MESSAGE_TYPE_NEXT_TURN,
                         message.NextTurnMessagePart{*dropGroup,
                                                     punishments,
                                                     opponentPunishments,
                                                     playerLost});

   websocket.JSON.Send(connections[playerId], playerMessage);

   websocket.JSON.Send(
      connections[opponentId],
      message.NewMessage(message.MESSAGE_TYPE_UPDATE,
                         message.UpdateMessagePart{opponentPunishments,
                                                   0,
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
