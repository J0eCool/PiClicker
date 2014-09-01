'use strict'

var score = 0;
var digitsRight = 0;

var lookahead = 10;
var visibleLevel = 0;
var multiLevel = 0;

var autoSaveEnabled = true;
var kSaveInterval = 30.0;
var nextSaveTime = kSaveInterval;
function saveGame() {
  var saveObj =
    { saveVersion: 1
    , score: score
    , visibleLevel: visibleLevel
    , multiLevel: multiLevel
    };
  localStorage.piClicker = btoa(JSON.stringify(saveObj));

  autoSaveEnabled = true;
  nextSaveTime = time.elapsed + kSaveInterval;

  makePopup('Game saved', 200, 400, 5);
}

function loadGame() {
  if (localStorage.piClicker) {
    try {
      var saveObj = JSON.parse(atob(localStorage.piClicker));
      score = saveObj.score;
      visibleLevel = saveObj.visibleLevel;
      multiLevel = saveObj.multiLevel;
    }
    catch (err) {
      setMessage('Whoops! Couldn\'t load save');
      autoSaveEnabled = false;
    }
  }
}

function clearSave() {
  localStorage.removeItem('piClicker');

  autoSaveEnabled = false;
}

function getDigitsVisible() {
  return 5 + visibleLevel;
}

function getMultiplierPerDigit() {
  return 0.1 + 0.05 * multiLevel;
}

function scoreMultiplier() {
  return 1 + digitsRight * getMultiplierPerDigit();
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
      var toAdd = scoreMultiplier();
      score += toAdd;
      makeScorePopup(toAdd);
      digitsRight = (digitsRight + 1) % piString.length;
    }
    else {
      setMessage('Wrong! Correct digit was <b>' + correctDigit + '</b>');
      digitsRight = 0;
      lockTimer = 0.75;
    }

    updatePi();
  }
}
var makeScorePopup = function() {
  var next = getId('next');

  return function(score) {
    var x = next.offsetLeft;
    var y = next.offsetTop;
    var w = next.offsetWidth;
    var h = next.offsetHeight;
    makePopup('+' + formatNumber(score), x + w / 2, y + h / 4, score);
  };
}();

function updatePi() {
  var maxVisible = getDigitsVisible();
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
  loadGame();

  updatePi();

  document.addEventListener('keydown', onKeyDown);
  window.setInterval(onUpdate, 50);
}

function visiblePrice() {
  return Math.floor(Math.pow(visibleLevel + 1, 1.75)) + 4;
}

function buyVisible() {
  if (score >= visiblePrice()) {
    score -= visiblePrice();
    visibleLevel++;

    updatePi();
  }
}

function multiPrice() {
  return Math.floor(Math.pow(multiLevel + 2, 2.5)) * 10;
}

function buyMulti() {
  if (score >= multiPrice()) {
    score -= multiPrice();
    multiLevel++;
  }
}

function updateLock() {
  lockTimer -= time.dt;

  getId('pi').style.backgroundColor = lockTimer > 0 ? '#aaa' : '#fff';
}

var msgTimer = 0.0;
function setMessage(msg) {
  setHtml('msg', msg)
  msgTimer = 2.5;
}

function updateMessage() {
  msgTimer -= time.dt;

  getId('msg').style.opacity = lerpInverse(msgTimer, 0.0, 0.35);
}

var popupList = [];
function rebuildPopupHtml() {
  var popupHtml = '';
  for (var i = 0; i < popupList.length; i++) {
    var p = popupList[i];
    popupHtml += '<span id="' + p.id + '" style="opacity:' + p.a +
      ';position:absolute;left:' + p.x + 'px;top:' + p.y + 'px">' +
      p.html + '</span>';
  }
  setHtml('popups', popupHtml);
}
var makePopup = function() {
  var idNum = 0;
  return function (content, xPos, yPos, velScale) {
    popupList.push({
      id: "popup-" + idNum,
      x: xPos,
      y: yPos,
      a: 1,
      velX: randRange(-10, 10) * Math.pow(velScale, 0.65),
      velY: randRange(-20, -15) * Math.pow(velScale, 0.5),
      lifetime: 2.0,
      html: content
    });
    idNum++;

    rebuildPopupHtml();
  };
}();

function updatePopups() {
  var needsRebuild = false;
  for (var i = popupList.length - 1; i >= 0; i--) {
    var p = popupList[i];
    p.velY += 250 * time.dt;
    p.x += p.velX * time.dt;
    p.y += p.velY * time.dt;
    p.lifetime -= time.dt;
    p.a = lerpInverse(p.lifetime, 0.0, 0.5);

    var style = getId(p.id).style;
    style.left = p.x + 'px';
    style.top = p.y + 'px';
    style.opacity = p.a;

    if (p.lifetime <= 0) {
      popupList.splice(i, 1);
      needsRebuild = true;
    }
  }

  if (needsRebuild) {
    rebuildPopupHtml();
  }
}

var time = { dt: 0.0, elapsed: 0.0, lastFrame: Date.now() };
function onUpdate() {
  var now = Date.now();
  time.dt = (now - time.lastFrame) / 1000;
  time.elapsed += time.dt;
  time.lastFrame = now;

  updateLock();
  updateMessage();
  updatePopups();

  setText('score', formatNumber(score));
  setText('digits', formatNumber(digitsRight));
  setText('mult', 'x' + formatNumber(scoreMultiplier()));

  setText('visibleDigits', formatNumber(getDigitsVisible()));
  setText('visiblePrice', formatNumber(visiblePrice()));
  setText('multiDigit', '+' + formatNumber(getMultiplierPerDigit()));
  setText('multiPrice', formatNumber(multiPrice()));

  if (autoSaveEnabled && time.elapsed > nextSaveTime) {
    saveGame();
  }
}

onInit();
