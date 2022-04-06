function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

try {
	
var to_discard=[];
var discarded=[];
	
function discardTab(id,push){
				chrome.tabs.discard(id, function(tab){
						if(push){
							discarded.push(tab.id);
							console.log('Tab '+tab.id+' discarded.');
						}
					});
}

function replaceTabs(r,a){
	to_discard=to_discard.map((t)=>{return (t[0]==r)?[a,...t.slice(1)]:t;});
	discarded=discarded.map((d)=>{return (d==r)?a:d;});
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	replaceTabs(removedTabId,addedTabId);
});

chrome.tabs.onActivated.addListener(function(tab){
	let d=discarded.filter((d)=>{return d==tab.tabId;});
	let chk=to_discard.filter((t)=>{return t[0]==tab.tabId;});
	if(d.length>0 && chk.length==0){
		discardTab(tab.tabId,false);
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.status!=='unloaded'){
		discarded=discarded.filter((d)=>{return d!=tab.id;});
	}
});

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

function handleDiscard(id,url){
	let chk=to_discard.filter((t)=>{return t[0]==id && t[1]==url;});
	if(chk.length>0){
		discardTab(id,true);
	}
	to_discard=to_discard.filter((t)=>{return !(t[0]==id && t[1]==url);});
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, changedTab) {
	handleDiscard(tabId,changeInfo.url);
});

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
							to_discard.push([request.chk,tb_url]);
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