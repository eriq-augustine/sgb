function error(message) {
   console.log((new Error(message)).stack);

   spfGet('_game_').stop();
}
