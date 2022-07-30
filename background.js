function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

function isChrTab(tu) {
	return (tu.startsWith('chrome://') || tu.startsWith('chrome-extension://') ||  (tu.startsWith('about:') && !tu.startsWith('about:blank') ) )?true:false;
}



try {

var blacklist=[];
var whitelist=[];
var ac_tab={cu:null, op:null, ls:null};


function set__ac_tab(tab){
	ac_tab.ls=ac_tab.cu;
	ac_tab.cu=tab.id;
	ac_tab.op=(tab.openerTabId!==null && typeof tab.openerTabId!=='undefined')?tab.openerTabId:null;
}

async function setActiveTab(id){
	await new Promise(function(resolve, reject) {
		if(id===null || typeof id==='undefined'){
			chrome.tabs.query({active: true, currentWindow:true},(tabs)=>{ if (!chrome.runtime.lastError) {
				set__ac_tab(tabs[0]);
				resolve();
			}});
		}else{
			chrome.tabs.get(id, function(tab) { if (!chrome.runtime.lastError) {
								set__ac_tab(tab);
								resolve();
						}	
				});
		}
	});
}

setActiveTab();

var tbo=JSON.stringify({id:-1, op_id:-2, og_url:'',urls:[], op_url:'', disc:false});
var tbs=[];

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

function arr_match(a,b){
	let m=false;
	if(a.length>0 && b.length>0){
		for (let i = 0, len=b.length; i < len; i++){
			if(a.includes(b[i])){
				m=true;
				break;
			}
		}
	}
	return m;
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


function initialise(){
	chrome.tabs.query({}, function(tabs) { if (!chrome.runtime.lastError) {
		for (let t = 0; t < tabs.length; t++) {
				let tu=getUrl(tabs[t]);
				let chr_tab=isChrTab(tu);
				if(!!tu && typeof tu!=="undefined" && tu!=="" && !chr_tab){
					url_chk(tabs[t],tu);
				}
			}
		}});
}

async function tabs_remove(d){
	await new Promise(function(resolve, reject) {
			chrome.tabs.remove(d, ()=>{
				resolve();
			});
	});
}
async function tabs_update(d, obj){
	await new Promise(function(resolve, reject) {
			chrome.tabs.update(d, obj, (tab)=>{
				resolve();
			});
	});
}

async function tabs_discard(d){
	await new Promise(function(resolve, reject) {
				chrome.tabs.discard(d, function(tab){
						resolve();
				});
	});
}

function replaceTabs(r,a){
	let ix=tbs.findIndex((t)=>{return t.id===r;}); if(ix>=0){
		tbs[ix].id=a;
	}
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	replaceTabs(removedTabId,addedTabId);
});

function url_chk(tab,tb_url){
	let chr_tab=isChrTab(tb_url);
	
	
	let ix=tbs.findIndex((t)=>{return t.id===tab.id;}); if(ix>=0){ //if tab is in tbs array
		if(tbs[ix].urls[0]!==tb_url){ //if tab URL !== current/latest URL
			tbs[ix].urls.unshift(tb_url);
			tbs[ix].tb_links=[];
		}

	}else if(!chr_tab){ //if it's tab's 1st non-Chrome URL and not in tbs array
		let tb=JSON.parse(tbo);
		tb.id=tab.id;
		let op_exist=(tab.openerTabId!==null && typeof tab.openerTabId!=='undefined')?true:false;
		tb.op_id=(op_exist)?tab.openerTabId:tb.op_id;
		tb.og_url=tb_url;
		tb.urls.unshift(tb_url);
		
		if(op_exist){
			let ixp=tbs.findIndex((t)=>{return (t.id)===(tab.openerTabId);}); if(ixp>=0){
				tb.op_url=tbs[ixp].urls[0];
			}
		}
		
		tbs.push(tb);		
	}
}

chrome.windows.onCreated.addListener((window) => {
   windowProc(window);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
	setActiveTab(activeInfo.tabId);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
	tbs=tbs.filter((t)=>{return t.id!=tabId;});
});

async function windowProc(window){
	await new Promise(function(resolve, reject) {
		if (window.type==='popup'){
		chrome.tabs.query({windowId: window.id}, function(tabs) {
				let xmp=false;
				for (let t = 0; t < tabs.length; t++) {
					let t_url=getUrl(tabs[t]);
					let chr_tab=isChrTab(t_url);
					let isWl=blacklistMatch(whitelist,t_url);
					if(chr_tab || isWl[0]){
						xmp=true;
						break;
					}
			}
			if(!xmp){
				chrome.windows.remove(window.id,()=>{resolve();});
			}else{
				resolve();
			}
	});
	}else{
		resolve();
	}
	});
}

chrome.windows.onCreated.addListener((window) => {
	windowProc(window);
});

async function tabAdd(d,tu){
		await new Promise(function(resolve, reject) {
					chrome.tabs.get(d, function(tab) { if (!chrome.runtime.lastError) {
							url_chk(tab,tu);
							resolve();
					}	
			});
		});
}

async function rem_disc(b,d){
await new Promise(function(resolve, reject) {
	if(b){
		tabs_remove(d);	
	}else{
		tabs_discard(d);
	}
	resolve();
});
}

async function tabDiscrd(details,ix){
await new Promise(function(resolve, reject) {
	chrome.tabs.get(details.tabId, function(tab) { if (!chrome.runtime.lastError) {

					let isBl=blacklistMatch(blacklist,details.url);
					let isWl=blacklistMatch(whitelist,details.url);
					let op_exist=(tab.openerTabId!==null && typeof tab.openerTabId!=='undefined')?true:false; 
								 
			 if(!isWl[0]){
						if(op_exist){
								let isWl2=null;
									isWl2=blacklistMatch(whitelist,tbs[ix].op_url);
								if( isWl2[0]===false){
									tabs_update(tab.openerTabId,{highlighted: true});
									tabs_update(details.tabId,{highlighted: false});
									rem_disc(isBl[0],details.tabId);
								}
						}else{
							if(ac_tab.ls!==details.tabId){
								tabs_update(ac_tab.ls,{highlighted: true});
								tabs_update(details.tabId,{highlighted: false});
							}
								rem_disc(isBl[0],details.tabId);
					}
					
					
			}
			if(typeof tbs[ix]!=='undefined' && tbs[ix].id===details.tabId){
				tbs[ix].disc=true;
			}
			resolve();

}

}); 
});
}

chrome.webNavigation.onCommitted.addListener((details) => {
			
		let tq=arr_match(details.transitionQualifiers,["server_redirect"]);
		let tt=(["typed","auto_bookmark","manual_subframe","start_page","form_submit","reload","keyword","keyword_generated","generated"].includes(details.transitionType))?true:false;
		let du=details.url;
		let chr_tab=isChrTab(du);
		let ix=-1;
		let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;
		if(typeof details.tabId!=='undefined'){
				ix=tbs.findIndex((t)=>{return (t.id)===(details.tabId);});
		}
			
			 if( vu && ( ( ix>=0 && details.frameId===0) || (ix<0 && !chr_tab) ) ){
				 	tabAdd(details.tabId,du);
					
					ix=tbs.findIndex((t)=>{return (t.id)===(details.tabId);});
					if( ix>=0 && tbs[ix].disc===false && (tq || !tt) && !chr_tab && !du.startsWith('about:blank') && (ac_tab.cu!==ac_tab.op && details.tabId !==ac_tab.op) &&  (ac_tab.cu!==null &&  ac_tab.op!==null) ){
							tabDiscrd(details, ix);
					}
			 }

});


chrome.webNavigation.onCreatedNavigationTarget.addListener((details)=>{
	let du=details.url;
	let chr_tab=isChrTab(du);
	let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;

	let ix=-1;
	if(typeof details.tabId!=='undefined'){
			ix=tbs.findIndex((t)=>{return (t.id)===(details.tabId);});
	}
	
	 if( vu && (  ix>=0 || (ix<0 && !chr_tab) ) ){
		tabAdd(details.tabId,du);
	}

});


restore_options();

initialise();

} catch (e) {
  console.error(e);
}
