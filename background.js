var keuneksen = {
	isPlaying: 'no',
	elCss: '#player',
	nowPlaying: {
		url: 'http://www.radioeksen.com/calan-sarki.php',
		defaultMessages: ['RADYO EKSEN -', 'REKLAM'],
		interval: 5000
	},
	stream: {
		title: "Radyo Eksen",
		m4a: "http://eksenwmp.radyotvonline.com:80/;"
	}
};

chrome.browserAction.setIcon({path: 'img/icon.png'});

$(function() {
	var $el = $(keuneksen.elCss),
		ready = false;

	keuneksen.el = $el;
	$el.jPlayer({
		ready: function (event) {
			ready = true;
			$el.jPlayer("setMedia", keuneksen.stream);
		},
		pause: function() {
			$el.jPlayer("clearMedia");
		},
		error: function(event) {
			if(ready && event.jPlayer.error.type === $.jPlayer.error.URL_NOT_SET) {
				$el.jPlayer("setMedia", keuneksen.stream).jPlayer("play");
			}
		},
		swfPath: "../eksen/",
		supplied: "m4a",
		preload: "none",
		wmode: "window"
	});
});

chrome.extension.onMessage.addListener(function(msg, _, sendResponse) {
	var data = localStorage.getItem('keuneksen');
	if (data) {
		data = JSON.parse(data);
	} else {
		data = {};
	}
	if (msg.type === 'set') {
		if (msg.volume) {
	    	keuneksen.el.jPlayer('volume', (msg.volume / 100));
	    	data.volume = msg.volume;
	    }
	    if (msg.isPlaying) {
	    	if (msg.isPlaying === 'yes') {
	    		keuneksen.el.jPlayer('play');
	    		keuneksen.isPlaying = 'yes';
	    		chrome.browserAction.setIcon({path: 'img/icon-play.png'});
	    	} else {
	    		keuneksen.el.jPlayer('stop');
	    		keuneksen.isPlaying = 'no';
	    		chrome.browserAction.setIcon({path: 'img/icon.png'});
	    	}
	    }
	    data = JSON.stringify(data);
	    localStorage.setItem('keuneksen', data);
	    return true;
	} else if (msg.type === 'query') {
		sendResponse(data);
		return true;
	}
});

setInterval(function() {
	if (keuneksen.isPlaying === 'yes') {
		$.ajax(keuneksen.nowPlaying.url, {
			timeout: keuneksen.nowPlaying.interval,
			success: function(response) {
				if ($.inArray($.trim(response), keuneksen.nowPlaying.defaultMessages) === -1) {
					chrome.extension.sendMessage({nowPlaying: response}, function() {});
					chrome.browserAction.getTitle({}, function(currentTitle) {
						if (currentTitle !== response) {
							chrome.browserAction.setTitle({title: response});
						}
					});
				}
			}
		});
	}
}, keuneksen.nowPlaying.interval);