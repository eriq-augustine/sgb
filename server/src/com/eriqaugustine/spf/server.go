package main;

import (
   "net/http"
   "code.google.com/p/go.net/websocket"
   "com/eriqaugustine/spf/server"
);

const (
   CLIENT_PATH = "../client"
   PORT = "3030"
   SOCKET_PATH = "/gamesocket"
);

func main() {
   http.Handle("/", http.FileServer(http.Dir(CLIENT_PATH)));
   http.Handle("/gamesocket", websocket.Handler(server.GameSocket));

   var err = http.ListenAndServe(":" + PORT, nil);
   if err != nil {
      panic("ListenAndServe: " + err.Error());
   }
}
