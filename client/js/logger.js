// No strict mode because of the stack trace generation.

function error(message) {
   console.log((new Error(message)).stack);

   spfGet('_game_').stop();
}

function debug(message) {
   if (spfGet('debug')) {
      console.log('DEBUG: ' + message);
   }
}
