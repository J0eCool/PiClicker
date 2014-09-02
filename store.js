'use strict'

var storeList = [];

function initStoreList() {
	storeList =
		[	{ id: 'visible'
			, text: 'Buy Visible'
			, onClick: buyVisible
			, price: visiblePrice
			, statText: 'Visible Digits'
			, statValue: getDigitsVisible
			}
		,	{ id: 'multi'
			, text: 'Buy Multiplier'
			, onClick: buyMulti
			, price: multiPrice
			, statText: 'Multiplier per digit'
			, statValuePrefix: '+x'
			, statValue: getMultiplierPerDigit
			, wow: function () {return this;}
			}
		];
}	

function rebuildStoreHtml() {
	var storeHtml = '';
	var statsHtml = '';
	for (var i = 0; i < storeList.length; i++) {
		var item = storeList[i];
		storeHtml += '<li><button id="' + item.id + '">' + item.text +
			': (<span id="' + item.id + '-price"></span>)</button></li>';
		statsHtml += '<li>' + item.statText + ': <span id="' + item.id +
			'-stat"></span></li>';
	}

	setHtml('store', storeHtml);
	setHtml('stats', statsHtml);

	for (var i = 0; i < storeList.length; i++) {
		var item = storeList[i];
		getId(item.id).onclick = item.onClick;
	}
}

function updateStore() {
	for (var i = 0; i < storeList.length; i++) {
		var item = storeList[i];
		setText(item.id + '-price', formatNumber(item.price()));
		var prefix = item.statValuePrefix || '';
		setText(item.id + '-stat', prefix + formatNumber(item.statValue()));
	}
}

function visiblePrice() {
	return Math.floor(Math.pow(visibleLevel + 1, 1.75)) + 4;
}

function buyVisible() {
	if (points >= visiblePrice()) {
		points -= visiblePrice();
		visibleLevel++;

		updatePi();
	}
}

function multiPrice() {
	return Math.floor(Math.pow(multiLevel + 2, 2.5)) * 10;
}

function buyMulti() {
	if (points >= multiPrice()) {
		points -= multiPrice();
		multiLevel++;
	}
}

