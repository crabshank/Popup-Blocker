try{
	let scr = document.createElement('script');
	scr.src = chrome.runtime.getURL('tab_block.js');
	window.document.head.insertAdjacentElement('afterbegin',scr);
}catch(e){;}

chrome.runtime.sendMessage({msg:window.location.href}, function(response){});