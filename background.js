function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

try {
	
function suspendTab(ids){
	//ids={r: opene_r_, d: opene_d_}
	
	var pds={};
	chrome.processes.getProcessIdForTab(ids.d, function(pid1){
		pds.d=pid1;
		chrome.processes.getProcessIdForTab(ids.r, function(pid2){
			pds.r=pid2;
			
			if(pds.d != pds.r){
				chrome.processes.terminate(pds.d, function(didTerminate){
					if(didTerminate){
						console.log('Tab '+ids.d+'\'s process terminated');
					}else{
						console.log('Tab '+ids.d+'\'s process failed to terminate');
					}
				});	
			}else{
				console.log('Opener and opened tabs ('+ids.r+' and '+ids.d+') have the same process id, so no tab\'s process terminated');
			}
			
		});
	});
}
	
chrome.tabs.onCreated.addListener(function(tab) {
		chrome.scripting.executeScript({
		target: {tabId: tab.id, allFrames: true},
		files: ['content.js'],
		}, () => {
				if(typeof tab.openerTabId!=='undefined'){
						let tbact=tab.active;
					chrome.tabs.query({}, function(tabs) {
							chrome.tabs.sendMessage(tab.openerTabId, {
								type: "checkLinks",
								opnr: tab.openerTabId,
								chk: tab.id
							}, function(response) {});
					});	
					if(tbact){
						chrome.tabs.update(tab.openerTabId, {highlighted: false});
						chrome.tabs.update(tab.id, {highlighted: true});
					}else{
						chrome.tabs.update(tab.id, {highlighted: false});
						chrome.tabs.update(tab.openerTabId, {highlighted: true});
					}
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
								suspendTab({d: request.chk, r:request.opnr});
								chrome.tabs.update(request.chk, {highlighted: false});
								chrome.tabs.update(request.opnr, {highlighted: true});
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