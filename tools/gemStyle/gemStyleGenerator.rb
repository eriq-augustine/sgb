# The format of the gem spritesheet is assumed to be as follows:
#  <normal red>, <red destruction>, ...
#  <repeat for yellow, green, and blue>
#  <destroyer red>, <red destroyer destruction>, ...
#  <repeat for yellow, green, and blue>
#  <star>, <star destruction>, ...
#  <locked red 1>, <locked yellow 1>, <locked green 1>, <locked blue 1>
#  <repeat for 2, 3, 4, and 5>


# The order of the colors should not break any functionality, but the convention is:
#  red, yellow, green, and blue.

GEM_COLORS = 4

if (ARGV.size() != 3)
   puts "USAGE: ruby gemStyleGenerator.rb <sprite sheet> <gem size> <destruction length>"
   exit 1
end

GEM_SPRITESHEET = ARGV.shift()
GEM_SIZE = ARGV.shift().to_i()
# In frames
DESTRUCTION_LENGTH = ARGV.shift().to_i()

RENDER_PREFIX = 'renderer'
ANIMATION_PREFIX = 'animation'

def printRule(selector, rules)
   puts "#{selector} {"
   rules.each{|rule|
      puts "   #{rule};"
   }
   puts "}\n\n"
end

def printGemSet(name, shortName, gemOffset)
   puts "/* #{name} */\n\n"
   for color in 0...GEM_COLORS
      printRule(".#{RENDER_PREFIX}-gem-#{shortName}-#{color}",
                ["background-position: 0px #{-1 * (gemOffset * GEM_SIZE + color * GEM_SIZE)}px"]);
   end

   puts "/* #{name} Destruction Animations */\n\n"
   for color in 0...GEM_COLORS
      for frame in 0...DESTRUCTION_LENGTH
         printRule(".#{ANIMATION_PREFIX}-gem-#{shortName}-destroy-#{color}-#{frame}",
                   ["background-position: #{frame * -1 * GEM_SIZE}px #{-1 * (gemOffset * GEM_SIZE + color * GEM_SIZE)}px"]);
      end
   end
end

printRule(".#{RENDER_PREFIX}-gem", ["background-image: url('../images/#{GEM_SPRITESHEET}')"])

printRule('.board-cell',
          ["width: #{GEM_SIZE}px",
           "height: #{GEM_SIZE}px"]);
printRule('.next-group',
          ["width: #{GEM_SIZE}px",
           "height: #{GEM_SIZE}px",
           "background-image: url('../images/#{GEM_SPRITESHEET}')"]);

gemOffset = 0;

printGemSet('Normal Gem', 'normal', gemOffset)
gemOffset += GEM_COLORS

printGemSet('Destroyer', 'destroyer', gemOffset)
gemOffset += GEM_COLORS

puts "/* Star */\n\n"
printRule(".#{RENDER_PREFIX}-gem-star",
          ["background-position: 0px #{gemOffset * GEM_SIZE * -1}px"]);
puts "/* Star Destruction Animation */\n\n"
for frame in 0...DESTRUCTION_LENGTH
   printRule(".#{ANIMATION_PREFIX}-gem-star-destroy-#{frame}",
             ["background-position: #{frame * -1 * GEM_SIZE}px #{gemOffset * GEM_SIZE * -1}px"]);
end
gemOffset += 1

puts "/* Locked */\n\n"
for number in 0...5
   for color in 0...GEM_COLORS
      printRule(".#{RENDER_PREFIX}-gem-locked-#{color}-#{number + 1}",
                ["background-position: #{color * -1 * GEM_SIZE}px #{gemOffset * GEM_SIZE * -1}px"]);
   end

   gemOffset += 1
end
