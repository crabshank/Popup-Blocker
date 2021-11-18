let d_HTML=document.documentElement.innerHTML;
var d_HTML2=d_HTML;
let scr=[...document.getElementsByTagName("script")];

if(!!scr && scr.length>0){
	
	scr.forEach((s)=>{
	d_HTML2=d_HTML2.replaceAll(s.outerHTML, '');
	});

	scr.forEach((s)=>{
	let re = /((window.open\s*\(\s*.*\s*\)\s*\;?)|(((?<=\s+)|(?<=\;))(debugger\s*\;?)))/g;
	let arr = s.outerHTML.match(re);
		if(!!arr && arr.length>0){
			arr.forEach((m)=>{
			ns=s.outerHTML.replaceAll(m, '/*'+m+'*/');
			d_HTML2+=ns.outerHTML;
			});
		}else{
			d_HTML2+=s.outerHTML;
		}
	});

}
