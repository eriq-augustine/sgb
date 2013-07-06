"use strict";

function quickplay() {
   $('#js-quickplay').remove();

   $('#js-stage-area').prepend("<div id='js-waiting' class='waiting'>" +
                               " <h2>Waiting For Opponent</h2>" +
                               " <div class='loading'></div>" +
                               "</div>");

   initGame(showBoards);
}

function showBoards() {
   $('#js-waiting').remove();
   $('#js-boards').removeClass('no-display');
}
