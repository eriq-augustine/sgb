"use strict";

var interval = 1000 / 20;
var timerHandle = null;
var val = 0;

self.onmessage = function(evt) {
   if (evt.data === 'start') {
      if (!timerHandle) {
         timerHandle = setInterval(function() {
            postMessage(val++);
         }, interval);
      }
   } else if (evt.data === 'stop') {
      if (timerHandle) {
         clearInterval(timerHandle);
      }
   }
};
