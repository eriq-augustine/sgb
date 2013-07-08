"use strict";

function quickplay() {
   $('#js-quickplay').remove();

   $('#js-stage-area').prepend("<div id='js-punishment-patterns-area'>" +
                               " <h2>Pick Your Punishment Pattern</h2>" +
                               " <div id='js-inner-pattern-area'></div>" +
                               "</div>");
   staticRenderDropPatterns('js-inner-pattern-area', 'choosePattern');
}

function choosePattern(chosenPattern) {
   $('#js-punishment-patterns-area').remove();
   $('#js-stage-area').prepend("<div id='js-waiting' class='waiting'>" +
                               " <h2>Waiting For Opponent</h2>" +
                               " <div class='loading'></div>" +
                               "</div>");

   initGame(chosenPattern, showBoards);
}

function showBoards() {
   $('#js-waiting').remove();
   $('#js-boards').removeClass('no-display');
}
