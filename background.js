function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

function isChrTab(tu) {
	return ( (tu.startsWith('chrome://') && tu!=='chrome://newtab/') || tu.startsWith('chrome-extension://') ||  (tu.startsWith('about:') && !tu.startsWith('about:blank') ) )?true:false;
}

var f_queue=[]; 
var prg=false;

try {

var blacklist=[];
var whitelist=[];
var ac_tab={cu:null, op:null, ls:null, ls2:null};

function set__ac_tab(tab){
	ac_tab.ls2=ac_tab.ls;
	ac_tab.ls=ac_tab.cu;
	ac_tab.cu=tab.id;
	ac_tab.op=(tab.openerTabId!==null && typeof tab.openerTabId!=='undefined')?tab.openerTabId:null;
}

async function setActiveTab(id){
	return new Promise(function(resolve) {
		if(id===null || typeof id==='undefined'){
			chrome.tabs.query({active: true, currentWindow:true},(tabs)=>{ if (!chrome.runtime.lastError) {
				set__ac_tab(tabs[0]);
				resolve();
			}});
		}else{
			chrome.tabs.get(id, function(tab) { if (!chrome.runtime.lastError) {
								set__ac_tab(tab);
								let ix=tbs.findIndex((t)=>{return t.id===id;}); if(ix>=0){
									if(tbs[ix].disc===4){
										tbs[ix].disc=5;
									}
								}
								resolve();
						}	
				});
		}
	});
}

(async ()=>{ await setActiveTab(); })();

var tbo=JSON.stringify({id:-1, op_id:-2, og_url:'',urls:[], op_url:'', disc:3});
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

/*function arr_match(a,b,strict){
	let m=false;
	if(a.length>0 && b.length>0){
		for (let i = 0, len=b.length; i < len; i++){
			if(a.includes(b[i])   && ( (strict===true && a.length===1) || (strict===false) )  ){
				m=true;
				break;
			}
		}
	}
	return m;
}*/

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
					url_chk(tabs[t],tu,true);
				}
			}
		}});
}

async function tabs_remove(d){
	return new Promise(function(resolve) {
			chrome.tabs.remove(d, ()=>{
				resolve();
			});
	});
}

async function tabs_update(d, obj){
	return new Promise(function(resolve) {
			chrome.tabs.update(d, obj, (tab)=>{
				resolve();
			});
	});
}

async function tabs_discard(d){
	return new Promise(function(resolve) {
				chrome.tabs.discard(d, function(tab){
						resolve();
				});
	});
}

function replaceTabs(r,a){
	ac_tab.ls=(ac_tab.ls===r)?a:ac_tab.ls;
	ac_tab.cu=(ac_tab.cu===r)?a:ac_tab.cu;
	ac_tab.op=(ac_tab.op===r)?a:ac_tab.op;
	ac_tab.ls2=(ac_tab.ls2===r)?a:ac_tab.ls2;
	for(let i=tbs.length-1; i>=0; i--){
		let tb=tbs[i];
		
		if(tb.id===r){
			tb.id=a;
		}
		if(tb.op_id===r){
			tb.op_id=a;
		}
	}
		
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	fq_loop(()=>{ replaceTabs(removedTabId,addedTabId); });
});

function url_chk(tab,tb_url,force_null){
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
		tb.op_id=(op_exist && tb_url!=='chrome://newtab/')?tab.openerTabId:tb.op_id;
		tb.disc=(force_null)?2:0;
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
    fq_loop(()=>{ windowProc(window); });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
	fq_loop(()=>{ setActiveTab(activeInfo.tabId); });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
	tbs=tbs.filter((t)=>{return t.id!==tabId;});
});

async function windowProc(window){
	return new Promise(function(resolve) {
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
	fq_loop(()=>{ windowProc(window); });
});

async function tabAdd(d,tu,pass_det){
		return new Promise(function(resolve) {
					chrome.tabs.get(d, function(tab) { if (!chrome.runtime.lastError) {
							url_chk(tab,tu,false);
							if(typeof pass_det!=='undefined'){
								wnoc(pass_det);
							}
							resolve();
					}	
			});
		});
}

async function rem_disc(b,d,n){
return new Promise(function(resolve) {
	if(b){	
		(async ()=>{ await tabs_remove(d); })();
	}else if(!n){
		(async ()=>{ await tabs_discard(d); })();
	}
	resolve();
});
}

async function tabDiscrd(details,ix,noDiscard){
return new Promise(function(resolve) {
	chrome.tabs.get(details.tabId, function(tab) { if (!chrome.runtime.lastError) {

					let isBl=blacklistMatch(blacklist,details.url);
					let isWl=blacklistMatch(whitelist,details.url);
					let op_exist=(tab.openerTabId!==null && typeof tab.openerTabId!=='undefined')?true:false; 
								 
			 if(!isWl[0]){
						if(op_exist){
								let isWl2=null;
									isWl2=blacklistMatch(whitelist,tbs[ix].op_url);
								if( isWl2[0]===false && ac_tab.cu!==tab.openerTabId){
									
									
									(async ()=>{ 
										await tabs_update(tab.openerTabId,{highlighted: true});
										await tabs_update(details.tabId,{highlighted: false});
										await rem_disc(isBl[0],details.tabId,noDiscard);
									})();
									
								}
						}else if(ac_tab.cu!==ac_tab.ls){
							if(ac_tab.ls!==details.tabId){
								(async ()=>{ await tabs_update(ac_tab.ls,{highlighted: true}); })();
							}
							
							(async ()=>{ 
								await tabs_update(details.tabId,{highlighted: false});
								await rem_disc(isBl[0],details.tabId,noDiscard); 
							})();
								
					}
					
					
			}
			if(!noDiscard){
				tbs[ix].disc=4;
			}
			resolve();

}

}); 
});
}

function printDebug(s,a,d,c){
	console.groupCollapsed(s);
	console.log(JSON.stringify(a));
	console.log(JSON.stringify(d));
	console.log(JSON.stringify(c));
	console.groupEnd();
}

function wnoc(dtails){
		let details=dtails.details;
		let du=dtails.du;
		let chr_tab=dtails.chr_tab;
		let ix=-1;
		let vu=dtails.vu;
	//let tq=arr_match(details.transitionQualifiers,["server_redirect"],true);
	let tt=(["typed","auto_bookmark","manual_subframe","start_page","reload","keyword"].includes(details.transitionType))?true:false;
	let tt2=(["form_submit","keyword_generated","generated"].includes(details.transitionType))?true:false;

	ix=tbs.findIndex((t)=>{return (t.id)===(details.tabId);});
	if( ix>=0){
		if( 	(tbs[ix].disc===0 || tbs[ix].disc===3|| tbs[ix].disc===4 ) && // if all true, discard!
				!tt && 
				!tbs[ix].og_url.startsWith('about:') &&
				!du.startsWith('about:blank') &&
				tbs[ix].op_id!==-2 &&
					( 	(tbs[ix].og_url !== tbs[ix].op_url && tbs[ix].urls[0] === tbs[ix].og_url) ||
						(tbs[ix].og_url === tbs[ix].op_url && tbs[ix].urls[0] !== tbs[ix].og_url) ||
						(ac_tab.cu === details.tabId && ac_tab.cu!==tbs[ix].op_id) ||
						(ac_tab.cu === ac_tab.ls) )
			){

			chrome.tabs.get(details.tabId, function(tab) { if (!chrome.runtime.lastError) {
						chrome.windows.get(tab.windowId, {populate: true},function(window){  if (!chrome.runtime.lastError) {
							if(typeof window.tabs==='undefined' || window.tabs.length>1){
								tbs[ix].disc=(tt2)?0:1;							
								(async ()=>{ await tabDiscrd(details, ix,((tt2)?true:false)); })();
								printDebug('DISCARDED/REMOVED: '+du,tbs[ix],details,ac_tab);			
							}
						}else{
							tbs[ix].disc=(tt2)?0:1;
							(async ()=>{ await tabDiscrd(details, ix,((tt2)?true:false)); })();
							printDebug('DISCARDED/REMOVED: '+du,tbs[ix],details,ac_tab);
						}});	
			}});
		}else{
			printDebug('NOT DISCARDED/REMOVED: '+du,tbs[ix],details,ac_tab);		
		}
	}else{
			printDebug('NOT DISCARDED/REMOVED: '+du,'Not in tabs array!',details,ac_tab);	
	}
}

async function wnoc0(details){
		let du=details.url;
		let chr_tab=isChrTab(du);
		let ix=-1;
		let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;
		if(typeof details.tabId!=='undefined'){
				ix=tbs.findIndex((t)=>{return (t.id)===(details.tabId);});
		}
			
		 if( vu && ( ( ix>=0 && details.frameId===0) || (ix<0 && !chr_tab) ) ){
				await tabAdd(details.tabId,du,{details: details, du:du, chr_tab:chr_tab, vu:vu});
		 }
}

chrome.webNavigation.onCommitted.addListener((details) => {
			fq_loop(()=>{ wnoc0(details); });
});

async function wnocr(details){
	let du=details.url;
	let chr_tab=isChrTab(du);
	let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;

	let ix=-1;
	if(typeof details.tabId!=='undefined'){
			ix=tbs.findIndex((t)=>{return (t.id)===(details.tabId);});
	}
	
	 if( vu && (  ix>=0 || (ix<0 && !chr_tab) ) ){
		await tabAdd(details.tabId,du);
	}
}

chrome.webNavigation.onCreatedNavigationTarget.addListener((details)=>{	
	fq_loop(()=>{ wnocr(details); });
});

async function onTabUpdated(tabId, changeInfo, tab) {
	if(changeInfo.url){
			let du=changeInfo.url;
			let chr_tab=isChrTab(du);
			let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;

			let ix=-1;
			if(typeof tabId!=='undefined'){
				ix=tbs.findIndex((t)=>{return (t.id)===(tabId);});
			}

			if( vu && (  ix>=0 || (ix<0 && !chr_tab) ) ){
				await tabAdd(tabId,du);
			}
	}
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	fq_loop(()=>{ onTabUpdated(tabId, changeInfo, tab); });
});


async function onTabCreated(tab) {
			let du=getUrl(tab);
			let chr_tab=isChrTab(du);
			let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;

			let ix=-1;
			if(typeof tab.id!=='undefined'){
				ix=tbs.findIndex((t)=>{return (t.id)===(tab.id);});
			}

			if( vu && (  ix>=0 || (ix<0 && !chr_tab) ) ){
				await tabAdd(tab.id,du);
			}
}

chrome.tabs.onCreated.addListener((tab)=>{
	fq_loop(()=>{ onTabCreated(tab); });
});

restore_options();

initialise();

async function fq_loop(f){
	f_queue.push(f);
	if(prg===false){
		while(f_queue.length>0){
			prg=true;
			await f_queue[0]();
			f_queue=f_queue.slice(1);
		}
		prg=false;
	}
}

} catch (e) {
  console.error(e);
}
