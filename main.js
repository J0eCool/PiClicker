'use strict'

var points = 0;
var currentDigit = 0;
var combo = 0;

var pointsPerSecond = 0;

var lookahead = 10;
var visibleLevel = 0;
var multiLevel = 0;

var blindMode = false;

var autoSaveEnabled = true;
var kSaveInterval = 30.0;
var nextSaveTime = kSaveInterval;
function saveGame() {
  var storeFilter = function (obj) {
    var ret = {};
    for (var key in obj) {
      ret[key] = obj[key].level;
    }
    return ret;
  }
  var saveObj =
    { saveVersion: 1
    , points: points
    , storeLevels: storeFilter(storeObject)
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
      points = saveObj.points;
      var keys = Object.keys(saveObj.storeLevels);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        storeObject[key].level = saveObj.storeLevels[key];
      }
    }
    catch (err) {
      setMessage('Whoops! Couldn\'t load save');
      console.log(err);
      autoSaveEnabled = false;
    }
  }
}

function clearSave() {
  localStorage.removeItem('piClicker');

  autoSaveEnabled = false;
}

function getDigitsVisible() {
  return 5 + getItemLevel('visible');
}

function getMultiplierPerDigit() {
  return 0.1 + 0.05 * getItemLevel('multiplier');
}

function getBaseDigitValue() {
  return 1 + getItemLevel('baseValue');
}

function scoreMultiplier() {
  var mult = 1 + combo * getMultiplierPerDigit();
  if (blindMode) {
    mult *= blindModeMultiplier();
  }
  return mult;
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
    var correctDigit = piString[currentDigit];
    if (digit == correctDigit) {
      var toAdd = getBaseDigitValue() * scoreMultiplier();
      points += toAdd;
      makeScorePopup(toAdd);
      currentDigit++;
      combo++;
    }
    else {
      var retDig = getId('enable-ratchet').checked ? getRatchetDigit() : 0;
      goToDigit(retDig);
      setMessage('Wrong! Correct digit was <b>' + correctDigit + '</b>');
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
    makePopup('+' + formatNumber(score), x + w / 2, y + h / 4, scoreMultiplier());
  };
}();

function updatePi() {
  var maxVisible = getDigitsVisible();
  var nextDig = currentDigit <= maxVisible ? piString[currentDigit] : '?';
  // setText('next', nextDig);

  var upcomingHtml = '';
  var previousHtml = '';
  var digitHtml = function(index) {
    var size = lerp(Math.abs(index) / lookahead, 225, 50);
    var d = currentDigit + index;
    var isVisible = d >= 0 && (d <= maxVisible || d < currentDigit);
    var digit = '?';
    if (isVisible &&
        !(blindMode && d >= currentDigit)) {
      digit = piString[d];
    }
    var alpha = isVisible || index === 0 ? 1 : 0;
    return '<span style="font-size:' +
      size + '%;opacity:' + alpha + '">' + digit + '</span>';
  };
  for (var i = 1; i < lookahead; i++) {
    upcomingHtml += digitHtml(i);
    previousHtml = digitHtml(-i) + previousHtml;
  }
  setHtml('next', digitHtml(0));
  setHtml('upcoming', upcomingHtml);
  setHtml('previous', previousHtml);
}

function goToDigit(digit) {
  currentDigit = digit;
  combo = 0;

  updatePi();
}

function toggleBlindMode() {
  if (!blindMode) {
    goToDigit(0);
  }
  blindMode = !blindMode;

  updatePi();
}

function onInit() {
  initStoreList();
  rebuildStoreHtml();

  loadGame();

  updatePi();
  recalculatePps();

  document.addEventListener('keydown', onKeyDown);
  window.setInterval(onUpdate, 50);
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

  points += pointsPerSecond * time.dt;

  setText('points', formatNumber(points));
  setText('pps', formatNumber(pointsPerSecond));
  setText('digits', formatNumber(currentDigit));
  setText('combo', formatNumber(combo));
  setText('mult', 'x' + formatNumber(scoreMultiplier()));

  getId('pps-container').style.display = pointsPerSecond > 0 ? '' : 'none';

  updateStore();

  if (autoSaveEnabled && time.elapsed > nextSaveTime) {
    saveGame();
  }
}

onInit();
