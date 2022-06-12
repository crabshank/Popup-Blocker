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

function discardTab(id,push,op){
				chrome.tabs.discard(id, function(tab){
						if(!!tab && typeof tab !== 'undefined'){
							if(push){
								discarded.push([tab.id,getUrl(tab),op]);
								console.log('Tab '+tab.id+' discarded.');
							}
						}
					});
}

function replaceTabs(r,a){
	tb_links=tb_links.map((t)=>{return (t[0]==r)?[a,t[1]]:t;});
	to_discard=to_discard.map((t)=>{return (t[0]==r)?[a,...t.slice(1)]:t;});
	discarded=discarded.map((d)=>{return (d[0]==r)?[a,...d.slice(1)]:d;});
	url_chg_cnt=url_chg_cnt.map((t)=>{return (t[0]==r)?[a,...t.slice(1)]:t;});
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	replaceTabs(removedTabId,addedTabId);
});

chrome.tabs.onActivated.addListener(function(tab){
	let chk=to_discard.filter((t)=>{return t[0]==tab.tabId;});
	let d=discarded.filter((d)=>{return d[0]==tab.tabId;});
	if(d.length>0 && chk.length==0){
		chrome.tabs.get(tab.tabId, function(tab2){
				let op_tab_exist=(!!tab2.openerTabId && typeof tab2.openerTabId!=='undefined')?true:false;
				if(!tab2.discarded){
					discardTab(tab.tabId,false,(op_tab_exist)?tab2.openerTabId:null);
				}
		 });
	}
});

function url_upd(tab,tb_url){
			chrome.tabs.query({}, function(qtabs) {
			var dup_chk=-1;
			var op_ix=-1;
			var op_url='';

			var lks=tb_links.findIndex((t)=>{return t[0]==tab.openerTabId && t.slice(1)[0].includes(tb_url);});
			if(discarded.findIndex((d)=>{return d[1]==tb_url;})>=0){
				dup_chk=qtabs.findIndex((t)=>{return (t.id!=tab.id && getUrl(t)==tb_url);});
			}		
			op_ix=qtabs.findIndex((t)=>{return t.id==tab.openerTabId;});
			if(op_ix>=0){
				op_url=getUrl(qtabs[op_ix]);
			}
			var discardFlag=null;
			var op_tab_exist=(!!tab.openerTabId && typeof tab.openerTabId!=='undefined')?true:false;
			var cnt_chk=url_chg_cnt.findIndex((t)=>{return t[0]==tab.id;});
			var lk_ix=tb_links.findIndex((t)=>{return t[0]==tab.id;});
			if(cnt_chk>=0){
				let u_len=url_chg_cnt[cnt_chk][2].length;
				if(u_len>=10){ // keep last 10 URLs
					url_chg_cnt[cnt_chk][2]=url_chg_cnt[cnt_chk][2].slice(u_len-10+1);
				}			
				url_chg_cnt[cnt_chk][2].push(tb_url);
				
				
				if(url_chg_cnt[cnt_chk][1]==0){
					let isBl=blacklistMatch(blacklist,tb_url);
					let isWl=blacklistMatch(whitelist,tb_url);
					let isWl2=blacklistMatch(whitelist,op_url);
					let chr_tab=(tb_url.startsWith('chrome://') || tb_url.startsWith('chrome-extension://') ||  (tb_url.startsWith('about:') && tb_url!=='about:blank') )?true:false;
					if(!isWl[0] && !isWl2[0]){
						if(isBl[0] && !chr_tab){
							chrome.tabs.update(tab.id, {highlighted: false});
							if(op_tab_exist){
								chrome.tabs.update(tab.openerTabId, {highlighted: true});
							}
							chrome.tabs.remove(tab.id);
						}else{
							if (op_tab_exist){
											if(dup_chk>=0){ //Focus on duplicates
												chrome.tabs.update(tab.id, {highlighted: true});
												chrome.tabs.update(tab.openerTabId, {highlighted: false});
											}else{
												if(!chr_tab){
													var op_cnt_chk=url_chg_cnt.findIndex((t)=>{return t[0]==tab.openerTabId;});
													var in_op_hist=false;
													if(op_cnt_chk>=0){
														in_op_hist=(url_chg_cnt[op_cnt_chk][2].includes(tb_url))?true:false;
													}
													if(lks<0 && !in_op_hist){
														to_discard.push([tab.id,tb_url,tab.openerTabId]);
														discardFlag=to_discard.length;
														chrome.tabs.update(tab.openerTabId, {highlighted: true});
														chrome.tabs.update(tab.id, {highlighted: false})
													}
												}	
											}
									
							}
					}
				}
			}else{
				if(lk_ix>=0){
					tb_links[lk_ix][1]=[];
				}	
			}
			requestLinks(tab.id);
			url_chg_cnt[cnt_chk][1]+=1;
		}else{
			url_chg_cnt.push([tab.id,0,[tb_url]]);
		}
			if(!!discardFlag){
				to_discard=to_discard.filter((t)=>{return t[0]!=tab.id;});
				if(!tab.discarded){
					discardTab(tab.id,true,(op_tab_exist)?tab.openerTabId:null);
				}else{
					discarded.push([tab.id,getUrl(tab),(op_tab_exist)?tab.openerTabId:null]);
				}
			}else{
				requestLinks(tab.id);
			}
		
		});
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.url){
		url_upd(tab,changeInfo.url);
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
	url_chg_cnt.push([tab.id,0,[]]);
});

function windowProc(window){
	
		if (window.type==='popup'){
		chrome.tabs.query({windowId: window.id}, function(tabs) {
				let xmp=false;
				for (let t = 0; t < tabs.length; t++) {
					let t_url=getUrl(tabs[t]);
					let chr_tab=(t_url.startsWith('chrome://') || t_url.startsWith('chrome-extension://') || (t_url.startsWith('about:') && t_url!=='about:blank') )?true:false;
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
	if(request.type=="get_info"){
		sendResponse({info: sender});
	}else if(request.type=="links"){
		let tbl=tb_links.findIndex((t)=>{return t[0]==sender.tab.id;});
		if(tbl>=0){
			let urls=tb_links[tbl].slice(1)[0];
			tb_links[tbl][1]=Array.from(new Set([...urls,...request.links]));
		}else{
			tb_links.push([sender.tab.id, request.links]);
		}
		let op_tab_exist=(!!sender.tab.openerTabId && typeof sender.tab.openerTabId!=='undefined')?true:false;
		if(op_tab_exist){
			
			let tdsc_ix=to_discard.findIndex((d)=>{return (d[0]===sender.tab.id && d[1]===getUrl(sender.tab) && d[0]===sender.tab.openerTabId);});
			if(tdsc_ix>=0){
					to_discard=to_discard.filter((d,index)=>{return index!=dsc_ix});
			}
			
				let dsc_ix=discarded.findIndex((d)=>{return (d[0]===sender.tab.id && d[1]===getUrl(sender.tab) && d[0]===sender.tab.openerTabId);});
				if(dsc_ix>=0){
						discarded=discarded.filter((d,index)=>{return index!=dsc_ix});
				}
				
		}
		sendResponse({response: "Message received"});
	}else if(request.type=="nav"){
		url_upd(sender.tab,request.new_url);
		sendResponse({response: "Message received"});
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	handleMessage(request, sender, sendResponse);
});

chrome.windows.onCreated.addListener((window) => {
	windowProc(window);
});

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info)=>{
	if(info.request.tabId>=0){
		chrome.webNavigation.getFrame({
		tabId: info.request.tabId,
		frameId: info.request.frameId
		}, function (frameInfo){
			if(!!frameInfo){
				  chrome.tabs.sendMessage(info.request.tabId, {message: "nav", url:frameInfo.url, f_id: info.request.frameId});
			}
		});
	}

});

restore_options();

} catch (e) {
  console.error(e);
}