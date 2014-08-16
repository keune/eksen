var popup = {
	bg: chrome.extension.getBackgroundPage()
};

$(function() {
	popup.$playBtn = $('#btn-play');
	popup.$volumeInp = $('#inp-volume');
	popup.$nowPlaying = $('#now-playing');

	if (popup.bg.keuneksen.isPlaying) {
		popup.bg.keuneksen.setTexts();
		popup.$playBtn.attr('class', popup.bg.keuneksen.isPlaying);
	}
	sendMessage({type: 'query'}, function(response) {
		if (response.volume) {
			popup.$volumeInp.val(response.volume);
		}
	});
	bindEvents();
});

function sendMessage(msg, cb) {
	chrome.extension.sendMessage(msg, function(response) {
		if (cb) {
			cb(response);
		}
	});
}
function bindEvents() {
	popup.$playBtn.click(function() {
		var $el = $(this);
		var msg = {type: 'set'};
		if (popup.bg.keuneksen.isPlaying === 'yes') {
			$el.attr('class', '');
			msg.isPlaying = 'no';
		} else {
			$el.attr('class', 'yes');
			msg.isPlaying = 'yes';
		}
		sendMessage(msg);
	});

	popup.$volumeInp.change(function() {
		var vol = $(this).val();
		var msg = {type: 'set', volume: vol};
		sendMessage(msg);
	});
}

function setNowPlaying(txt) {
	var fontSize;
	if (txt.length > 40) {
		fontSize = '11px';
	} else {
		fontSize = '13px';
	}
	popup.$nowPlaying
		.text(txt)
		.attr('title', txt)
		.css('font-size', fontSize);
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.nowPlaying) {
		setNowPlaying(request.nowPlaying);
	}
});