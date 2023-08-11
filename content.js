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
			let lc=(e.button===0)?true:false;
			let altLc=(e.altKey && lc)?true:false;
			if(!altLc){
				e.preventDefault();
				e.stopPropagation();
			}
			if(lc && !altLc){
				let nm=( e.shiftKey && (!(e.shiftKey && ( e.ctrlKey || e.altKey ) )) )?'':'_blank'; //new window is ''
				nm=( e.shiftKey || e.ctrlKey  )?nm:'_self';
				window.open(t.href, nm);
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


