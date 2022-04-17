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

function requestLinks(id){
	chrome.tabs.sendMessage(id, {type:"checkLinks"});
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
var tb_links=[];
var url_chg_cnt=[];

function discardTab(id,push){
				chrome.tabs.discard(id, function(tab){
						if(push){
							discarded.push([tab.id,getUrl(tab)]);
							console.log('Tab '+tab.id+' discarded.');
						}
					});
}

function replaceTabs(r,a){
	tb_links=tb_links.map((t)=>{return (t[0]==r)?[a,t[1]]:t;});
	to_discard=to_discard.map((t)=>{return (t[0]==r)?[a,...t.slice(1)]:t;});
	discarded=discarded.map((d)=>{return (d[0]==r)?[a,...d.slice(1)]:d;});
	url_chg_cnt=url_chg_cnt.map((t)=>{return (t[0]==r)?[a,t[1]]:t;});
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	replaceTabs(removedTabId,addedTabId);
});

chrome.tabs.onActivated.addListener(function(tab){
	let chk=to_discard.filter((t)=>{return t[0]==tab.tabId;});
	let d=discarded.filter((d)=>{return d[0]==tab.tabId;});
	if(d.length>0 && chk.length==0){
		discardTab(tab.tabId,false);
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.url){
		chrome.tabs.query({}, function(qtabs) {
			var tb_url=changeInfo.url;
			var dup_chk=[];
			var lks=tb_links.filter((t)=>{return t[0]==tab.openerTabId && t.slice(1)[0].includes(tb_url);});
			if(discarded.filter((d)=>{return d[1]==tb_url;}).length==0){
				dup_chk=qtabs.filter((t)=>{return (t.id!=tab.id && getUrl(t)==tb_url);});
			}
			
			var discardFlag=null;
			var op_tab_exist=(!!tab.openerTabId && typeof tab.openerTabId!=='undefined')?true:false;
			let cnt_chk=url_chg_cnt.filter((t)=>{return t[0]==tab.id;});
			if(cnt_chk.length>0){
				let isBl=blacklistMatch(blacklist,tb_url);
				let chr_tab=(tb_url.startsWith('chrome://') || tb_url.startsWith('chrome-extension://') || tb_url.startsWith('about:'))?true:false;
				if(isBl[0] && !chr_tab){
					chrome.tabs.update(tab.id, {highlighted: false});
					if(op_tab_exist){
						chrome.tabs.update(tab.openerTabId, {highlighted: true});
					}
					chrome.tabs.remove(tab.id);
				}else{
					if (op_tab_exist){
									if(dup_chk.length>0){ //Focus on duplicates
										chrome.tabs.update(tab.id, {highlighted: true});
										chrome.tabs.update(tab.openerTabId, {highlighted: false});
									}else{
										if(!chr_tab){
											if(lks.length==0){
												to_discard.push([tab.id,tb_url]);
												discardFlag=to_discard.length;
												chrome.tabs.update(tab.openerTabId, {highlighted: true});
												chrome.tabs.update(tab.id, {highlighted: false})
											}
										}	
									}
							
					}
			}
			requestLinks(tab.id);
			url_chg_cnt=url_chg_cnt.filter((t)=>{return t[0]!=tab.id;});
		}
			if(!!discardFlag){
				discardTab(tab.id,true);
				to_discard=to_discard.filter((t)=>{return t[0]!=tab.id;});
			}else{
				requestLinks(tab.id);
			}
		
		});
	}else if(changeInfo.status!=='unloaded'){
		discarded=discarded.filter((d)=>{return d[0]!=tab.id;});
	}
	
	if(changeInfo.status==='complete'){
		requestLinks(tab.id);
	}
});

chrome.windows.onCreated.addListener((window) => {
   windowProc(window);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
	tb_links=tb_links.filter((t)=>{return t[0]!=tabId;});
	to_discard=to_discard.filter((t)=>{return t[0]!=tabId;});
	discarded=discarded.filter((d)=>{return d[0]!=tabId;});
	url_chg_cnt=url_chg_cnt.filter((t)=>{return t[0]!=tabId;});
});
	
chrome.tabs.onCreated.addListener(function(tab) {
	url_chg_cnt.push([tab.id,0]);
});

function windowProc(window){
	
		if (window.type==='popup'){
		chrome.tabs.query({windowId: window.id}, function(tabs) {
				let xmp=false;
				for (let t = 0; t < tabs.length; t++) {
					let t_url=getUrl(tabs[t]);
					let chr_tab=(t_url.startsWith('chrome://') || t_url.startsWith('chrome-extension://') || t_url.startsWith('about:'))?true:false;
					let isWl=blacklistMatch(whitelist,t_url);
					if(chr_tab || isWl[0]){
						xmp=true;
						break;
					}
			}
			if(!xmp){
			chrome.windows.remove(window.id);
			}else{
				for (let t = 0; t < tabs.length; t++) {
					requestLinks(tabs[t].id);
				}
			}
	});
	}
	
}

function handleMessage(request, sender, sendResponse) {
	if(request.type=="links"){
		let tbl=tb_links.findIndex((t)=>{return t[0]==sender.tab.id;});
		if(tbl>=0){
			let urls=tb_links[tbl].slice(1)[0];
			tb_links[tbl][1]=Array.from(new Set([...urls,...request.links]));
		}else{
			tb_links.push([sender.tab.id, request.links]);
		}
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