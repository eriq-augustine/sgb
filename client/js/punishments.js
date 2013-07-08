"use static";

punishments = {};
punishments.NUM_PUNISHMENT_PATTERNS = 2;
punishments.patterns = [];

function getPunishmentPattern(num) {
   if (num < 0 || num >= punishments.NUM_PUNISHMENT_PATTERNS) {
      error('Unknown punishment pattern: ' + num + '.');
      return;
   }

   return punishments.patterns[num];
}

function loadPatterns() {
   punishments.patterns.push(
      [[Gem.COLOR_RED, Gem.COLOR_RED, Gem.COLOR_RED, Gem.COLOR_RED, Gem.COLOR_RED, Gem.COLOR_RED],
       [Gem.COLOR_YELLOW, Gem.COLOR_YELLOW, Gem.COLOR_YELLOW, Gem.COLOR_YELLOW, Gem.COLOR_YELLOW, Gem.COLOR_YELLOW],
       [Gem.COLOR_GREEN, Gem.COLOR_GREEN, Gem.COLOR_GREEN, Gem.COLOR_GREEN, Gem.COLOR_GREEN, Gem.COLOR_GREEN],
       [Gem.COLOR_BLUE, Gem.COLOR_BLUE, Gem.COLOR_BLUE, Gem.COLOR_BLUE, Gem.COLOR_BLUE, Gem.COLOR_BLUE]
      ]);

   punishments.patterns.push(
      [[Gem.COLOR_RED, Gem.COLOR_GREEN, Gem.COLOR_BLUE, Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN],
       [Gem.COLOR_RED, Gem.COLOR_GREEN, Gem.COLOR_BLUE, Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN],
       [Gem.COLOR_RED, Gem.COLOR_GREEN, Gem.COLOR_BLUE, Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN],
       [Gem.COLOR_RED, Gem.COLOR_GREEN, Gem.COLOR_BLUE, Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN]
      ]);
}

// Instead of inducing a dependency on gems loading first,
//  just delay the construction of the patterns.
document.addEventListener('DOMContentLoaded', function() {
   loadPatterns();
});
