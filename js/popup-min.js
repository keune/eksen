var popup={bg:chrome.extension.getBackgroundPage()};$(function(){popup.$playBtn=$("#btn-play");popup.$volumeInp=$("#inp-volume");popup.$nowPlaying=$("#now-playing");popup.bg.keuneksen.isPlaying&&popup.$playBtn.attr("class",popup.bg.keuneksen.isPlaying);sendMessage({type:"query"},function(a){a.volume&&popup.$volumeInp.val(a.volume)});bindEvents()});function sendMessage(a,b){chrome.extension.sendMessage(a,function(a){b&&b(a)})}
function bindEvents(){popup.$playBtn.click(function(){var a=$(this),b={type:"set"};"yes"===popup.bg.keuneksen.isPlaying?(a.attr("class",""),b.isPlaying="no"):(a.attr("class","yes"),b.isPlaying="yes");sendMessage(b)});popup.$volumeInp.change(function(){var a={type:"set",volume:$(this).val()};sendMessage(a)})}function setNowPlaying(a){var b;b=40<a.length?"11px":"13px";popup.$nowPlaying.text(a).attr("title",a).css("font-size",b)}chrome.extension.onMessage.addListener(function(a){a.nowPlaying&&setNowPlaying(a.nowPlaying)});