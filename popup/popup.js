/*
Listen for clicks in the popup.
*/
 //TO-DO make separate events listeners for each element
document.addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();
	
	//Display the mangas list, highlighting new releases
	if (e.target.classList.contains("new_releases")){
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
			
			//construct div element with manga & website name properties,   
			let dom_manga = document.createElement("tr");
			dom_manga.manga_name = name;
			dom_manga.website_name = manga.website_name;
			dom_manga.style.display = unread_chapters.length?"":"none";
			//displaying the manga name 
			//TO-DO if the manga name is too long, cut it short and set a tooltip displaying the full name
			let dom_manga_text = document.createElement("td");
			dom_manga_text.setAttribute("class", "name_text");
			if (name.length > 50) {
				//create a tooltip with full name
				let tooltip = document.createElement("span");
				tooltip.setAttribute("class", "tooltiptext");
				let tooltip_text = document.createTextNode(name.replace(/_/g, " "));
				tooltip.appendChild(tooltip_text);
				dom_manga_text.appendChild(tooltip);
				//trim the name for the main display
				name = name.slice(0, 47) + "...";
			}
			let dom_name_node = document.createTextNode(name.replace(/_/g, " "));
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
			
			//dom_mangas_list.appendChild(dom_manga);
			
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
	}
	//END display the manga list
	
	//"show all" button setting the property style.display = "" for every mangas
	else if (e.target.classList.contains("all_releases")) {
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
	}
	
	//"back" button hiding the mang list and showing the first layer menu
	else if (e.target.classList.contains("back_menu")) {
		//show first layer menu
		document.getElementById("menu").style.display = "";
		//hide new mangas list
		document.getElementById("mangas_list").style.display = "none";
	}
	
	
	//follow the manga from the current tab
	else if (e.target.classList.contains("follow")){
		switch (e.target.innerHTML) {
			case "follow this manga" :
				var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
				e.target.innerHTML = "...";
				var fail = await background.followManga(url);
				if (!fail){
					e.target.innerHTML = "now following";
				} else {
					e.target.innerHTML = "error, try again";
					setTimeout(()=>{e.target.innerHTML = "follow this manga";},3000);
				}
				break;
		}
	} 
	
	//update the mangas list
	else if (e.target.classList.contains("update")){
		e.target.innerHTML = "...";
		var fail = await background.updateMangasList();
		if (!fail){
			e.target.innerHTML = "list updated";
		} else {
			e.target.innerHTML = "error, try again";
		}
		setTimeout(()=>{e.target.innerHTML = "update the list";},3000);
	} 
	
	//show the options menu
	else if (e.target.classList.contains("options")){
		browser.runtime.openOptionsPage();
	}
});


//initialize follow button
async function initializeFollowButton(){
	var manga_name = "notAManga";
	
	var background = await browser.runtime.getBackgroundPage();
	var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
	//website_url = current_tab[0].url;
	manga_name = background.getMangaName(url);
	if (manga_name == "notAManga"){
		document.getElementsByClassName("follow")[0].innerHTML = "can't follow this";
	} else if (await background.isMangaFollowed(manga_name)){
		document.getElementsByClassName("follow")[0].innerHTML = "already followed";
	} else {
		document.getElementsByClassName("follow")[0].innerHTML = "follow this manga";
	}
}


initializeFollowButton();
