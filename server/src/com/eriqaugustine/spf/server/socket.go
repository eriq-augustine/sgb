package server;

import (
   "encoding/json"
   "fmt"
   "code.google.com/p/go.net/websocket"
   "com/eriqaugustine/spf/game"
);

var connectionId int = 0;

var connections = make(map[int]*websocket.Conn);
var activeGames = make(map[int]*game.Game);

// TODO(eriq): queue
var waitingPlayer int = -1;

func GameServer(ws *websocket.Conn) {
   connectionId++;
   var id = connectionId;
   connections[id] = ws;

   var msg Message;

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
            default:
               fmt.Printf("ERROR: %s\n", err.Error());
               break SocketLifeLoop;
         }
      }

      var messagePart = msg.DecodeMessagePart();
      switch msgType := messagePart.(type) {
         case InitMessagePart:
            if (waitingPlayer == -1) {
               waitingPlayer = id;
            } else {
               var newGame *game.Game = game.NewGame(id, waitingPlayer);
               waitingPlayer = -1;
               broadcastStart(ws, newGame);
            }
         case MoveMessagePart:
            // TEST
            println("Move");
         default:
            fmt.Println("Unknow type: ", msgType);
            continue;
      }
   }

   delete(connections, id);

   println("On Close");
}

func broadcastStart(ws *websocket.Conn, currentGame *game.Game) {
   // Initial drop will be the same for both players.
   var dropSet [2][2]game.Gem = [2][2]game.Gem{
      currentGame.NextPlayer1Drop(),
      currentGame.NextPlayer1Drop(),
   };

   var message = NewMessage(MESSAGE_TYPE_START, StartMessagePart{dropSet});

   for _, playerId := range currentGame.Players {
      websocket.JSON.Send(connections[playerId], message);
   }
}
