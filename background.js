function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

try {
	
	
	
function suspendTab(id){
	var tb_ids=[];
	
				async function chk() {
					if(tb_ids.length>0){
								await new Promise(function(resolve, reject) {
									var count=0;
									for (let i=0; i<tb_ids.length; i++) {
												chrome.processes.getProcessIdForTab(tb_ids[i][0], function(pid){
													tb_ids[i][1]=pid;
													count++;
													if(count==tb_ids.length){
														resolve();
													}
												});
											}
									}).then((result) => {;}).catch((result) => {;});
				}
			}
	
	
	
	chrome.tabs.query({}, function(tabs) {
		for (let i=0; i<tabs.length; i++) {
			tb_ids.push([tabs[i].id,null]);
		}
		chk();
		
		let curr=tb_ids.filter((d)=>{return d[0]===id;});
		let lng=tb_ids.filter((d)=>{return d[1]===curr[0][1] && curr[0][1]!=null;});
		
			if(lng.length==1){
				chrome.processes.terminate(lng[1], function(didTerminate){
					if(didTerminate){
						console.log('Tab '+id+'\'s process terminated.');
					}else{
						console.log('Tab '+id+'\'s process failed to terminate.');
					}
				});	
			}else{
				console.log('Opened tab ('+id+') doesn\'t have a unique id, so no tab\'s process terminated.');
			}
		
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
								suspendTab(request.chk);
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