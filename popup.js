var popup = {};

$(function() {
	popup.$playBtn = $('#btn-play');
	popup.$volumeInp = $('#inp-volume');

	sendMessage({type: 'query'}, function(response) {
		if (response.isPlaying) {
			popup.$playBtn.data('isPlaying', response.isPlaying).attr('class', response.isPlaying);
		}
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
		if ($el.data('isPlaying') == 'yes') {
			msg.isPlaying = 'no';
			$el.data('isPlaying', 'no').attr('class', 'yes');
		} else {
			msg.isPlaying = 'yes';
			$el.data('isPlaying', 'yes').attr('class', '');
		}
		sendMessage(msg);
	});

	popup.$volumeInp.change(function() {
		var vol = $(this).val();
		var msg = {type: 'set', volume: vol};
		sendMessage(msg);
	});
}