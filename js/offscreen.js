const streamUrl = 'http://eksenwmp.radyotvonline.com:80/;'
let audioElement
let mediaSessionSupported = false
let totalPlaybackError = 0

function sendPlayUpdate(isPlaying) {
  chrome.runtime.sendMessage({type: 'set', isPlaying: isPlaying}, (response) => console.log(response))
}

if ('mediaSession' in navigator) {
  mediaSessionSupported = true
  navigator.mediaSession.metadata = new MediaMetadata({title: 'Radyo Eksen', artist: 'Keune', artwork: [{src: 'https://ahmetkun.com/images/eksen.png', type: 'image/png'}]})
  navigator.mediaSession.setActionHandler('play', () => {
    audioElement?.play()
    sendPlayUpdate(true)
  })
  navigator.mediaSession.setActionHandler('pause', () => {
    audioElement?.pause()
    sendPlayUpdate(false)
  })
}

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (!audioElement) {
      audioElement = new Audio(streamUrl)
      audioElement.addEventListener('abort', () => {
        sendPlayUpdate(false)
      })
      audioElement.addEventListener('error', () => {
        sendPlayUpdate(false)
      })
      audioElement.addEventListener('stalled', () => {
        sendPlayUpdate(false)
      })
    }
    if (msg.action === 'play') {
      audioElement.play()
    }
    if (msg.action === 'pause') {
      audioElement.pause()
    }
    if (msg.action === 'volume') {
      audioElement.volume = msg.volume / 100
    }

    if (msg.action === 'setMeta' && mediaSessionSupported) {
      if (msg.meta) {
        navigator.mediaSession.metadata = new MediaMetadata(msg.meta)
      }
    }
  })
})