try{
	let puTb=`window.open = () => {};`;

	if([...window.document.head.getElementsByTagName('script')].filter((tg)=>{return tg.innerHTML===puTb}).length==0)
	{
		let scr=window.document.createElement('script');
		scr.innerHTML=puTb;
		window.document.head.insertAdjacentElement('afterbegin',scr);
	}
}catch(e){;}

chrome.runtime.sendMessage({msg:window.location.href}, function(response){});