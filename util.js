'use strict'

// var getId = function() {
//   var cache = {};
//   return function(id) {
//     if (!cache[id]) {
//       cache[id] = document.getElementById(id);
//     }
//     return cache[id];
//   };
// }();

function getId(id) { return document.getElementById(id); }

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

function formatNumber(x, precision, report) {
  if (precision === undefined) {
    precision = 2;
  }

  var parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    var decimal = parts[1];
    if (decimal.length > precision) {
      decimal = Math.round(parts[1].slice(0, precision + 1) / 10).toString();
      while (decimal.length < precision) {
        // we lose leading 0s when converting to a number; re-add them
        decimal = '0' + decimal;
      }
    }
    decimal = decimal.slice(0, precision);
    for (var i = decimal.length - 1; i >= 0; i--) {
      if (decimal[i] === '0') {
        decimal = decimal.slice(0, i);
      }
      else {
        break;
      }
    }
    if (decimal.length > 0) {
      parts[1] = '.' + decimal;
    }
    else {
      parts[1] = '';
    }
  }
  return parts.join('');
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
