try {
function getUrl(tab){
	return (tab.url=="" && !!tab.pendingUrl && typeof tab.pendingUrl!=='undefined' && tab.pendingUrl!='')?tab.pendingUrl:tab.url;
}

function windowProc(window){
		if (window.type==='popup'){
		chrome.tabs.query({windowId: window.id}, function(tabs) {
			let xmp=false;
			for (let t = 0; t < tabs.length; t++) {
			if(getUrl(tabs[t]).startsWith('chrome-extension://')){
				xmp=true;
				break;
			}
		}
			if(!xmp){
			chrome.windows.remove(window.id);
			}
			});
	}
}

function handleMessage(request, sender, sendResponse) {
	chrome.windows.get(sender.tab.windowId,(window) => {
		windowProc(window)
	});
}

chrome.runtime.onMessage.addListener(handleMessage);


chrome.windows.onCreated.addListener((window) => {
	windowProc(window);
});



} catch (e) {
  console.error(e);
}