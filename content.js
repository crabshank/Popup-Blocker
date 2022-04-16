try{
var timer;
var chg = window.location.href;

function link_sender(){
	let lnks= getTagNameShadow(document, 'A').filter((lk)=>{return (typeof lk.href!=='undefined' &&  !!lk.href && lk.href!=='');});
	lnks=lnks.map((lk)=>{return lk.href;});
	lnks=Array.from(new Set(lnks));
	chrome.runtime.sendMessage({
		type: "links",
		links: lnks
	}, function(response) {});
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch (request.type) {
			case "checkLinks":
				link_sender();
			break;
			        return true; 
		}
	});

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

link_sender();

if (typeof observer === "undefined" && typeof timer === "undefined") {
    link_sender();
    const observer = new MutationObserver((mutations) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {

            if (window.location.href != chg) {
	            	chg = window.location.href;
			}

        }, 150);
    });

 observer.observe(document, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
        attributeOldValue: true,
        characterDataOldValue: true
    });
}


}catch(e){;}