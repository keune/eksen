var keuneksen = {
	elCss: '#player',
	stream: {
		title: "Radyo Eksen",
		m4a: "http://eksenwmp.radyotvonline.com:80/;"
	}
};

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
	if(msg.type == 'set') {
		if(msg.volume) {
	    	keuneksen.el.jPlayer('volume', (msg.volume / 100));
	    	data.volume = msg.volume;
	    }
	    if(msg.isPlaying) {
	    	if(msg.isPlaying === 'yes') {
	    		keuneksen.el.jPlayer('play');
	    		data.isPlaying = 'yes';
	    		chrome.browserAction.setIcon({path: 'img/icon-play.png'});
	    	} else {
	    		keuneksen.el.jPlayer('stop');
	    		data.isPlaying = 'no';
	    		chrome.browserAction.setIcon({path: 'img/icon.png'});
	    	}
	    }
	    data = JSON.stringify(data);
	    localStorage.setItem('keuneksen', data);
	    return true;
	} else if (msg.type == 'query') {
		sendResponse(data);
		return true;
	}
});

setInterval(function() {
	var addr = 'http://www.radioeksen.com/calan-sarki.php';
	var defaultMsg = 't';
	$.ajax(addr, {
		success: function(response) {
			if (response != defaultMsg) {
				console.log(response);
				chrome.browserAction.setTitle({title: response});
			}
		}
	});
}, 4000);