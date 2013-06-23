// No strict mode because of the stack trace generation.

// TODO(eriq): Enhance this to include warnings and more optional stack traces.

function error(message) {
   console.log((new Error(message)).stack);

   spfGet('_game_').stop();
}

function debug(message) {
   if (spfGet('debug')) {
      console.log('DEBUG: ' + message);
   }
}
