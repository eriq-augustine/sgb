"use static";

punishments = {};
punishments.NUM_PUNISHMENT_PATTERNS = 8;
punishments.patterns = [];

function getPunishmentPattern(num) {
   if (num < 0 || num >= punishments.NUM_PUNISHMENT_PATTERNS) {
      error('Unknown punishment pattern: ' + num + '.');
      return;
   }

   return punishments.patterns[num];
}

function loadPatterns() {
   // Ryu
   punishments.patterns.push([
      [Gem.COLOR_RED,   Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN],
      [Gem.COLOR_RED,   Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN],
      [Gem.COLOR_RED,   Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN],
      [Gem.COLOR_RED,   Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_YELLOW, Gem.COLOR_RED, Gem.COLOR_GREEN]
   ]);

   // Chun-Li
   punishments.patterns.push([
      [Gem.COLOR_RED,      Gem.COLOR_RED,    Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_BLUE],
      [Gem.COLOR_RED,      Gem.COLOR_RED,    Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_BLUE],
      [Gem.COLOR_YELLOW,   Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_GREEN,  Gem.COLOR_GREEN],
      [Gem.COLOR_YELLOW,   Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_GREEN,  Gem.COLOR_GREEN]
   ]);

   // Sakura
   punishments.patterns.push([
      [Gem.COLOR_GREEN, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN, Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN, Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_YELLOW]
   ]);

   // Ken
   punishments.patterns.push([
      [Gem.COLOR_RED,      Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_RED],
      [Gem.COLOR_GREEN,    Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_GREEN],
      [Gem.COLOR_BLUE,     Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE],
      [Gem.COLOR_YELLOW,   Gem.COLOR_YELLOW, Gem.COLOR_YELLOW, Gem.COLOR_YELLOW, Gem.COLOR_YELLOW, Gem.COLOR_YELLOW]
   ]);

   // Morrigan
   punishments.patterns.push([
      [Gem.COLOR_BLUE,     Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW, Gem.COLOR_BLUE],
      [Gem.COLOR_BLUE,     Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW, Gem.COLOR_BLUE],
      [Gem.COLOR_YELLOW,   Gem.COLOR_BLUE,   Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_YELLOW],
      [Gem.COLOR_YELLOW,   Gem.COLOR_BLUE,   Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_YELLOW]
   ]);

   // Hsien-Ko
   punishments.patterns.push([
      [Gem.COLOR_YELLOW,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_RED],
      [Gem.COLOR_BLUE,     Gem.COLOR_BLUE,   Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_RED,    Gem.COLOR_RED],
      [Gem.COLOR_BLUE,     Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN,    Gem.COLOR_GREEN,  Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW, Gem.COLOR_YELLOW]
   ]);

   // Donovan
   punishments.patterns.push([
      [Gem.COLOR_RED,   Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_YELLOW],
      [Gem.COLOR_RED,   Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_YELLOW, Gem.COLOR_RED,    Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN, Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE],
      [Gem.COLOR_GREEN, Gem.COLOR_GREEN,  Gem.COLOR_GREEN,  Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_BLUE]
   ]);

   // Felicia
   punishments.patterns.push([
      [Gem.COLOR_GREEN, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN, Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN, Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW],
      [Gem.COLOR_GREEN, Gem.COLOR_BLUE,   Gem.COLOR_BLUE,   Gem.COLOR_RED,    Gem.COLOR_RED,    Gem.COLOR_YELLOW]
   ]);
}

// Instead of inducing a dependency on gems loading first,
//  just delay the construction of the patterns.
document.addEventListener('DOMContentLoaded', function() {
   loadPatterns();
});
