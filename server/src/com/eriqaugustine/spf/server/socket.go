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

func GameServer(ws *websocket.Conn) {
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
               BroadcastStart(newGame);
            }
         case message.MoveMessagePart:
            var movePart, _ = messagePart.(message.MoveMessagePart);

            // TEST
            println("Move");

            var dropGroup, punishments =
               activeGames[id].MoveUpdate(id, movePart.Locations,
                                          movePart.BoardHash);

            if dropGroup != nil {
               signalNextTurn(id, dropGroup, punishments);
            } else {
               // TODO(eriq): Close the connections now.
               signalGameOver(id, punishments);
               break SocketLifeLoop;
            }
         default:
            fmt.Println("Unknow type: ", msgType);
            continue;
      }
   }

   closeGame(id);

   println("On Close");
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

func BroadcastStart(currentGame *game.Game) {
   // Initial drop will be the same for both players.
   var message = message.NewMessage(message.MESSAGE_TYPE_START,
                                    message.StartMessagePart{currentGame.InitialDrops()});

   for _, playerId := range currentGame.Players {
      websocket.JSON.Send(connections[playerId], message);
   }
}

func signalNextTurn(playerId int, dropGroup *[2]gem.Gem, punishments int) {
   var currentGame *game.Game = activeGames[playerId];
   var opponentOrdinal int = currentGame.GetOpponentOrdinal(playerId);
   var opponentId int = currentGame.GetOpponentId(playerId);
   var opponentPunishments = currentGame.Punishments[opponentOrdinal];
   var playerBoard = currentGame.Boards[currentGame.GetPlayerOrdinal(playerId)];

   // Tell the player the next turn info
   var playerMessage =
      message.NewMessage(message.MESSAGE_TYPE_NEXT_TURN,
                         message.NextTurnMessagePart{*dropGroup, punishments,
                                                     opponentPunishments});

   websocket.JSON.Send(connections[playerId], playerMessage);

   // TODO(eriq): Update the opponent.
   websocket.JSON.Send(
      connections[opponentId],
      message.NewMessage(message.MESSAGE_TYPE_UPDATE,
                         message.UpdateMessagePart{opponentPunishments,
                                                   0,
                                                   playerBoard.Board}));
}

func signalGameOver(playerId int, resolution int) {
   var currentGame *game.Game = activeGames[playerId];
   var opponentId int = currentGame.GetOpponentId(playerId);

   var playerResolution int;
   var opponentResolution int;

   switch resolution {
      case message.END_GAME_NO_CONTEST:
         playerResolution = message.END_GAME_NO_CONTEST;
         opponentResolution = message.END_GAME_NO_CONTEST;
      case message.END_GAME_LOSE:
         playerResolution = message.END_GAME_LOSE;
         opponentResolution = message.END_GAME_WIN;
      case message.END_GAME_WIN:
         playerResolution = message.END_GAME_WIN;
         opponentResolution = message.END_GAME_LOSE;
      default:
         println("Unknown game resolution.");
   }

   websocket.JSON.Send(connections[playerId],
                       message.NewMessage(message.MESSAGE_TYPE_RESOLVE_GAME,
                                          message.ResolveGameMessagePart{playerResolution}));
   websocket.JSON.Send(connections[opponentId],
                       message.NewMessage(message.MESSAGE_TYPE_RESOLVE_GAME,
                                          message.ResolveGameMessagePart{opponentResolution}));
}
