function setupEvents(){
	window.addEventListener('pointerdown',(e)=>{
		let t=e.target;
		if(t.tagName==='A'){
			e.preventDefault();
			e.stopPropagation();
			if(e.buttons===4){// new tab
				window.open(t.href,"_blank");
			}	
		}
	});
	window.addEventListener('click',(e)=>{
		let t=e.target;
		if(t.tagName==='A'){
			e.preventDefault();
			e.stopPropagation();
			if(e.button===0){ //same tab
				window.open(t.href, ( (e.ctrlKey)? "_blank" : "_self") );
			}
		}
	});
}

function restore_options()
{
	if(typeof chrome.storage==='undefined'){
		restore_options();
	}else{
		chrome.storage.sync.get(null, function(items){
			if (Object.keys(items).length != 0){
				//console.log(items);
				
				if(!!items.ovrA && typeof  items.ovrA!=='undefined'){
					if(items.ovrA==true){
						setupEvents();
					}
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
		wList: "",
		aggDisc: false,
		ovrA: false
	}, function()
	{
		console.log('Default options saved.');
		restore_options();
	});
		});

}

restore_options();


