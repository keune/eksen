var keuneksen = {
    isPlaying: 'no',
    elCss: '#player',
    startupVolume: 70,
    nowPlaying: {
        url: 'http://radioeksen.com/umbraco/surface/Player/EksenPlayerSong',
        defaultMessages: ['RADYO EKSEN -', 'REKLAM', 'REKLAM-REKLAM'],
        interval: 4000
    },
    stream: {
        title: "Radyo Eksen",
        m4a: "http://eksenwmp.radyotvonline.com:80/;"
    }
};

chrome.browserAction.setIcon({path: '../icon.png'});

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
                $el.jPlayer('setMedia', keuneksen.stream).jPlayer('play');
            }
        },
        swfPath: "js/lib/",
        supplied: "m4a",
        preload: "none",
        wmode: "window"
    });
});

function capitalizeFirst(str) {
    return str.replace(/\b-\b/g, ' - ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

chrome.extension.onMessage.addListener(function(msg, _, sendResponse) {
    var data = localStorage.getItem('keuneksen');
    if (data) {
        data = JSON.parse(data);
    } else {
        data = {
            volume: keuneksen.startupVolume
        };
    }
    if (msg.type === 'set') {
        if (msg.volume) {
            keuneksen.el.jPlayer('volume', (msg.volume / 100));
            data.volume = msg.volume;
        } else {
            var startupVolume = keuneksen.startupVolume;
            if(data.volume) {
                startupVolume = data.volume;
            }
            keuneksen.el.jPlayer('volume', (startupVolume / 100));
        }
        if (msg.isPlaying) {
            if (msg.isPlaying === 'yes') {
                keuneksen.el.jPlayer('play');
                keuneksen.isPlaying = 'yes';
                keuneksen.setTexts();
                chrome.browserAction.setIcon({path: '../icon-play.png'});
            } else {
                keuneksen.el.jPlayer('stop');
                keuneksen.isPlaying = 'no';
                chrome.browserAction.setIcon({path: '../icon.png'});
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

(function setTexts() {
    clearTimeout(keuneksen.scheduledExecution);
    $.ajax(keuneksen.nowPlaying.url, {
        timeout: keuneksen.nowPlaying.interval,
        dataType: 'json',
        success: function(response) {
            if(response && response.NowPlayingArtist && response.NowPlayingTrack && response.NowPlayingArtist !== 'Radio Eksen') {
                var artist = response.NowPlayingArtist;
                artist = capitalizeFirst(artist.trim());
                var track = response.NowPlayingTrack;
                track = capitalizeFirst(track.trim());
                var txt = artist + ' - ' + track;

                if (chrome.extension.getViews({type: 'popup'}).length) {
                    chrome.extension.sendMessage({nowPlaying: txt}, function() {});
                }
                chrome.browserAction.getTitle({}, function(currentTitle) {
                    if (currentTitle !== txt) {
                        chrome.browserAction.setTitle({title: txt});
                    }
                });
            }
        },
        error: function() {
            chrome.browserAction.setTitle({title: ''});
        }
    });
    
    keuneksen.setTexts = setTexts;
    keuneksen.scheduledExecution = setTimeout(setTexts, keuneksen.nowPlaying.interval);
})();
