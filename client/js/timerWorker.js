var start = false;

var val = 0;
onmessage = function(evt) {
   if (!start) {
      start = true;
      setInterval(function() {
         val++;
         postMessage(val);
      }, 1000 / 60);
   }
}

