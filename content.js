try{
var chg = {u:window.location.href, c:0};

var fr_id=null;
var tb_id=null;
var mid_up=false;

function altLinks(lk_arr){

		let lks=[];
		
	for (let k=0, len=lk_arr.length; k<len; k++){
			let h=lk_arr[k];
			
			if(h.includes('https%3A%2F%2F')){
				let s=h.split('https%3A%2F%2F');
				lks.push('https://'+s.slice(1).join('https%3A%2F%2F'));
				lks.push(decodeURIComponent('https://'+s[1].split('&')[0]));
				lks.push(decodeURIComponent('https://'+s[1].split(';')[0]));
			}else if(h.includes('http%3A%2F%2F')){
				let s=h.split('http%3A%2F%2F');
				lks.push('http://'+s.slice(1).join('http%3A%2F%2F'));
				lks.push(decodeURIComponent('http://'+s[1].split('&')[0]));
				lks.push(decodeURIComponent('http://'+s[1].split(';')[0]));
			}
	}
	
	return lks;

}

function key_down_mouse_down(event){
	try{
		if(!mid_up){
			mid_up=true;
			var lks=event.composedPath().filter((p)=>{return (p.tagName==='A' && p.href && typeof p.href!=='undefined' && p.href!=='');});
			var out=[];
			
			if(lks.length>0){
				var lks_m=lks.map((k)=>{return k.href;});
				
				lks_m.forEach((lk)=>{
					out.push(lk);
					out.push(...altLinks([lk]));
				});

				chrome.runtime.sendMessage({
						type: "links",
						links: out
					}, function(response) {});
				}
			mid_up=false;
		}
	}catch(e){mid_up=false;}
}

async function get_ids(){
	await new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({type: "get_info"}, function(response) {
			fr_id=response.info.frameId;
			tb_id=response.info.tab.id;
			link_sender();
			window.addEventListener('pointerdown',key_down_mouse_down,{capture: true, passive:false});
			window.addEventListener('pointerdown',key_down_mouse_down,{capture: false, passive:false});
			window.addEventListener('keydown',key_down_mouse_down,{capture: true, passive:false});
			window.addEventListener('keydown',key_down_mouse_down,{capture: false, passive:false});
			resolve();
		});
	});
}

function link_sender(){
	let lnks= getTagNameShadow(document, 'A').filter((lk)=>{return (!!lk.href && typeof lk.href!=='undefined' && lk.href!=='');});
	lnks=lnks.map((lk)=>{return lk.href;});

	lnks.push(...altLinks(lnks));

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
				chg.c++;
			}
			link_sender();
		}
	}
		return true; 
}

get_ids();

}catch(e){;}