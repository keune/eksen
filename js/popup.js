let popup = {}

async function sendMessage(msg) {
  return await chrome.runtime.sendMessage(msg)
}

async function bindEvents() {
  popup.playBtn.addEventListener('click', async function() {
    let el = this
    let msg = {type: 'set'}
    if (el.className === 'yes') {
      el.className = ''
      msg.isPlaying = false
    } else {
      el.className = 'yes'
      msg.isPlaying = true
    }
    await sendMessage(msg)
  })

  const updateVolume = function() {
    let msg = {type: 'set', volume: +(this.value)}
    sendMessage(msg)
  }
  popup.volumeInp.addEventListener('change', updateVolume)
  popup.volumeInp.addEventListener('input', updateVolume)
}

function setNowPlaying(txt) {
  let fontSize = txt.length > 40 ? '11px' : '13px'

  popup.nowPlaying.innerText = txt
  popup.nowPlaying.title = txt
  popup.nowPlaying.style.fontSize = fontSize
}

document.addEventListener('DOMContentLoaded', async () => {
  let { isPlaying, volume } = await sendMessage({type: 'queryPlayer'})

  popup.playBtn = document.getElementById('btn-play')
  popup.volumeInp = document.getElementById('inp-volume')
  popup.nowPlaying = document.getElementById('now-playing')

  popup.playBtn.className = isPlaying ? 'yes' : ''

  if (volume) {
    popup.volumeInp.value = volume
  }
  await bindEvents()

  await (async function setNpText() {
    clearTimeout(popup.scheduledTxtUpdate)
    await sendMessage({type: 'queryNowPlaying'})
    const response = await chrome.storage.session.get(['isPlaying', 'nowPlaying'])
    if (response.nowPlaying && response.nowPlaying !== popup.nowPlaying.innerText) {
      setNowPlaying(response.nowPlaying)
    }
    if (typeof response.isPlaying !== 'undefined') {
      popup.playBtn.className = response.isPlaying ? 'yes' : ''
    }
    popup.scheduledTxtUpdate = setTimeout(setNpText, 4000)
  })()
})