var ifrSrc = 'http://www.radyotvonline.com/Players.aspx?ID=1042';
$(function() {
	$('#btn-play').click(function() {
		var $el = $(this);
		if ($el.data('state') == 'play') {
			$('#ifr').removeAttr('src');
			$el.data('state', 'pause');
		} else {
			$('#ifr').attr('src', ifrSrc);
			$el.data('state', 'play');
		}
	});

});