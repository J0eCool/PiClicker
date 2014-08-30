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
    if (digit == piString[digitsRight]) {
      score += scoreMultiplier();
      digitsRight = (digitsRight + 1) % piString.length;
    }
    else {
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

function updatePi() {
  var nextDig = digitsRight <= maxVisible ? piString[digitsRight] : '?';
  setText('next', nextDig);

  var upcomingHtml = '';
  var previousHtml = '';
  var getSpan = function(index) {
    var size = lerp(Math.abs(index) / lookahead, 200, 50);
    var u = digitsRight + index;
    var vu = u >= 0 && (u <= maxVisible || u < digitsRight);
    var pu = vu ? piString[u] : 0;
    var au = vu ? 100 : 0;
    return '<span style="font-size:' +
      size + '%;opacity:' + au + '">' + pu + '</span>';
  };
  for (var i = 1; i < lookahead; i++) {
    upcomingHtml += getSpan(i);
    previousHtml = getSpan(-i) + previousHtml;
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
  return Math.pow(maxVisible - 4, 2) + 4;
}

function buyVisible() {
  if (score >= visiblePrice()) {
    score -= visiblePrice();
    maxVisible++;

    updatePi();
  }
}

var time = { dt: 0.0, lastFrame: Date.now()}
function onUpdate() {
  var now = Date.now();
  time.dt = (now - time.lastFrame) / 1000;
  time.lastFrame = now;

  lockTimer -= time.dt;

  getId('pi').style.backgroundColor = lockTimer > 0 ? '#aaa' : '#fff';

  setText('score', score);
  setText('digits', digitsRight);
  setText('mult', 'x' + scoreMultiplier());

  setText('visibleDigits', maxVisible);
  setText('visiblePrice', visiblePrice());
}

onInit();
