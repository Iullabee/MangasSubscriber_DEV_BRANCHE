//store the background page in a global var
var background = null;
(async ()=>{background = await browser.runtime.getBackgroundPage();})().then(()=>{



	//display the version
	document.getElementById("version").textContent = browser.runtime.getManifest().version;



	//load other scripts
	(async function scripts(){
		var scripts = ["list.js", "options.js", "console.js", "modal.js", "search.js"];
		var body = document.getElementsByTagName('body')[0];
		
		while (scripts.length > 0) {
			let script = document.createElement('script');
			script.src = scripts.shift(); //returns the first element from the array and removes it
			body.appendChild(script);
		}
	})();
	
	
	
	//initialize follow button
	async function initializeFollowButton(){
		document.getElementById("follow").title = "please wait";
		document.getElementById("follow_icon").src = "../icons/dots.svg";
		var manga_name = "notAManga";
		var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
		manga_name = await background.getMangaName(url); //TODO - if performance problems, try optimizing by reading the name directly from the page (needs a website object capable of reading the current page at the popup level)
		if (manga_name == "notAManga"){
			document.getElementById("follow").title = "can't follow this";
			document.getElementById("follow_icon").src = "../icons/not_followable.svg";
		} else if (await background.isMangaFollowed(manga_name)){
			document.getElementById("follow").title = "already followed";
			document.getElementById("follow_icon").src = "../icons/followed.svg";
		} else {
			document.getElementById("follow").title = "follow this manga";
			document.getElementById("follow_icon").src = "../icons/follow.svg";
		}
	}
	initializeFollowButton();

	document.getElementById("follow").addEventListener("click", async (e) => {
		switch (document.getElementById("follow").title) {
			case "follow this manga" :
				var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
				document.getElementById("follow").title = "please wait";
				document.getElementById("follow_icon").src = "../icons/dots.svg";
				var fail = await background.followManga(url);
				if (!fail){
					document.getElementById("follow").title = "now following";
					document.getElementById("follow_icon").src = "../icons/followed.svg";
					setTimeout(async ()=>{document.getElementById("follow").title = "already followed"; createMangasList();},3000);
				} else {
					document.getElementById("follow").title = "error, try again";
					document.getElementById("follow_icon").src = "../icons/follow.svg";
					document.getElementById("follow_icon").style.border = "2px solid red";
					setTimeout(()=>{document.getElementById("follow").title = "follow this manga"; document.getElementById("follow_icon").style.border = "";},3000);
				}
				break;
		}
	});



	function selectTab (id) {
		let selected_tab = document.getElementsByClassName("selected_tab")[0];
		if (selected_tab) {
			selected_tab.classList.remove("selected_tab");
			if (id && selected_tab.id != id) document.getElementById(id).classList.add("selected_tab");
		} else if (id) document.getElementById(id).classList.add("selected_tab");
	}

	document.getElementById("menu").addEventListener("click", async (e) => {
		var tabs = {"options_toggle":"options", "console_toggle":"console", "help_toggle":"help", "search_toggle":"search"};
		let refresh_list = true;
		//if target has a panel attached
		if (tabs[e.target.parentElement.id]) {
			let visible = document.getElementById(tabs[e.target.parentElement.id]).classList.contains("visible_panel");
			//update buttons
			selectTab(e.target.parentElement.id);
			//hide panels
			for (let i in tabs) document.getElementById(tabs[i]).classList.remove("visible_panel");
			//if target was already hidden, show it
			if (!visible) {
				document.getElementById(tabs[e.target.parentElement.id]).classList.add("visible_panel");
				refresh_list = false; // no need to refresh the list if we're showing a panel on top
				//if search panel, focus search field
				tabs[e.target.parentElement.id] == "search" ? document.getElementById("search_field").focus() : false;
			}
		}
		else {
			//update buttons
			selectTab();
			//hide panels
			for (let i in tabs) document.getElementById(tabs[i]).classList.remove("visible_panel");
		}
		if (refresh_list) setTimeout(createMangasList, 500); //wait for the sliding animation to finish before refreshing the list to avoid stuttering
	});



	(async function patchnotes() {
		let parser = new DOMParser();
		let source = "";
		
		let title = "MangasSubscriber has been updated !";
		let patchnotes = [];
		let patchnotes_seen = await background.getPatchnotesVersion();

		//get patchnotes
		try{
			source = await background.getSource("../help/patchnotes.html");
		} catch (error){
			throw error;
		}
		
		//extract mangas found
		let doc = parser.parseFromString(source, "text/html");
		let list = doc.querySelectorAll("div.modal_list_line");
		for (let i=0; i<list.length; i++) {
			let item_version = list[i].getElementsByClassName("name_text")[0].innerText.split("version ")[1];
			if (background.sortVersions(item_version, patchnotes_seen) > 0) {
				patchnotes.push(list[i]);
			}
		}
		if (patchnotes.length > 0) {
			//no modal agree
			revealModal(title, patchnotes);
			background.setPatchnotesVersion(browser.runtime.getManifest().version);
		}
	})();


});