package game;

import (
   "io"
   "fmt"
   "crypto/md5"
);

type Board struct {
   board [][]*Gem;
};

func NewBoard(height int, width int) *Board {
   var gameBoard *Board = new(Board);

   gameBoard.board = make([][]*Gem, height);

   for i := 0; i < height; i++ {
      gameBoard.board[i] = make([]*Gem, width);
   }

   return gameBoard;
}

func (this *Board) hash() string {
   var boardString string = "";

   for _, row := range this.board {
      for _, gem := range row {
         if (gem == nil) {
            boardString += "0"
         } else {
            boardString += gem.hash();
         }
      }
   }

   hash := md5.New();
   io.WriteString(hash, boardString);
   return fmt.Sprintf("%x", hash.Sum(nil));
}

// Fall and destroy any blocks.
func (this *Board) stabalize() {
   // TODO(eriq)
}

func (this *Board) fall() {
   // TODO(eriq)
}

func (this *Board) destroy() {
   // TODO(eriq)
}
