// No strict mode because of the stack trace generation.

function error(message) {
   console.log((new Error(message)).stack);

   sgbGet('_game_').stop();
}

function debug(message) {
   if (sgbGet('debug')) {
      console.log('DEBUG: ' + message);
   }
}
