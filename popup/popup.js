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
			manga.chapters_list[chapter] == "unread" ? unread_chapters.push(chapter) : read_chapters.push(chapter);
		}
		unread_chapters.sort();
		read_chapters.sort().reverse();
		
		//construct tr element with manga & website name properties,   
		let dom_manga = document.createElement("tr");
		dom_manga.manga_name = name;
		dom_manga.website_name = manga.website_name;
		dom_manga.style.display = unread_chapters.length?"":"none";
		
		//displaying the manga name 
		let dom_manga_text = document.createElement("td");
		dom_manga_text.setAttribute("class", "tooltiptextcontainer");
		//create a tooltip with full name
		let tooltip = document.createElement("span");
		tooltip.setAttribute("class", "tooltiptext");
		let tooltip_text = document.createTextNode(name.replace(/_/g, " "));
		tooltip.appendChild(tooltip_text);
		dom_manga_text.appendChild(tooltip);
		//add text to the name
		let dom_name_node = document.createElement("span");
		dom_name_node.setAttribute("class", "name_text");
		let dom_name_text_node = document.createTextNode(name.replace(/_/g, " "));
		dom_name_node.appendChild(dom_name_text_node);
		dom_manga_text.appendChild(dom_name_node);

		dom_manga.appendChild(dom_manga_text);
		
		//and number of unread chapters			
		let dom_unread_number_node = document.createElement("td");
		let text_node;
		if (unread_chapters.length) {
			dom_unread_number_node.setAttribute("class", "unread_number");
			text_node = document.createTextNode(" ("+unread_chapters.length+")");
		} else {
			dom_unread_number_node.setAttribute("class", "read_number");
			text_node = document.createTextNode(" (0)");
		}
		dom_unread_number_node.appendChild(text_node);
		dom_manga.appendChild(dom_unread_number_node);
		
		
		//and the sorted chapter list (unread first, then read)
		
		let dom_select_td = document.createElement("td");
		let dom_select = document.createElement("select");
		dom_select.style = unread_chapters.length?"background:#ffeedd":"background:#ddffee";
		//update background when selected option changes
		dom_select.addEventListener("change", function(e){for (let x in e.target.options[e.target.selectedIndex].style){e.target.style[x] = e.target.options[e.target.selectedIndex].style[x];}}, false);
		
		for (let x in unread_chapters){
			let dom_option = document.createElement("option");
			dom_option.style.background = "#ffeedd";
			let dom_option_text = document.createTextNode(unread_chapters[x]);
			dom_option.appendChild(dom_option_text);
			
			dom_select.appendChild(dom_option);
		}
		for (let x in read_chapters){
			let dom_option = document.createElement("option");
			dom_option.style.background = "#ddffee";
			let dom_option_text = document.createTextNode(read_chapters[x]);
			dom_option.appendChild(dom_option_text);
			
			dom_select.appendChild(dom_option);
		}
		dom_select_td.appendChild(dom_select);
		dom_manga.appendChild(dom_select_td);
		
		
		//and a button to read chapter selected from the list. button needs listener to (1) call background function to reconstruct url, and (2) open link in new tab
		let dom_button_td = document.createElement("td");
		let dom_button = document.createElement("button");
		let dom_button_text = document.createTextNode("read");
		dom_button.appendChild(dom_button_text);
		dom_button.addEventListener("click", 
									async function(e){	let my_manga = e.target.parentElement.parentElement;
														let manga_url = background.reconstructChapterURL(my_manga.website_name, my_manga.manga_name, my_manga.getElementsByTagName("select")[0].options[my_manga.getElementsByTagName("select")[0].selectedIndex].value); 
														browser.tabs.create({url:manga_url});
													}
									, false);
		
		dom_button_td.appendChild(dom_button);
		dom_manga.appendChild(dom_button_td);
		
		/*replace previous snippet with the following to change the button to a div with appropriate class to display open.png
		let dom_read_button_td = document.createElement("td");
		let dom_read_button = document.createElement("div");
		dom_read_button.setAttribute("class", "icons open_icon");
		dom_read_button.addEventListener("click", 
									async function(e){	let my_manga = e.target.parentElement.parentElement;
														let manga_url = background.reconstructChapterURL(my_manga.website_name, my_manga.manga_name, my_manga.getElementsByTagName("select")[0].options[my_manga.getElementsByTagName("select")[0].selectedIndex].value); 
														browser.tabs.create({url:manga_url});
													}
									, false);
		
		dom_read_button_td.appendChild(dom_read_button);
		dom_manga.appendChild(dom_read_button_td);
		*/
		
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
	document.getElementById("menu").style.display = "none";
	//show new mangas list
	document.getElementById("mangas_list").style.display = "block";
});


document.getElementById("all_releases").addEventListener("click", async (e) => {
	if (e.target.innerHTML == "show all mangas") {
		e.target.innerHTML = "hide old mangas";
		var all_releases = document.getElementById("list").childNodes;
		for (release in all_releases){
			if (all_releases.hasOwnProperty(release) && all_releases[release].style.display == "none") {
					all_releases[release].style.display = ""; 
			}
		}
	} else {
		e.target.innerHTML = "show all mangas";
		var all_releases = document.getElementById("list").childNodes;
		for (release in all_releases){
			if (all_releases.hasOwnProperty(release) && all_releases[release].firstChild.nextSibling.classList.contains("read_number")) {
					all_releases[release].style.display = "none"; 
			}
		}
	}

});

document.getElementById("back_menu").addEventListener("click", async (e) => {
	//show first layer menu
	document.getElementById("menu").style.display = "";
	//hide new mangas list
	document.getElementById("mangas_list").style.display = "none";

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

document.getElementById("update").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();
	e.target.innerText = "...";
	var fail = await background.updateMangasList();
	if (!fail){
		e.target.innerText = "list updated";
	} else {
		e.target.innerText = "error, try again";
	}
	setTimeout(()=>{e.target.innerText = "update the list";},3000);

});

document.getElementById("options").addEventListener("click", async (e) => {
	browser.runtime.openOptionsPage();
});




//initialize follow button
async function initializeFollowButton(){
	var manga_name = "notAManga";
	
	var background = await browser.runtime.getBackgroundPage();
	var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
	//website_url = current_tab[0].url;
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
