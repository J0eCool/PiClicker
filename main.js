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

function setIdField(field) {
  return function(id, text) {
    var elem = getId(id);
    if (elem) {
      elem[field] = text;
    }
  };
}
var setText = setIdField('innerText');
var setHtml = setIdField('innerHTML');

var score = 0;
var digitsRight = 0;

var lookahead = 10;
var maxVisible = 5;

function scoreMultiplier() {
  return 1 + digitsRight * 0.1;
}

var lockTimer = 0.0;
function onKeyDown(event) {
  if (lockTimer > 0) {
    return;
  }

  var key = event.keyCode;
  var digit = -1;

  if (key >= 48 && key <= 57) {
    digit = key - 48;
  }
  else if (key >= 96 && key <= 105) {
    digit = key - 96;
  }

  if (digit >= 0) {
    var correctDigit = piString[digitsRight];
    if (digit == correctDigit) {
      score += scoreMultiplier();
      digitsRight = (digitsRight + 1) % piString.length;
    }
    else {
      setMessage('Wrong! Correct digit was ' + correctDigit);
      digitsRight = 0;
      lockTimer = 0.75;
    }

    updatePi();
  }
}

function clamp(t, lo, hi) {
  if (t > hi) {
    return hi;
  }
  if (t < lo) {
    return lo;
  }
  return t;
}

function clamp01(t) {
  return clamp(t, 0, 1);
}

function lerp(t, lo, hi) {
  return (hi - lo) * clamp01(t) + lo;
}

function lerpInverse(val, lo, hi) {
  return clamp01((val - lo) / (hi - lo));
}

function updatePi() {
  var nextDig = digitsRight <= maxVisible ? piString[digitsRight] : '?';
  setText('next', nextDig);

  var upcomingHtml = '';
  var previousHtml = '';
  var digitHtml = function(index) {
    var size = lerp(Math.abs(index) / lookahead, 200, 50);
    var d = digitsRight + index;
    var isVisible = d >= 0 && (d <= maxVisible || d < digitsRight);
    var digit = isVisible ? piString[d] : 0;
    var alpha = isVisible ? 1 : 0;
    return '<span style="font-size:' +
      size + '%;opacity:' + alpha + '">' + digit + '</span>';
  };
  for (var i = 1; i < lookahead; i++) {
    upcomingHtml += digitHtml(i);
    previousHtml = digitHtml(-i) + previousHtml;
  }
  setHtml('upcoming', upcomingHtml);
  setHtml('previous', previousHtml);
}

function onInit() {
  updatePi();

  document.addEventListener('keydown', onKeyDown);
  window.setInterval(onUpdate, 50);
}

function visiblePrice() {
  return Math.floor(Math.pow(maxVisible - 4, 1.75)) + 4;
}

function buyVisible() {
  if (score >= visiblePrice()) {
    score -= visiblePrice();
    maxVisible++;

    updatePi();
  }
}

function updateLock() {
  lockTimer -= time.dt;

  getId('pi').style.backgroundColor = lockTimer > 0 ? '#aaa' : '#fff';
}

var msgTimer = 0.0;
function setMessage(msg) {
  setText('msg', msg)
  msgTimer = 1.4;
}

function updateMessage() {
  msgTimer -= time.dt;

  getId('msg').style.opacity = lerpInverse(msgTimer, 0, 0.35);
}

var time = { dt: 0.0, lastFrame: Date.now() };
function onUpdate() {
  var now = Date.now();
  time.dt = (now - time.lastFrame) / 1000;
  time.lastFrame = now;

  updateLock();
  updateMessage();

  setText('score', score);
  setText('digits', digitsRight);
  setText('mult', 'x' + scoreMultiplier());

  setText('visibleDigits', maxVisible);
  setText('visiblePrice', visiblePrice());
}

onInit();
