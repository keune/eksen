let offscreenDoc = null
let audioPort = null

let player = {
  startupVolume: 70,
  nowPlaying: {
    url: 'https://radioeksen.com/umbraco/surface/Player/EksenPlayerSong',
    interval: 4000
  }
}

function capitalizeFirst(str) {
  return str.replace(/\b-\b/g, ' - ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();})
}

function updateSS(data, cb = null) {
  chrome.storage.session.set(data, cb)
}

function updateLS(data, cb = null) {
  chrome.storage.local.set(data, cb)
}

async function setupOffscreen() {
  const path = 'offscreen.html'
  const offscreenUrl = chrome.runtime.getURL(path)
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  })

  if (existingContexts.length > 0) {
    return
  }

  if (offscreenDoc) {
    await offscreenDoc
  } else {
    offscreenDoc = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Audio playback',
    })
    await offscreenDoc
    offscreenDoc = null
  }
}

function setupAudioPort() {
  if (!audioPort) {
    audioPort = chrome.runtime.connect({ name: 'audio' })
    audioPort.onDisconnect.addListener(() => {
      audioPort = null
    })
  }
}

async function getNowPlaying() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), player.nowPlaying.interval)

  let result = {
    title: '',
    artist: '',
    joined: ''
  }
  try {
    const response = await fetch(player.nowPlaying.url, {
      method: 'GET',
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    const data = await response.json()

    if (data && data.NowPlayingArtist && data.NowPlayingArtist !== 'Radio Eksen') {
      var artist = data.NowPlayingArtist
      var track = data.NowPlayingTrack
      if (!track && artist.indexOf(' - ') > -1) {
        var artistAndTrack = artist.split(' - ')
        artist = artistAndTrack[0]
        track = artistAndTrack[1]
      }
      result.artist = capitalizeFirst(artist.trim())
      result.track = capitalizeFirst(track.trim())
      result.joined = [result.artist, result.track].filter(el => el).join(' - ')
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('error (timeout)')
    } else {
      console.log('error', error)
    }
  }

  return result
}

function getAndSetNowPlaying() {
  getNowPlaying().then(data => {
    chrome.action.getTitle({}, function(currentTitle) {
      if (currentTitle !== data.joined) {
        chrome.action.setTitle({title: data.joined})
        updateSS({nowPlaying: data.joined})

        setupOffscreen().then(() => {
          setupAudioPort()
          audioPort.postMessage({
            action: 'setMeta',
            meta: {
              title: data.track, artist: data.artist, album: 'Radyo Eksen',
              artwork: [
                {src: 'https://ahmetkun.com/images/eksen.png', type: 'image/png'}
              ]
            }
          })
        })
      }
    })
  })
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'set') {
    if (typeof msg.volume !== 'undefined') {
      audioPort.postMessage({ action: 'volume', volume: msg.volume})
      updateLS({volume: msg.volume})
    }
    if (typeof msg.isPlaying !== 'undefined') {
      if (msg.isPlaying === true) {
        setupOffscreen().then(() => {
          setupAudioPort()
          audioPort.postMessage({ action: 'play'})
          chrome.action.setIcon({path: '../icon-play.png'})
        })
      } else {
        audioPort?.postMessage({ action: 'pause' })
        chrome.action.setIcon({path: '../icon.png'})
      }
      updateSS({isPlaying: msg.isPlaying})
    }

    sendResponse('ok')
  } else if (msg.type === 'queryPlayer') {
    let isPlaying = false, volume = player.startupVolume
    chrome.storage.session.get('isPlaying', (ssRes) => {
      if (typeof ssRes.isPlaying !== 'undefined') isPlaying = ssRes.isPlaying
      chrome.storage.local.get('volume', (lsRes) => {
        if (typeof lsRes.volume !== 'undefined') volume = lsRes.volume
        sendResponse({isPlaying: isPlaying, volume: volume})
      })
    })
  } else if (msg.type === 'queryNowPlaying') {
    getAndSetNowPlaying()
    sendResponse('ok')
  }

  return true
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateNowPlaying') {
    getAndSetNowPlaying()
  }
})

chrome.alarms.create('updateNowPlaying', { periodInMinutes: 0.5 })
