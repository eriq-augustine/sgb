package message;

import (
   "fmt"
   "encoding/json"
   "com/eriqaugustine/spf/game/gem"
);

const (
   MESSAGE_TYPE_INIT = iota
   MESSAGE_TYPE_START
   MESSAGE_TYPE_MOVE
   MESSAGE_TYPE_NEXT_TURN
   MESSAGE_TYPE_UPDATE
   MESSAGE_TYPE_RESOLVE_GAME
   NUM_MESSAGE_TYPES
);

const (
   END_GAME_LOSE = iota
   END_GAME_WIN
   END_GAME_NO_CONTEST
   NUM_END_GAMES
);

type Message struct {
   Type int;
   Payload *json.RawMessage;
};

type InitMessagePart struct {
   Time uint64;
};

type StartMessagePart struct {
   Drops [2][2]gem.Gem;
};

type MoveMessagePart struct {
   Locations [2][2]int;
   BoardHash string;
};

type NextTurnMessagePart struct {
   Drop [2]gem.Gem;
   PlayerPunishment int;
   OpponentPunishment int;
};

type UpdateMessagePart struct {
   PlayerPunishment int;
   OpponentPunishment int;
   OpponentBoard [][]*gem.Gem;
};

type ResolveGameMessagePart struct {
   Resolution int;
};

func NewMessage(messageType int, messagePart interface{}) *Message {
   var jsonPart, err = json.Marshal(messagePart);

   if (err != nil) {
      // TODO(eriq): Real logging
      println("Error marshaling start message part.");
      return nil;
   }

   return &Message{messageType, (*json.RawMessage)(&jsonPart)};
}

func (this *Message) DecodeMessagePart() interface{} {
   switch this.Type {
      case MESSAGE_TYPE_INIT:
         var part InitMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_START:
         var part StartMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_MOVE:
         var part MoveMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_NEXT_TURN:
         var part NextTurnMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_UPDATE:
         var part UpdateMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_RESOLVE_GAME:
         var part ResolveGameMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      default:
         fmt.Println("Unknown message type: ", this.Type);
         return nil;
   }
}
