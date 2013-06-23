package server;

import (
   "fmt"
   "encoding/json"
   "com/eriqaugustine/spf/game"
);

const (
   MESSAGE_TYPE_INIT = iota
   MESSAGE_TYPE_START
   MESSAGE_TYPE_MOVE
   MESSAGE_TYPE_NEXT_DROP
   MESSAGE_TYPE_PUNISHMENT
   MESSAGE_TYPE_UPDATE
   MESSAGE_TYPE_END_GAME
   NUM_MESSAGE_TYPES
);

type Message struct {
   Type int;
   Payload *json.RawMessage;
};

type InitMessagePart struct {
   Time uint64;
};

type StartMessagePart struct {
   Drops [2][2]game.Gem;
};

type MoveMessagePart struct {
   FirstRow uint;
   FirstCol uint;
   SecondRow uint;
   SecondCol uint;
   BoardHash string;
};

type NextDropMessagePart struct {
   Drop [2]game.Gem;
};

type PunishmentMessagePart struct {
   PlayerPunishment uint;
   OpponentPunishment uint;
};

type UpdateMessagePart struct {
   PlayerPunishment uint;
   OpponentPunishment uint;
   // TODO(eriq): Make this a real board.
   OpponentBoard uint;
};

type EndGameMessagePart struct {
   Win bool;
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
      case MESSAGE_TYPE_NEXT_DROP:
         var part NextDropMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_PUNISHMENT:
         var part PunishmentMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_UPDATE:
         var part UpdateMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_END_GAME:
         var part EndGameMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      default:
         fmt.Println("Unknown message type: ", this.Type);
         return nil;
   }
}
