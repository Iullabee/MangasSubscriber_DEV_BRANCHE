

//export the manga list
document.getElementById("export").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();

	var export_text = document.getElementById("export");

	export_text.innerHTML = "...";
	var fail = await background.exportMangasList();
	if (!fail){
		export_text.innerHTML = "list exported";
	} else {
		export_text.innerHTML = "error, try again";
	}
	setTimeout(()=>{export_text.innerHTML = "export mangas list";},3000);
});

//import the manga list
document.getElementById("import_text").addEventListener("click", async (e) => {
	//retrieve the file
	var file = document.getElementById("hidden_import").files[0];
	if (file){
		var background = await browser.runtime.getBackgroundPage();
		
		//retrieve the chosen import option
		var import_option = "";
		var inputs = document.getElementsByName("import_option");
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i].checked) {
				import_option = inputs[i].value;
			}
		}
		
		document.getElementById("import_options").style="display:none";
		document.getElementById("import_file").style="display:none";
		document.getElementById("import_text").colSpan = "3";
		
		var fail = await background.importMangasList(file, import_option);
		if (!fail){
			document.getElementById("import_text").innerHTML = "list imported";
		} else {
			document.getElementById("import_text").innerHTML = "error, try again";
		}
		setTimeout(()=>{document.getElementById("import_text").innerHTML = "import mangas list";
						document.getElementById("import_text").colSpan = "1";
						document.getElementById("import_options").style="display:";
						document.getElementById("import_file").style="display:";
		},3000);
	} else {
		document.getElementById("import_text").innerHTML = "error, please choose a file to import";
		setTimeout(()=>{document.getElementById("import_text").innerHTML = "import mangas list";},3000);
	}
});

//display chosen import file
document.getElementById("hidden_import").addEventListener("change", async (e) => {
	document.getElementById("visible_import").innerText = "["+ document.getElementById("hidden_import").files[0].name +"]";
});

//display and manage the manga list
document.getElementById("toggle_list").addEventListener("click", async (e) => {
	
	var background = await browser.runtime.getBackgroundPage();
	//reset the list
	var dom_mangas_list = document.getElementById("complete_list");
	//si la liste est vide, on la construit
	if (!dom_mangas_list.firstChild) {
		
		var legend = document.getElementsByClassName("legend");
		for (let index in legend) {
			if (legend.hasOwnProperty(index)){
				if (legend[index].attributes.hidden)
					legend[index].attributes.removeNamedItem("hidden");
				//legend[index].style.display = "";
			}
		}
		var mangas = await background.getMangasList();
		//sorting the mangas alphabetically
		mangas = Object.keys(mangas).sort().reduce((r, k) => (r[k] = mangas[k], r), {});
		var unread_mangas = [];
		var read_mangas = [];

		var search_list = document.getElementById("search_list").value;
		//for each manga, 
		for (let name in mangas){
			//if the manga corresponds with the search
			if (search_list == "" || name.indexOf(search_list) != -1){
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
				
				//and a button to mark all chapters as read
				let dom_read_all_button_td = document.createElement("td");
				let dom_read_all_button = document.createElement("div");
				dom_read_all_button.setAttribute("class", "icons read_all_icon");
				dom_read_all_button.addEventListener("click", 
						async function(e){	let my_manga = e.target.parentElement.parentElement;
											let chapters_list = my_manga.getElementsByTagName("select")[0].options;
											for (let index in chapters_list) {
												if (chapters_list.hasOwnProperty(index)){
													let manga_url = background.reconstructChapterURL(my_manga.website_name, my_manga.manga_name, chapters_list[index].value); 
													await background.readMangaChapter({"url": manga_url});
												}
											}
										}
						, false);
				dom_read_all_button_td.appendChild(dom_read_all_button);
				dom_manga.appendChild(dom_read_all_button_td);
				
				
				//and a button to delete the manga from the list
				let dom_delete_button_td = document.createElement("td");
				let dom_delete_button = document.createElement("div");
				dom_delete_button.setAttribute("class", "icons delete_icon");
				dom_delete_button.addEventListener("click", 
						async function(e){	let my_manga = e.target.parentElement.parentElement;
											await background.deleteManga(my_manga.manga_name);
										}
						, false);
				dom_delete_button_td.appendChild(dom_delete_button);
				dom_manga.appendChild(dom_delete_button_td);
				
				
				//add manga to the unread array or to the read array
				if (unread_chapters.length)
					unread_mangas.push(dom_manga);
				else read_mangas.push(dom_manga);
			}
		}
		
		for (let dom_manga in unread_mangas){
			dom_mangas_list.appendChild(unread_mangas[dom_manga]);
		}
		for (let dom_manga in read_mangas){
			dom_mangas_list.appendChild(read_mangas[dom_manga]);
		}
		
		
		//toggle the list
		dom_mangas_list.style.display = "block";
	} else {
		//si la liste existe, on la vide
		while (dom_mangas_list.firstChild){
			 dom_mangas_list.removeChild(dom_mangas_list.firstChild);
		}
		dom_mangas_list.style.display = "none";
		var legend = document.getElementsByClassName("legend");
		for (let index in legend) {
			if (legend.hasOwnProperty(index))
				//legend[index].style.display = "none";
				legend[index].setAttribute("hidden", "hidden");
		}
	}
});

//trim manga list when search is validated
document.getElementById("search_list").addEventListener("change", async (e) => {
	var dom_mangas_list = document.getElementById("complete_list");
	//si la liste existe, on la vide
	while (dom_mangas_list.firstChild){
		 dom_mangas_list.removeChild(dom_mangas_list.firstChild);
	}
	document.getElementById("toggle_list").click();
});