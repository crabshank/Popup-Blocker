try {
function getUrl(tab){
	if(tab.pendingUrl!=null){
	return (tab.url=="")?tab.pendingUrl:tab.url;
	}else{
		
		if(tab.url!=null){
			return tab.url;
		}else{
			return tab; //if tab.url not there
		}
	
	}
}

chrome.windows.onCreated.addListener((window) => {
	if (window.type==='popup'){
		chrome.tabs.query({windowId: window.id}, function(tabs) {
			let xmp=false;
			for (let t = 0; t < tabs.length; t++) {
			if(getUrl(tabs[t]).startsWith('chrome-extension://')){
				xmp=true;
				break;
			}
		}
			if(!xmp){
			chrome.windows.remove(window.id);
			}
			});
	}
});
} catch (e) {
  console.error(e);
}