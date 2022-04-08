try{

function getTagNameShadow(docm, tgn){
	var shrc=[];
	var out=[];
	
		let allNodes=[...docm.querySelectorAll('*')];
		let srCnt=0;
		
		while(srCnt<allNodes.length){ //1st round
			if(!!allNodes[srCnt] && typeof allNodes[srCnt] !=='undefined' && allNodes[srCnt].tagName===tgn){
				out.push(allNodes[srCnt]);
			}
			
			if(!!allNodes[srCnt].shadowRoot && typeof allNodes[srCnt].shadowRoot !=='undefined'){
				let c=allNodes[srCnt].shadowRoot.children;
				shrc.push(...c);
			}
			srCnt++;
		}
		
		srCnt=0;
		let srCnt_l=shrc.length;
		
		while(srCnt<srCnt_l){ //2nd round
			if(!!shrc[srCnt].shadowRoot && typeof shrc[srCnt].shadowRoot !=='undefined'){
				let c=shrc[srCnt].shadowRoot.children;
				shrc.push(...c);
				srCnt_l+=c.length;
			}
			srCnt++;
		}
	
	let srv=shrc.filter((c)=>{return c.tagName===tgn;});
	out.push(...srv);
	
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