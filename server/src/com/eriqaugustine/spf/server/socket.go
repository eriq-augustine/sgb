package server;

import (
   "encoding/json"
   "fmt"
   "net/http"
   "code.google.com/p/go.net/websocket"
   "reflect"
);

const (
   MessageTypeInit = iota
   // TODO(eriq): more types
   MessageTypeSomething
   numberOfMessageTypes
);

type Message struct {
   Type string;
   Payload *json.RawMessage;
};

func GameServer(ws *websocket.Conn) {
   //var msg map[string]*json.RawMessage;
   var msg Message;

   println("On Connect");

   SocketLifeLoop:
   for {
      var err = websocket.JSON.Receive(ws, &msg);
      if err != nil {
         switch err.(type) {
            case *json.SyntaxError:
               println("unmarshal error!");
               continue;
            default:
               fmt.Printf("ERROR: %s\n", err.Error());
               break SocketLifeLoop;
         }
      }

      fmt.Printf("Got Message: %+v\n", msg);

      var temp map[string]*json.RawMessage;
      json.Unmarshal(*msg.Payload, &temp);
      fmt.Printf("Payload: %+v\n", temp);

      websocket.Message.Send(ws, "got it");
   }

   println("On Close");
}

// This example demonstrates a trivial echo server.
func ExampleHandler() {
   http.Handle("/testsocket", websocket.Handler(GameServer));
   err := http.ListenAndServe(":12345", nil);
   if err != nil {
      panic("ListenAndServe: " + err.Error());
   }
}
