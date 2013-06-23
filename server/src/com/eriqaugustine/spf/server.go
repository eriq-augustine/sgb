package main;

import (
   "net/http"
   "code.google.com/p/go.net/websocket"
   "com/eriqaugustine/spf/server"
);

func main() {
   http.Handle("/testsocket", websocket.Handler(server.GameServer));
   err := http.ListenAndServe(":12345", nil);
   if err != nil {
      panic("ListenAndServe: " + err.Error());
   }
}
