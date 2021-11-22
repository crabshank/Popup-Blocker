try{
chrome.runtime.sendMessage({msg:window.location.href}, function(response){});
}catch(e){;}