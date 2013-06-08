'use strict';

function addTime() {
   var newNode = document.createElement('div');

   newNode.innerHTML =
      '<span>Mean Time: </span><span style="margin-right: 20px;">' + window.mean + '</span>' +
      '<span>Median Time: </span><span style="margin-right: 20px;">' + window.median + '</span>' +
      '<span>Num Times: </span><span style="margin-right: 20px;">' + window.times.length + '</span>' +
      '<hr />';

   document.getElementById('times').appendChild(newNode);
}

function calcTimes() {
   if (window.times.length === 0) {
      return;
   }

   var sum = 0;

   window.times.sort();

   for (var i = 0; i < window.times.length; i++) {
      sum += window.times[i];
   }
   window.mean = sum / window.times.length;

   if (window.times.length % 2 === 0) {
      window.median =
         (window.times[window.times.length / 2] +
         window.times[(window.times.length / 2) - 1]) / 2;
   } else {
      window.median = window.times[Math.floor(window.times.length / 2)];
   }

   addTime();

   window.times = [];
}

document.addEventListener('DOMContentLoaded', function() {
   window.mean = 0;
   window.median = 0;
   window.times = [];
   window.lastTime = -1;

   document.addEventListener('keypress', function(event) {
      var newTime = Date.now();

      if (window.lastTime !== -1) {
         var timeDelta = newTime - window.lastTime;
         window.times.push(timeDelta);
         document.getElementById('last-time').innerHTML = timeDelta;
      }

      window.lastTime = newTime;
   });
});
