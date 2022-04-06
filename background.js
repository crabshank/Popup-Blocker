function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

try {

var blacklist=[];
var whitelist=[];

function removeEls(d, array){
	var newArray = [];
	for (let i = 0; i < array.length; i++)
	{
		if (array[i] != d)
		{
			newArray.push(array[i]);
		}
	}
	return newArray;
}

function findIndexTotalInsens(string, substring, index) {
    string = string.toLocaleLowerCase();
    substring = substring.toLocaleLowerCase();
    for (let i = 0; i < string.length ; i++) {
        if ((string.includes(substring, i)) && (!(string.includes(substring, i + 1)))) {
            index.push(i);
            break;
        }
    }
    return index;
}

function blacklistMatch(array, t) {
    var found = false;
	var blSite='';
    if (!((array.length == 1 && array[0] == "") || (array.length == 0))) {
        ts = t.toLocaleLowerCase();
        for (var i = 0; i < array.length; i++) {
            let spl = array[i].split('*');
            spl = removeEls("", spl);

            var spl_mt = [];
            for (let k = 0; k < spl.length; k++) {
                var spl_m = [];
                findIndexTotalInsens(ts, spl[k], spl_m);

                spl_mt.push(spl_m);


            }

            found = true;

            if ((spl_mt.length == 1) && (typeof spl_mt[0][0] === "undefined")) {
                found = false;
            } else if (!((spl_mt.length == 1) && (typeof spl_mt[0][0] !== "undefined"))) {

                for (let m = 0; m < spl_mt.length - 1; m++) {

                    if ((typeof spl_mt[m][0] === "undefined") || (typeof spl_mt[m + 1][0] === "undefined")) {
                        found = false;
                        m = spl_mt.length - 2; //EARLY TERMINATE
                    } else if (!(spl_mt[m + 1][0] > spl_mt[m][0])) {
                        found = false;
                    }
                }

            }
            blSite = (found) ? array[i] : blSite;
            i = (found) ? array.length - 1 : i;
        }
    }
    //console.log(found);
    return [found,blSite];

}

function restore_options()
{
	if(typeof chrome.storage==='undefined'){
		restore_options();
	}else{
	chrome.storage.sync.get(null, function(items){
		
		if (Object.keys(items).length != 0)
		{

		if(!!items.bList && typeof  items.bList!=='undefined'){
			blacklist=items.bList.split('\n').join('').split(',');
		}		
		
		if(!!items.wList && typeof  items.wList!=='undefined'){
			whitelist=items.wList.split('\n').join('').split(',');
		}
		
		}else{
			save_options();
			restore_options();
		}
	});
	}
}

function save_options()
{
		chrome.storage.sync.clear(function() {
				chrome.storage.sync.set(
				{
					bList: "",
					wList: ""
				}, function(){
					console.log('Default options saved.');
					restore_options();
				});
		});

}

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
				let t_url=getUrl(tabs[t]);
				let isWl=blacklistMatch(whitelist,t_url);
				if(t_url.startsWith('chrome-extension://') || isWl[0]){
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
										
				var isBl=blacklistMatch(blacklist,tb_url);
						if(isBl[0]){						
							chrome.tabs.remove(
								request.chk,
								 function(){
									 chrome.tabs.update(request.opnr, {highlighted: true});
							});
						}else{
							to_discard.push([request.chk,tb_url]);
							chrome.tabs.update(request.chk, {highlighted: false});
							chrome.tabs.update(request.opnr, {highlighted: true});
						}
							
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

restore_options();

} catch (e) {
  console.error(e);
}