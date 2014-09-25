'use strict'

var storeObject = {};
function initStoreList() {
	storeObject =
		{	visible:
			{ text: 'Buy Visible'
			, onPurchase: updatePi
			, price: function() {
					return Math.floor(Math.pow(this.level + 1, 1.75)) + 4;
				}
			, statText: 'Visible Digits'
			, statValue: getDigitsVisible
			}
		,	baseValue:
			{ text: 'Base Digit Value'
			, price: function() {
					return Math.floor(Math.pow(this.level + 1, 2)) * 100;
				}
			, statText: 'Base value'
			, statValuePrefix: '+'
			, statValue: getBaseDigitValue
			}
		,	multiplier:
			{ text: 'Buy Multiplier'
 			, price: function() {
 					return Math.floor(Math.pow(this.level + 2, 2.5)) * 100;
	 			}
			, statText: 'Multiplier per digit'
			, statValuePrefix: '+x'
			, statValue: getMultiplierPerDigit
			}
		,	ratchet:
			{ text: 'Failure Ratchet'
			, price: function() {
					return Math.floor(Math.pow(this.level + 1, 2.65)) * 1000;
				}
			, statText: 'Return on failure'
			, statValue: function() {
					var pct = formatNumber(100 * getRatchetFraction());
					var dig = noContextMode ? '0' : formatNumber(getRatchetDigit());
					return pct + '% (' + dig + ')';
				}
			}
		,	blind:
			{ text: 'Blind Mode'
			, price: function() { return 5000; }
			, singlePurchase: true
			}
		,	noContext:
			{ text: 'No-Context Mode'
			, price: function() { return 25000; }
			, prereq: 'blind'
			, singlePurchase: true
			}
		,	student:
			{ text: 'Student'
			, onPurchase: recalculatePps
			, price: exponentialPrice(25)
			, pps: 0.2
			}
		};

	for (var key in storeObject) {
		var item = storeObject[key];
		if (item.pps !== undefined) {
			item.statText = item.text + 's';
			item.statValue = buildingStatValue;
		}
	}
}

function getRatchetFraction() {
	return 1 - Math.pow(0.5, getItemLevel('ratchet'));
}

function getRatchetDigit() {
	return Math.floor(currentDigit * getRatchetFraction());
}

function buildingStatValue() {
	var totalPps = this.level * this.pps;
	return this.level + ' (+' + formatNumber(totalPps).toString() + ' pps)';
}

function blindModeMultiplier() {
	return 1.5 + getItemLevel('visible') * 0.01;
}

function noContextModeMultiplier() {
	return 1.5;
}

function exponentialPrice(basePrice, exponent) {
	exponent = exponent || 1.07;
	return function() {
		return Math.floor(basePrice * Math.pow(exponent, this.level));
	};
}

function canAfford(item) {
	return points >= item.price();
}

function tryPurchase(item) {
	if (canAfford(item)) {
		points -= item.price();
		item.level++;

		if (item.onPurchase) {
			item.onPurchase();
		}

		if (item.singlePurchase || isPrereq(item)) {
			rebuildStoreHtml();
		}
	}
}

function isPrereq(item) {
	for (var id in storeObject) {
		var i = storeObject[id];
		if (storeObject[i.prereq] === item) {
			return true;
		}
	}
	return false;
}

function getItemLevel(itemName) {
	return storeObject[itemName].level;
}

function recalculatePps() {
	pointsPerSecond = 0;
	for (var id in storeObject) {
		var item = storeObject[id];
		if (item.pps) {
			pointsPerSecond += item.level * item.pps;
		}
	}
}

function canShow(item) {
	return (!item.singlePurchase || !item.level) &&
		(!item.prereq || getItemLevel(item.prereq));
}

function rebuildStoreHtml() {
	var storeHtml = '';
	var statsHtml = '';
	for (var id in storeObject) {
		var item = storeObject[id];
		if (item.level === undefined) {
			item.level = 0;
		}
		if (canShow(item)) {
			storeHtml += '<li><button id="' + id + '">' + item.text +
				': (<span id="' + id + '-price"></span>)</button></li>';
			if (item.statText) {
				statsHtml += '<li>' + item.statText + ': <span id="' + id +
					'-stat"></span></li>';
			}
		}
	}

	setHtml('store', storeHtml);
	setHtml('stats', statsHtml);

	for (var id in storeObject) {
		var item = storeObject[id];

		var elem = getId(id);
		if (elem) {
			elem.onclick = function () {
				tryPurchase(this.item);
			};
			elem.item = item;
		}
	}
}

function updateStore() {
	for (var id in storeObject) {
		var item = storeObject[id];
		setText(id + '-price', formatNumber(item.price()));

		if (item.statText) {
			var prefix = item.statValuePrefix || '';
			var value = item.statValue();
			if (typeof(value) === 'number') {
				value = formatNumber(value);
			}
			setText(id + '-stat', prefix + value);
		}
	}
}
