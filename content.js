try{
chrome.runtime.sendMessage({type:"page", msg:window.location.href}, function(response){});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch (request.type) {
			case "checkLinks":
			let lnks=[...document.getElementsByTagName('A')].map((lk)=>{return lk.href;});
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