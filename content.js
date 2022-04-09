try{

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

chrome.runtime.sendMessage({type:"page", msg:window.location.href}, function(response){});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch (request.type) {
			case "checkLinks":
			let lnks= getTagNameShadow(document, 'A').map((lk)=>{return lk.href;});
				   lnks=lnks.filter((lk)=>{return (typeof lk!=='undefined' &&  !!lk && lk!=='');});
			let opnr=request.opnr;
			let chk=request.chk;
				chrome.runtime.sendMessage({
					type: "links",
					links: lnks,
					opnr: opnr,
					chk: chk
				}, function(response) {});
			break;
			        return true; 
		}
	});
}catch(e){;}