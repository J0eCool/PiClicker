'use strict'

var getId = function() {
  var cache = {};
  return function(id) {
    if (!cache[id]) {
      cache[id] = document.getElementById(id);
    }
    return cache[id];
  };
}();

function setText(id, text) {
  var elem = getId(id);
  if (elem) {
    elem.innerText = text;
  }
}

var score = 0;
// var pi = '31415926535897932';
var index = 0;

function scoreMultiplier() {
  return 1 + index / 4;
}

function onKeyDown(event) {
  var key = event.keyCode;
  var digit = -1;

  if (key >= 48 && key <= 57) {
    digit = key - 48;
  }
  else if (key >= 96 && key <= 105) {
    digit = key - 96;
  }

  setText('key', key);
  if (digit >= 0) {
    setText('digit', digit);
    if (digit == pi[index]) {
      score += scoreMultiplier();
      index = (index + 1) % pi.length;
    }
    else {
      index = 0;
    }
  }
}

function onUpdate() {
  setText('score', score);
  setText('next', pi.slice(index, index + 5));
  setText('mult', scoreMultiplier());
}

document.addEventListener('keydown', onKeyDown);
window.setInterval(onUpdate, 50);
