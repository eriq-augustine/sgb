"use strict";

// TODO(eriq): Get keys from settings.
document.addEventListener('keydown', function(event) {
   switch(event.keyCode) {
      case 32:  // Space
         window.game.dropNow();
         break;
      case 37:  // Left Arrow
         window.game.goLeft();
         break;
      case 38:  // Up Arrow
         window.game.changeOrientation();
         break;
      case 39:  // Right Arrow
         window.game.goRight();
         break;
      case 40:  // Down Arrow
         window.game.goDown();
         break;
   }
});

document.addEventListener('DOMContentLoaded', function() {
   var myWorker = new Worker("js/boardWorker.js");
   myWorker.onmessage = function(evt) {
      // TODO
   };
   // TEST
   //myWorker.postMessage('start');

   window.board = new Board('js-the-board', 12, 7);
   window.board.init();
});

function Board(id, height, width) {
   this.id = id;
   this.height = height;
   this.width = width;
}

Board.prototype.init = function() {
   var html = '<div class="inner-board">';

   for (var row = 0; row < this.height; row++) {
      html += '<div id="' + this.id + '-' + row + '" class="board-row board-row-' + row + '">';

      for (var col = 0; col < this.width; col++) {
         html += '<div id="' + this.id + '-' + row + '-' + col + '"' +
                 ' class="board-cell' +
                         ' board-cell-' + row + '-' + col +
                         ' board-col-' + col + '"></div>';
      }

      html += '</div>';
   }

   html += '</div>';

   $('#' + this.id).html(html);
};
