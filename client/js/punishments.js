"use strict";

// TODO(eriq): Different punishments for different characters.
function genPunishmentGems(num, boardWidth) {
   var rtn = [];

   for (var i = 0; i < num; i++) {
      var color = Math.floor(i / boardWidth) % Gem.NUM_COLORS;
      rtn.push(new LockedGem(color));
   }

   return rtn;
}
