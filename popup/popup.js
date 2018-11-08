/*
Listen for clicks in the popup.
*/
document.getElementById("new_releases").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();
	//reset the list
	var dom_mangas_list = document.getElementById("list");
	while (dom_mangas_list.firstChild){
		 dom_mangas_list.removeChild(dom_mangas_list.firstChild);
	}	
	
	var mangas = await background.getMangasList();
	//sorting the mangas alphabetically
	mangas = Object.keys(mangas).sort().reduce((r, k) => (r[k] = mangas[k], r), {});
	var unread_mangas = [];
	var read_mangas = [];

	//for each manga, 
	for (let name in mangas){
		var manga = mangas[name];
		
		//sort the chapters (unread ones by ascending order, read ones by descending order)
		let read_chapters = [];
		let unread_chapters = [];
		for (let chapter in manga.chapters_list){
			manga.chapters_list[chapter]["status"] == "unread" ? unread_chapters.push(chapter) : read_chapters.push(chapter);
		}
		unread_chapters.sort();
		read_chapters.sort().reverse();
		
		//construct tr element with manga & website name properties,   
		let dom_manga = document.createElement("div");
		dom_manga.classList.add("list_line");
		dom_manga.manga_name = name;
		dom_manga.website_name = manga.website_name;
		if (unread_chapters.length == 0) 
			dom_manga.classList.add("hidden");
		
		//displaying the manga name 
		let dom_manga_text = document.createElement("div");
		dom_manga_text.classList.add("tooltiptextcontainer");
		//create a tooltip with full name
		let tooltip = document.createElement("span");
		tooltip.classList.add("tooltiptext");
		let tooltip_text = document.createTextNode(name.replace(/_/g, " "));
		tooltip.appendChild(tooltip_text);
		dom_manga_text.appendChild(tooltip);
		//add text to the name
		let dom_name_node = document.createElement("span");
		dom_name_node.classList.add("name_text");
		let dom_name_text_node = document.createTextNode(name.replace(/_/g, " "));
		dom_name_node.appendChild(dom_name_text_node);
		dom_manga_text.appendChild(dom_name_node);

		dom_manga.appendChild(dom_manga_text);
		
		//and number of unread chapters			
		let dom_unread_number_node = document.createElement("div");
		let text_node;
		if (unread_chapters.length) {
			dom_unread_number_node.classList.add("red_text", "align_right");
			text_node = document.createTextNode(" ("+unread_chapters.length+")");
		} else {
			dom_unread_number_node.classList.add("green_text", "align_right");
			text_node = document.createTextNode(" (0)");
		}
		dom_unread_number_node.appendChild(text_node);
		dom_manga.appendChild(dom_unread_number_node);
		
		
		//and the sorted chapter list (unread first, then read)
		
		let dom_select_td = document.createElement("div");
		let dom_select = document.createElement("select");
		dom_select.classList.add(unread_chapters.length?"unread_chapter":"read_chapter");
		//update background when selected option changes
		dom_select.addEventListener("change", function(e){e.target.classList.add(e.target.options[e.target.selectedIndex].classList);}, false);
		
		for (let x in unread_chapters){
			let dom_option = document.createElement("option");
			dom_option.classList.add("unread_chapter");
			let dom_option_text = document.createTextNode(unread_chapters[x]);
			dom_option.appendChild(dom_option_text);
			
			dom_select.appendChild(dom_option);
		}
		for (let x in read_chapters){
			let dom_option = document.createElement("option");
			dom_option.classList.add("read_chapter");
			let dom_option_text = document.createTextNode(read_chapters[x]);
			dom_option.appendChild(dom_option_text);
			
			dom_select.appendChild(dom_option);
		}
		dom_select_td.appendChild(dom_select);
		dom_manga.appendChild(dom_select_td);
		
		
		//and a button to read chapter selected from the list. button needs listener to (1) call background function to reconstruct url, and (2) open link in new tab
		let dom_button_td = document.createElement("div");
		let dom_button = document.createElement("button");
		let dom_button_text = document.createTextNode("read");
		dom_button.appendChild(dom_button_text);
		dom_button.addEventListener("click", 
									async function(e){	let my_manga = e.target.parentElement.parentElement;
														let manga_url = await background.reconstructChapterURL(my_manga.manga_name, my_manga.getElementsByTagName("select")[0].options[my_manga.getElementsByTagName("select")[0].selectedIndex].value); 
														browser.tabs.create({url:manga_url, active:false});
													}
									, false);
		
		dom_button_td.appendChild(dom_button);
		dom_manga.appendChild(dom_button_td);
		
		if (unread_chapters.length)
			unread_mangas.push(dom_manga);
		else read_mangas.push(dom_manga);
	}
	
	for (let dom_manga in unread_mangas){
		dom_mangas_list.appendChild(unread_mangas[dom_manga]);
	}
	for (let dom_manga in read_mangas){
		dom_mangas_list.appendChild(read_mangas[dom_manga]);
	}
	
	
	//hide first layer menu
	document.getElementById("menu_panel").classList.toggle("hidden");
	//show new mangas list
	document.getElementById("mangas_list").classList.toggle("hidden");
});


document.getElementById("all_releases").addEventListener("click", async (e) => {
	var all_releases = document.getElementById("list").getElementsByClassName("list_line");
	for (let release in all_releases){
		if (all_releases.hasOwnProperty(release) && all_releases[release].getElementsByClassName("green_text").length > 0) {
				all_releases[release].classList.toggle("hidden"); 
		}
	}
	if (e.target.innerHTML == "show all mangas") {
		e.target.innerHTML = "hide old mangas";
		
	} else {
		e.target.innerHTML = "show all mangas";
	}

});

document.getElementById("back_menu").addEventListener("click", async (e) => {
	//show first layer menu
	document.getElementById("menu_panel").classList.toggle("hidden");
	//hide new mangas list
	document.getElementById("mangas_list").classList.toggle("hidden");

});

document.getElementById("follow").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();
	switch (e.target.innerText) {
		case "follow this manga" :
			var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
			e.target.innerText = "...";
			var fail = await background.followManga(url);
			if (!fail){
				e.target.innerText = "now following";
				setTimeout(()=>{e.target.innerText = "already followed";},3000);
			} else {
				e.target.innerText = "error, try again";
				setTimeout(()=>{e.target.innerText = "follow this manga";},3000);
			}
			break;
	}

});

//TODO : reset console_display
document.getElementById("update").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();
	e.target.innerText = "...";
	background.updateMangasList();
});

document.getElementById("options").addEventListener("click", async (e) => {
	browser.runtime.openOptionsPage();
});




//initialize follow button
async function initializeFollowButton(){
	var manga_name = "notAManga";
	var background = await browser.runtime.getBackgroundPage();
	var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
	manga_name = background.getMangaName(url);
	if (manga_name == "notAManga"){
		document.getElementById("follow").innerHTML = "can't follow this";
	} else if (await background.isMangaFollowed(manga_name)){
		document.getElementById("follow").innerHTML = "already followed";
	} else {
		document.getElementById("follow").innerHTML = "follow this manga";
	}
}

initializeFollowButton();

//toggle console display
document.getElementById("console_toggle").addEventListener("click", async (e) => {
	document.getElementById("console").classList.toggle("hidden");
});

//initializing status
document.getElementById("console_updating").status = "hiding";
//toggle "updating" console messages display
document.getElementById("console_updating").addEventListener("click", async (e) => {
	let messages = document.getElementsByClassName("console_line_container");
	if (messages.length > 0) {
		for (let index in messages){
			if (messages[index].status == "updating")
			e.target.status == "hiding" ? messages[index].classList.remove("hidden") : messages[index].classList.add("hidden");
		}
	}
	e.target.status == "hiding" ? e.target.status = "showing" :	e.target.status = "hiding";
});

//initializing status
document.getElementById("console_completed").status = "hiding";
//toggle "completed" console messages display
document.getElementById("console_completed").addEventListener("click", async (e) => {
	let messages = document.getElementsByClassName("console_line_container");
	if (messages.length > 0) {
		for (let index in messages){
			if (messages[index].status == "completed")
			e.target.status == "hiding" ? messages[index].classList.remove("hidden") : messages[index].classList.add("hidden");
		}
	}
	e.target.status == "hiding" ? e.target.status = "showing" :	e.target.status = "hiding";
});

//turn console_errors div into a copy errors details to clipboard button if console_errors_number > 0
document.getElementById("console_errors").addEventListener("click", (e) => {
	let details = document.getElementsByClassName("console_details");
	let details_text = "";
	for (let index in details){
		if (details[index].classList) {
			details_text += details[index].classList.contains("red_text") ? details[index].innerText+"\n" : "";
		}
	}
	navigator.clipboard.writeText(details_text);
});

//listen to background script, and display console messages
browser.runtime.onMessage.addListener(updateConsole);

async function updateConsole(message) {
	if  (message.target == "popup" && message.log){
		var log = message.log;
		var console_display = document.getElementById("console_display");
		var user_scrolled = !(console_display.scrollHeight - console_display.clientHeight <= console_display.scrollTop + 1);

		//displaying updates status
		//main line (name + website + status)
		let manga = document.createElement("div");
		manga.classList.add("console_line_container");
		manga.setAttribute("id", log.manga+log.from+log.status);
		manga.status = log.status;

		//name 
		let retrieving = document.createElement("div");
		retrieving.classList.add( "tooltiptextcontainer", "left", "console_line");
		//name tooltip
		let tooltip = document.createElement("span");
		tooltip.classList.add("tooltiptext");
		let tooltip_text = document.createTextNode(log.manga.replace(/_/g, " "));
		tooltip.appendChild(tooltip_text);
		retrieving.appendChild(tooltip);
		//add text to the name
		let retrieving_text = document.createElement("span");
		retrieving_text.classList.add("console_name_text");
		let retrieving_text_node = document.createTextNode("retrieving "+log.manga.replace(/_/g, " "));
		retrieving_text.appendChild(retrieving_text_node);
		retrieving.appendChild(retrieving_text);
		manga.appendChild(retrieving);

		//website 
		let from = document.createElement("div");
		from.classList.add("console_from", "left", "console_line");
		let from_text_node = document.createTextNode(" from "+log.from);
		from.appendChild(from_text_node);
		manga.appendChild(from);

		//status 
		let status = document.createElement("div");
		status.classList.add("left", "console_status", "console_line");
		if (log.status == "completed") {
			status.classList.add("green_text");
			manga.classList.add("hidden");
		}  else if (log.status == "errors") {
			status.classList.add("red_text");
		} else manga.classList.add("hidden");
		let status_text_node = document.createTextNode(" - status : "+log.status);
		status.appendChild(status_text_node);
		manga.appendChild(status);

		//toggle details display
		manga.addEventListener("click", 
								async function(e){	if (log.details != "") {
														let details = document.getElementById(this.id+"details");
														details.classList.toggle("hidden");
													}
												}
								, false);
		console_display.appendChild(manga);

		//details line
		let manga_details = document.createElement("div");
		manga_details.setAttribute("id", log.manga+log.from+log.status+"details");
		let details = document.createElement("span");
		details.classList.add((log.status == "errors" ? "red_text" : "dummy"), "left", "console_details");
		let details_text_node = document.createTextNode((log.details != "" ? " details : "+log.details : ""));
		details.appendChild(details_text_node);
		manga_details.classList.add(log.status == "errors" ? "dummy" : "hidden");
		manga_details.appendChild(details);
		console_display.appendChild(manga_details);
		
		if (!user_scrolled)
			console_display.scrollTop = console_display.scrollHeight - console_display.clientHeight;

		//updating console recap numbers
		if (log.status == "updating") {
			let updating_number = document.getElementById("console_updating_number");
			if (!updating_number.value)
				updating_number.value = 0;
			updating_number.value += 1;
			updating_number.innerHTML = "("+updating_number.value+")";
		} else {
			let updating_number = document.getElementById("console_updating_number");
			updating_number.value -= 1;
			updating_number.innerHTML = "("+updating_number.value+")";
			let finished_number = document.getElementById("console_"+log.status+"_number");
			if (!finished_number.value)
				finished_number.value = 0;
			finished_number.value += 1;
			finished_number.innerHTML = "("+finished_number.value+")";
		}

		//informing update button the updating is finished
		if (document.getElementById("console_updating_number").value == 0) {
			document.getElementById("update").innerText = "list updated";
			setTimeout(()=>{document.getElementById("update").innerText = "update the list";},3000);
		}
	}
}