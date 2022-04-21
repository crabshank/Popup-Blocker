try{
var chg = {u:window.location.href, c:0};

var fr_id=null;
var tb_id=null;

async function get_ids(){
	await new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({type: "get_info"}, function(response) {
			fr_id=response.info.frameId;
			tb_id=response.info.tab.id;
			link_sender();
			resolve();
		});
	});
}

function link_sender(){
	let lnks= getTagNameShadow(document, 'A').filter((lk)=>{return (typeof lk.href!=='undefined' &&  !!lk.href && lk.href!=='');});
	lnks=lnks.map((lk)=>{return lk.href;});
	lnks=Array.from(new Set(lnks));
	chrome.runtime.sendMessage({
		type: "links",
		links: lnks
	}, function(response) {});
}

function getTagNameShadow(docm, tgn){
var shrc=[docm];
var shrc_l=1;

let srCnt=0;

while(srCnt<shrc_l){
	allNodes=[shrc[srCnt],...shrc[srCnt].querySelectorAll('*')];
	for(let i=0, len=allNodes.length; i<len; i++){
		if(!!allNodes[i] && typeof allNodes[i] !=='undefined' && allNodes[i].tagName===tgn && i>0){
			shrc.push(allNodes[i]);
		}

		if(!!allNodes[i].shadowRoot && typeof allNodes[i].shadowRoot !=='undefined'){
			let c=allNodes[i].shadowRoot.children;
			shrc.push(...c);
		}
	}
	srCnt++;
	shrc_l=shrc.length;
}
	shrc=shrc.slice(1);
	let out=shrc.filter((c)=>{return c.tagName===tgn;});
	
	return out;
}

chrome.runtime.onMessage.addListener(gotMessage);
function gotMessage(message, sender, sendResponse) {
	if(message.message=="checkLinks"){
		link_sender();
	}else if(message.message=="nav"){
		if(message.f_id===fr_id){
			if((chg.c==0) || (window.location.href!==chg.u && chg.c>0)){
				chrome.runtime.sendMessage({type: "nav",old_url: chg.u, new_url: window.location.href}, function(response) {});
				chg.u=window.location.href;
			}
			link_sender();
		}
	}
		return true; 
}

get_ids();

}catch(e){;}