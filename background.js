chrome.windows.onCreated.addListener((window) => {
	if (window.type==='popup'){
	 chrome.windows.remove(window.id);
	}
});
