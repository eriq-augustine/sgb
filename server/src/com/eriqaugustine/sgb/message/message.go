package message;

import (
   "fmt"
   "encoding/json"
   "com/eriqaugustine/sgb/game/gem"
);

const (
   MESSAGE_TYPE_INIT = iota
   MESSAGE_TYPE_START
   MESSAGE_TYPE_MOVE
   MESSAGE_TYPE_NEXT_TURN
   MESSAGE_TYPE_UPDATE
   MESSAGE_TYPE_DROP_GROUP_UPDATE
   MESSAGE_TYPE_NO_CONTEST
   NUM_MESSAGE_TYPES
);

type Message struct {
   Type int;
   Payload *json.RawMessage;
};

type InitMessagePart struct {
   Time uint64;
   Pattern int;
};

type StartMessagePart struct {
   Drops [2][2]gem.Gem;
};

type MoveMessagePart struct {
   Locations [2][2]int;
   BoardHash string;
};

// You can only lose between turns, so just send a flag along withthe next turn info.
type NextTurnMessagePart struct {
   Drop [2]gem.Gem;
   PlayerPunishment *[][]*gem.Gem;
   PlayerScore int;
   OpponentPunishment int;
   Lose bool;
};

type UpdateMessagePart struct {
   PlayerPunishment int;
   OpponentPunishment int;
   OpponentScore int;
   OpponentBoard [][]*gem.Gem;
   OpponentNextDropGroup [2]gem.Gem;
   Win bool;
};

type DropGroupUpdateMessagePart struct {
   Locations [2][2]int;
};

type NoContestMessagePart struct {
};

func NewMessage(messageType int, messagePart interface{}) *Message {
   var jsonPart, err = json.Marshal(messagePart);

   if (err != nil) {
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
      case MESSAGE_TYPE_DROP_GROUP_UPDATE:
         var part DropGroupUpdateMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      case MESSAGE_TYPE_NO_CONTEST:
         var part NoContestMessagePart;
         json.Unmarshal(*this.Payload, &part);
         return part;
      default:
         fmt.Println("Unknown message type: ", this.Type);
         return nil;
   }
}
