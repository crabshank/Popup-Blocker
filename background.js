try{
var lifeline;

keepAlive();

chrome.runtime.onConnect.addListener((port)=> {
  if (port.name === 'keepAlive') {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3); // 5 minutes minus 5 seconds	
    port.onDisconnect.addListener(keepAliveForced);
  }
});

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
	await new Promise((resolve, reject)=>{
	
 if (!!lifeline){
	 resolve();
 }else{
 var count=0;
 		chrome.tabs.query({}, function(tabs) {
						   if (!chrome.runtime.lastError) {
			for (let i = 0; i < tabs.length; i++) {
				if(!tabs[i].url.startsWith('chrome://') && !tabs[i].url.startsWith('chrome-extension://')){
												chrome.scripting.executeScript({
								  target: {tabId: tabs[i].id},
								  files: ['port_connect.js'],
								}, () => {});
								count++;
								break;
				}
			}
		}
		});
 
if(count>0){
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
	  chrome.tabs.onReplaced.addListener(retryOnTabUpdate2);
	  chrome.tabs.onRemoved.addListener(retryOnTabUpdate3);
	  resolve();
}else{
	reject();
}
}
}).then((response) => {;}).catch((e) => {;});

}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url) {
    keepAlive();
  }
}
async function retryOnTabUpdate2(addedTabId, removedTabId) {
    keepAlive();
}
async function retryOnTabUpdate3(tabId, removeInfo) {
    keepAlive();
}
	/*Source: https://stackoverflow.com/a/66618269 - wOxxOm*/
	
}catch(e){;}

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