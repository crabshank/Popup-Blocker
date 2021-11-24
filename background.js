function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

try {
chrome.tabs.onCreated.addListener(function(tab) {
		chrome.scripting.executeScript({
		target: {tabId: tab.id, allFrames: true},
		files: ['content.js'],
		}, () => {
				if(typeof tab.openerTabId!=='undefined'){
					chrome.tabs.query({}, function(tabs) {

							chrome.tabs.sendMessage(tab.openerTabId, {
								type: "checkLinks",
								opnr: tab.openerTabId,
								chk: tab.id
							}, function(response) {});
					});	
				}	
		});
});

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
	if(request.type=="page"){
	chrome.windows.get(sender.tab.windowId,(window) => {
		windowProc(window)
	});
	}else if(request.type=="links"){
			chrome.tabs.query({}, function(tabs) {
				let tbs=tabs.filter((tb)=>{return tb.id==request.chk;});
				tbs.forEach((tb)=>{
					let tb_url=getUrl(tb);
					if(tb.active){
						if((request.links.includes(tb_url) || (tb_url.startsWith('chrome://')) || (tb_url.startsWith('chrome-extension://')))){
							chrome.tabs.update(request.opnr, {highlighted: false});
						}else{
							chrome.tabs.update(request.chk, {highlighted: false});
							chrome.tabs.update(request.opnr, {highlighted: true});
						}
					}else{
						if((request.links.includes(tb_url) || (tb_url.startsWith('chrome://')) || (tb_url.startsWith('chrome-extension://')))){
							chrome.tabs.update(request.opnr, {highlighted: false});
							chrome.tabs.update(request.chk, {highlighted: true});
						}
					}
				});
			});
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
 handleMessage(request, sender, sendResponse);
  return true;
});


chrome.windows.onCreated.addListener((window) => {
	windowProc(window);
});



} catch (e) {
  console.error(e);
}