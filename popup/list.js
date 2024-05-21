





async function createMangasList() {
	var mangas = await background.getMangasList();
	var preferences = await background.getMangasSubscriberPrefs();
	//saving scroll position to recall later
	let scrollmemory = document.getElementById("list_container").scrollTop;
   
	//sorting the mangas alphabetically
	mangas = Object.keys(mangas).sort().reduce((r, k) => (r[k] = mangas[k], r), {});
	var unread_mangas = [];
	var read_mangas = [];
	
	var dom_mangas_list = document.getElementById("list"); //clear the existing list
	while (dom_mangas_list.firstChild){
		dom_mangas_list.removeChild(dom_mangas_list.firstChild);
	}

	//for each manga, 
	for (let name in mangas){
		var manga = mangas[name];
		
		//sort the chapters (unread ones by ascending order, read ones by descending order)
		let read_chapters = [];
		let unread_chapters = [];
		for (let chapter in manga.chapters_list){
			manga.chapters_list[chapter]["status"] == "unread" ? unread_chapters.push(chapter) : read_chapters.push(chapter);
		}
		unread_chapters.sort(background.customSort);
		read_chapters.sort(background.customSort).reverse();
		
		//construct row element with manga & website name properties,   
		let dom_manga = document.createElement("div");
		dom_manga.manga_name = name;
		dom_manga.website_name = manga.website_name;
		dom_manga.reading_status = unread_chapters[0] ? "unread" : "read";
		dom_manga.update_state = manga["update"];
		dom_manga.last_updated = manga["last_updated"];
		dom_manga.last_updated_test = new Date(manga["last_updated"]);
		dom_manga.classList.add("list_line", "visible");
		//displaying the manga name 
		let dom_manga_text = document.createElement("div");
		dom_manga_text.classList.add("list_cell");
		dom_manga_text.title = name;
		//add text to the name
		let dom_name_node = document.createElement("span");
		dom_name_node.classList.add("name_text");
		let dom_name_text_node = document.createTextNode(name);
		dom_name_node.appendChild(dom_name_text_node);
		dom_manga_text.appendChild(dom_name_node);
		dom_manga.appendChild(dom_manga_text);
		
		//and date of last update
		let dom_last_updated_node = document.createElement("div");
		dom_last_updated_node.classList.add("last_updated", "list_cell", "align_right");
		dom_last_updated_node.title = "last updated on :";
		let day = new Date(dom_manga.last_updated).getDate() < 10 ? "0"+ new Date(dom_manga.last_updated).getDate() : new Date(dom_manga.last_updated).getDate();
		let month = (new Date(dom_manga.last_updated).getMonth()+1) < 10 ? "0"+ (new Date(dom_manga.last_updated).getMonth()+1) : (new Date(dom_manga.last_updated).getMonth()+1);
		let year = new Date(dom_manga.last_updated).getFullYear().toString().substring(2);
		let last_updated_text_node = document.createTextNode(day +"/"+ month +"/"+ year);
		dom_last_updated_node.appendChild(last_updated_text_node);
		dom_manga.appendChild(dom_last_updated_node);

		//and number of unread chapters
		let dom_unread_number_node = document.createElement("div");
		dom_unread_number_node.classList.add("unread_number", "list_cell", "align_right", unread_chapters.length ? "red_text" : "green_text");
		let unread_number_text_node = document.createTextNode(" ("+unread_chapters.length+")");
		dom_unread_number_node.appendChild(unread_number_text_node);
		dom_manga.appendChild(dom_unread_number_node);
		
		//and the sorted chapter list (unread first, then read)
		let dom_select_td = document.createElement("div");
		dom_select_td.classList.add("list_cell");
		let dom_select = document.createElement("select");
		dom_select.classList.add("chapters_select", unread_chapters.length?"unread_chapter":"read_chapter");
		//update background when selected option changes
		dom_select.addEventListener("change", function(e){
			e.target.classList.remove("unread_chapter", "read_chapter");
			e.target.classList.add(e.target.options[e.target.selectedIndex].classList);
		});
		
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
		
		//button to read chapter selected from the list. button needs listener to (1) call background function to reconstruct url, and (2) open link in new tab
		let dom_read_button_td = document.createElement("div");
		dom_read_button_td.classList.add("list_cell");
		dom_read_button_td.title = "open this chapter in a new tab";
		let dom_read_button = document.createElement("img");
		dom_read_button.classList.add("icons");
		dom_read_button.src = "../icons/read.svg"
		dom_read_button.addEventListener("click", async function(e){	
			let my_manga = e.target.parentElement.parentElement;
			let manga_url = await background.reconstructChapterURL(my_manga.manga_name, my_manga.getElementsByClassName("chapters_select")[0].options[my_manga.getElementsByClassName("chapters_select")[0].selectedIndex].value); 
			//TODO - find a wait to wait for the new tab to be fully loaded before calling createMangasList()
			await browser.tabs.create({url:manga_url, active:false});
			if (!preferences["performance_mode"]) createMangasList();
		});
		dom_read_button_td.appendChild(dom_read_button);
		dom_manga.appendChild(dom_read_button_td);

		//and a button to delete the manga from the list
		let dom_delete_button_td = document.createElement("div");
		dom_delete_button_td.classList.add("list_cell", "left");
		dom_delete_button_td.title = "delete this manga from your list";
		let dom_delete_button = document.createElement("img");
		dom_delete_button.classList.add("icons");
		dom_delete_button.src = "../icons/trash.svg"
		dom_delete_button.addEventListener("click", async function(e){	
			let my_manga = e.target.parentElement.parentElement;
			let delete_modal_list = [];
			
			//creating modal title
			let title = "you're about to delete the following mangas :";
			//creating modal body
			let list_line = document.createElement("div");
			list_line.manga_name = my_manga.manga_name;
			list_line.delete = true;
			list_line.classList.add("modal_list_line", "delete_modal_list_line");
			
			let dom_name_node = document.createElement("span");
			dom_name_node.classList.add("name_text");
			dom_name_node.title = my_manga.manga_name;
			let dom_name_text_node = document.createTextNode(name);
			dom_name_node.appendChild(dom_name_text_node);
			list_line.appendChild(dom_name_node);
			
			let dom_delete_toggle = document.createElement("img");
			dom_delete_toggle.classList.add("icons", "right");
			dom_delete_toggle.src = "../icons/yes.svg";
			list_line.appendChild(dom_delete_toggle);

			list_line.addEventListener("click", (e)=>{
				e.stopPropagation();
				list_line.delete = ! list_line.delete;
				list_line.getElementsByTagName("img")[0].src = "../icons/" + (list_line.delete?"yes":"no") + ".svg";
			});
			delete_modal_list.push(list_line);
			//creating modal confirmation
			let onAgree = async function (e) {
				e.stopPropagation();
				let list = document.getElementById("modal_content");
				let mangas = [];
				for (let i in list.children) {
					if (list.children.hasOwnProperty(i) && list.children[i].delete) mangas.push(list.children[i].manga_name);
				}
				hideModal();
				if (mangas != []) {
					await background.deleteMangas(mangas);
					createMangasList();
				}
				document.getElementById("modal_agree").removeEventListener('click', onAgree);
			};
			
			revealModal(title, delete_modal_list, onAgree);
		});
		dom_delete_button_td.appendChild(dom_delete_button);
		dom_manga.appendChild(dom_delete_button_td);
		
		//button to update now
		let dom_update_button_td = document.createElement("div");
		dom_update_button_td.classList.add("list_cell", "right");
		dom_update_button_td.title = "update (only) this manga now.\nignores the 'no update' tag!";
		let dom_update_button = document.createElement("img");
		dom_update_button.update_state = manga["update"];
		dom_update_button.classList.add("icons");
		dom_update_button.src = "../icons/update.svg";
		dom_update_button.addEventListener("click", async function(e){	
			let my_manga = e.target.parentElement.parentElement;
			await background.updateMangasList([my_manga.manga_name], true);
			createMangasList();
		});
		dom_update_button_td.appendChild(dom_update_button);
		dom_manga.appendChild(dom_update_button_td);

		//and a button to toggle updating of a manga
		let dom_update_toggle_button_td = document.createElement("div");
		dom_update_toggle_button_td.classList.add("list_cell", "right");
		dom_update_toggle_button_td.title = "do / don't update this manga with the rest of the list";
		let dom_update_toggle_button = document.createElement("img");
		dom_update_toggle_button.classList.add("icons");
		dom_update_toggle_button.src = "../icons/update_"+dom_manga.update_state+".svg";
		dom_update_toggle_button.addEventListener("click", async function(e){	
			let my_manga = e.target.parentElement.parentElement;
			my_manga.update_state = !my_manga.update_state;
			await background.setMangaUpdate(my_manga.manga_name, my_manga.update_state);
			dom_update_toggle_button.src = "../icons/update_"+my_manga.update_state+".svg";
		});
		dom_update_toggle_button_td.appendChild(dom_update_toggle_button);
		dom_manga.appendChild(dom_update_toggle_button_td);

		//and a button to mark all chapters as read
		let dom_read_all_button_td = document.createElement("div");
		dom_read_all_button_td.classList.add("list_cell", "right");
		dom_read_all_button_td.title = "mark all chapters as \"read\"";
		let dom_read_all_button = document.createElement("img");
		dom_read_all_button.classList.add("icons");
		dom_read_all_button.src = "../icons/read_all.svg";
		dom_read_all_button.addEventListener("click", async function(e){	
			let my_manga = e.target.parentElement.parentElement;
			let chapters_list = my_manga.getElementsByClassName("chapters_select")[0];
		
			for (let index in chapters_list.options) {
				if (chapters_list.options.hasOwnProperty(index) && chapters_list.options[index].classList.contains("unread_chapter")){
					let manga_url = await background.reconstructChapterURL(my_manga.manga_name, chapters_list.options[index].value); 
					await background.readMangaChapter({"target" : "background", "read" : manga_url});
					chapters_list[index].classList.remove("unread_chapter");
					chapters_list[index].classList.add("read_chapter");
				} else break;
			}
			
			createMangasList();
		});
		dom_read_all_button_td.appendChild(dom_read_all_button);
		dom_manga.appendChild(dom_read_all_button_td);

		//option to register websites on which to follow this manga
		let dom_register_website_cell = document.createElement("div");
		dom_register_website_cell.classList.add("list_cell", "right");
		dom_register_website_cell.title = "choose the websites on which to update/read this manga";
		let dom_register_website = document.createElement("select");
		dom_register_website.classList.add("websites_select");
		//add registered websites list as options to the select
		let dom_option_title = document.createElement("option");
		dom_option_title_text = document.createTextNode("add/remove websites");
		dom_option_title.appendChild(dom_option_title_text);
		dom_register_website.appendChild(dom_option_title);

		dom_manga.websites = ";";
		for (let website_name in background.mangas_list[name].registered_websites){
			let dom_option = document.createElement("option");
			let dom_option_text = document.createTextNode(website_name);
			dom_option.appendChild(dom_option_text);
			dom_option.setAttribute("disabled", "disabled");
			if (website_name == mangas[name]["website_name"]) dom_option.selected = "selected";
			dom_register_website.appendChild(dom_option);
			dom_manga.websites = dom_manga.websites + website_name + ";"; //add the website name to the websites property of the manga dom element to filter on
		}
		if (dom_register_website.options.length == 1) {
			//add add warning if it is not followed on any website
			let dom_option = document.createElement("option");
			let dom_option_text = document.createTextNode("warning : not followed on any site");
			dom_option.appendChild(dom_option_text);
			dom_option.setAttribute("disabled", "disabled");
			dom_option.selected = "selected";
			dom_register_website.appendChild(dom_option);
		}
		dom_register_website_cell.appendChild(dom_register_website);
		dom_manga.appendChild(dom_register_website_cell);

		//update registered websites when selected option changes
		dom_register_website.addEventListener("change", async function(e){  
			let my_manga = e.target.parentElement.parentElement;

			//creating modal title
			let title = "follow ["+my_manga.manga_name+"] on :";
			//creating modal body
			let results = [];
			for (let website_name in background.websites_list) {
				if (background.websites_list.hasOwnProperty(website_name) && ! background.websites_list[website_name]["unsupported"]) {
					let list_line = document.createElement("div");
					list_line.classList.add("modal_list_line", "website_modal_list_line");
					list_line.website_name = website_name;
					list_line.preferred = background.mangas_list[my_manga.manga_name]["website_name"] == website_name ? true : false;
					list_line.registered = background.mangas_list[my_manga.manga_name]["registered_websites"][website_name] ? true : false;
					
					let title = document.createElement("h2");

					let favorite = document.createElement("img");
					favorite.classList.add("icons", "favorite");
					favorite.src = list_line.preferred ? "../icons/favorite.svg" : "../icons/unfavorite.svg";
					//eventlistener on click to set this site as favorite and mark the others as normal
					favorite.addEventListener("click", (e) => {
						if (!list_line.registered) {
							var clicker = list_line.getElementsByClassName("name_text")[0];
							var event = new Event('click', {
								'bubbles': false,
								'cancelable': true
							});
							clicker.dispatchEvent(event);
						}
						let already_favorite = list_line.preferred;
						let modal_content = document.getElementById("modal_content");
						let lines = modal_content.getElementsByClassName("website_modal_list_line");
						for (let i = 0; i < lines.length; i++) {
							lines[i].preferred = false;
							lines[i].getElementsByClassName("favorite")[0].src = "../icons/unfavorite.svg";
						}
						list_line.preferred = ! already_favorite;
						favorite.src = list_line.preferred ? "../icons/favorite.svg" : "../icons/unfavorite.svg";
					});
					title.appendChild(favorite);

					let toggleRegistered = async function (event) {
						event.stopPropagation();
						let website = event.target.parentElement.parentElement;
						let links_list = website.getElementsByClassName("links_list")[0];
						if (website.registered) {
							while (links_list.firstChild) {links_list.removeChild(links_list.firstChild);}
							links_list.classList.add("hidden");
							website.registered = false;
						} else {
							links_list.classList.remove("hidden");
							links_list.innerText = "	 searching, please wait...";
							let links = await background.websites_list[website_name].searchFor(my_manga.manga_name);
							links_list.innerText = "";
							let already_checked = false;
							for (let name in links) {
								if (links.hasOwnProperty(name)) {
									let manga_name = await background.getMangaName(links[name]);
									if (manga_name != "notAManga") {
										let container = document.createElement("div");
										let radioInput = document.createElement("input");
										radioInput.setAttribute("type", "radio");
										radioInput.setAttribute("name", website_name);
										!already_checked ? (radioInput.setAttribute("checked", "checked"), already_checked = true) : false;
										radioInput.setAttribute("id", website_name+links[name]);
										radioInput.link = links[name];
										container.appendChild(radioInput);
	
										let link = document.createElement("a");
										link.href = links[name];
										link.target = "_blank";
										link.innerText = manga_name;
										container.appendChild(link);
										links_list.appendChild(container);
									}
								}
							}
							website.registered = true;
						}
						website.getElementsByClassName("registered")[0].src = website.registered ? "../icons/yes.svg" : "../icons/no.svg";
					}

					let name = document.createElement("span");
					name.classList.add("name_text");
					name.innerText = website_name;
					//eventlistener on click to set toggle this site as registered
					name.addEventListener("click", toggleRegistered);
					title.appendChild(name);

					let registered = document.createElement("img");
					registered.classList.add("icons", "registered");
					registered.src = list_line.registered ? "../icons/yes.svg" : "../icons/no.svg";
					//eventlistener on click to set toggle this site as registered
					registered.addEventListener("click", toggleRegistered);
					title.appendChild(registered);

					list_line.appendChild(title);

					let links_list = document.createElement("div");
					links_list.classList.add("links_list");
					
					if (list_line.registered) {
						let container = document.createElement("div");
						let radioInput = document.createElement("input");
						radioInput.setAttribute("type", "radio");
						radioInput.setAttribute("name", website_name);
						radioInput.setAttribute("checked", "checked");
						radioInput.setAttribute("id", website_name+background.mangas_list[my_manga.manga_name]["registered_websites"][website_name]);
						radioInput.link = background.mangas_list[my_manga.manga_name]["registered_websites"][website_name];
						container.appendChild(radioInput);

						let label = document.createElement("label");
						label.htmlFor = website_name+background.mangas_list[my_manga.manga_name]["registered_websites"][website_name];
						label.innerText = await background.getMangaName(background.mangas_list[my_manga.manga_name]["registered_websites"][website_name]) + " ";
						let link = document.createElement("a");
						link.href = background.mangas_list[my_manga.manga_name]["registered_websites"][website_name];
						link.target = "_blank";
						link.innerText = "(link)";
						label.appendChild(link);
						container.appendChild(label);
						links_list.appendChild(container);
					} else {
						links_list.classList.add("hidden");
					}
					list_line.appendChild(links_list);
					results.push(list_line);
				}
			}
			//creating modal confirmation
			let onAgree = async function (e) {
				e.stopPropagation();
				let list = document.getElementById("modal_content");
				let websites = {};
				let preferred = "";
		
				for (let i in list.children) {
					if (list.children.hasOwnProperty(i)){
						if (list.children[i].preferred) preferred = list.children[i].website_name;
						if (list.children[i].registered) websites[list.children[i].website_name] = list.children[i].querySelector("input[name="+list.children[i].website_name+"]:checked").link;
					}
				}
				hideModal();
				await background.setPreferredWebsite(my_manga.manga_name, preferred);
				if (websites != {}) {
					await background.registerWebsites(my_manga.manga_name, websites);
					createMangasList();
				}
				document.getElementById("modal_agree").removeEventListener('click', onAgree);
			};
			revealModal(title, results, onAgree);
		});

		//option to assign tags to the manga
		let dom_choose_tags_cell = document.createElement("div");
		dom_choose_tags_cell.classList.add("list_cell", "right");
		dom_choose_tags_cell.title = "add or remove tags for this manga";
		let dom_choose_tags = document.createElement("select");
		dom_choose_tags.classList.add("websites_select");
		//add tags list as options for the select
		let dom_tags_option_title = document.createElement("option");
		dom_tags_option_title_text = document.createTextNode("add/remove tags");
		dom_tags_option_title.appendChild(dom_tags_option_title_text);
		dom_choose_tags.appendChild(dom_tags_option_title);

		dom_manga.tags = "";
		if (Object.keys(background.mangas_list[name].tags).length == 0) {
			//if no tags are found, create dummy option to say so
			let dom_option = document.createElement("option");
			let dom_option_text = document.createTextNode("no tag found");
			dom_option.appendChild(dom_option_text);
			dom_option.setAttribute("disabled", "disabled");
			dom_option.selected = "selected";
			dom_choose_tags.appendChild(dom_option);
		} else {
			//otherwise, create an option for each tag
		   let ordered_tags = Object.keys(background.mangas_list[name].tags).sort(background.sortAlphaNum).reduce((r, k) => (r[k] = background.mangas_list[name].tags[k], r), {});
			for (let tag_name in ordered_tags){
				let dom_option = document.createElement("option");
				let dom_option_text = document.createTextNode(tag_name);
				dom_option.appendChild(dom_option_text);
				dom_option.setAttribute("disabled", "disabled");
				dom_option.selected = "selected";
				dom_choose_tags.appendChild(dom_option);
				dom_manga.tags = dom_manga.tags + tag_name; //add the tag name to the tags property of the manga dom element to filter on
			}
		}
		dom_choose_tags_cell.appendChild(dom_choose_tags);
		dom_manga.appendChild(dom_choose_tags_cell);

		//update tags list when selected option changes
		dom_choose_tags.addEventListener("change", async function(e){  
			let my_manga = e.target.parentElement.parentElement;

			//creating modal title
			let title = "add tags to ["+my_manga.manga_name+"] :";
			//creating modal body
			let results = [];
			let every_tag = {};
			for (let manga in background.mangas_list) {
				if (background.mangas_list.hasOwnProperty(manga)) {
					for (let tag_name in background.mangas_list[manga]["tags"]) {
						if (background.mangas_list[manga]["tags"].hasOwnProperty(tag_name)) {
							every_tag[tag_name] = tag_name;
						}
					}
				}
			}
			let ordered_tags = Object.keys(every_tag).sort(background.sortAlphaNum).reduce((r, k) => (r[k] = every_tag[k], r), {});
			for (let tag_name in ordered_tags) {
				if (every_tag.hasOwnProperty(tag_name)) {
					let tag = document.createElement("div");
					tag.classList.add("modal_list_line", "website_modal_list_line");
					tag.tag_name = tag_name;
					tag.registered = background.mangas_list[my_manga.manga_name]["tags"][tag_name] ? true : false;
					
					tag.addEventListener("click", (e)=>{
						e.stopPropagation();
						tag.registered = ! tag.registered;
						tag.getElementsByTagName("img")[0].src = "../icons/" + (tag.registered?"yes":"no") + ".svg";
					});

					let name = document.createElement("span");
					name.classList.add("name_text");
					name.innerText = tag_name;
					tag.appendChild(name);

					let registered = document.createElement("img");
					registered.classList.add("icons", "registered");
					registered.src = tag.registered ? "../icons/yes.svg" : "../icons/no.svg";
					tag.appendChild(registered);
					
					results.push(tag);
				}
			}
			let create_tag = document.createElement("input");
			create_tag.type = "search";
			create_tag.placeholder = "create a new tag...";
			create_tag.title = "type you new tag here and press [enter].";
			create_tag.addEventListener("change", (event)=>{
				event.stopPropagation();
				let tag_name = event.target.value;
				if (tag_name != "") {
					let already_exist = false;
					let list = document.getElementById("modal_content");
					
					for (let i in list.children) {
						if (list.children.hasOwnProperty(i) && list.children[i].tag_name == tag_name){
							already_exist = true;
						}
					}
					if (!already_exist) {
						let tag = document.createElement("div");
						tag.classList.add("modal_list_line", "tags_modal_list_line");
						tag.tag_name = tag_name;
						tag.registered = true;
						
						tag.addEventListener("click", (e)=>{
							e.stopPropagation();
							tag.registered = ! tag.registered;
							tag.getElementsByTagName("img")[0].src = "../icons/" + (tag.registered?"yes":"no") + ".svg";
						});
	
						let name = document.createElement("span");
						name.classList.add("name_text");
						name.innerText = tag_name;
						tag.appendChild(name);
	
						let registered = document.createElement("img");
						registered.classList.add("icons");
						registered.src = tag.registered ? "../icons/yes.svg" : "../icons/no.svg";
						tag.appendChild(registered);
						
						list.insertBefore(tag, event.target);
					}
				}
			});
			results.push(create_tag);
			//creating modal confirmation
			let onAgree = async function (e) {
				e.stopPropagation();
				let list = document.getElementById("modal_content");
				let tags = {};
		
				for (let i in list.children) {
					if (list.children.hasOwnProperty(i) && list.children[i].tag_name && list.children[i].registered){
						tags[list.children[i].tag_name] = list.children[i].tag_name;
					}
				}
				hideModal();
				if (tags != {}) {
					await background.registerTags(my_manga.manga_name, tags);
					createMangasList();
				}
				document.getElementById("modal_agree").removeEventListener('click', onAgree);
			};
			revealModal(title, results, onAgree);
		});

		//add manga to the unread array or to the read array
		if (unread_chapters.length)
			unread_mangas.push(dom_manga);
		else read_mangas.push(dom_manga);
	}

	//add the unread mangas to the list
	for (let dom_manga in unread_mangas){
		dom_mangas_list.appendChild(unread_mangas[dom_manga]);
	}
	//then add the read mangas to the list
	for (let dom_manga in read_mangas){
		dom_mangas_list.appendChild(read_mangas[dom_manga]);
	}

	//get back to scroll position
	document.getElementById("list_container").scrollTo(0, scrollmemory);

	filterList();
}

createMangasList();



//filter the list
async function filterList() {
	var list = document.getElementById("list").children;
	let filter_field = document.getElementById("filter_list").value.toLowerCase();
	let filter_unread = document.getElementById("unread_filter").filter_out;
	let filter_already_read = document.getElementById("already_read_filter").filter_out;
	let filter_tags = document.getElementById("tags_filter").value;
	let filter_websites = document.getElementById("websites_filter").value;
	//filter the list
	for (let manga in list) {
		if (list.hasOwnProperty(manga)) {
			let is_visible = 
				!(list[manga].manga_name.includes(filter_field)) ? false
				: list[manga].reading_status == "unread" && filter_unread ? false
				: list[manga].reading_status == "read" && filter_already_read ? false
				: filter_tags != "see all tags" && !(list[manga].tags.includes(filter_tags)) ? false
				: filter_websites != "see all websites" && !(list[manga].websites.includes(";" + filter_websites + ";")) ? false
			: true;
			is_visible ? (list[manga].classList.remove("hidden"), list[manga].classList.add("visible")) 
				: (list[manga].classList.add("hidden"), list[manga].classList.remove("visible"));
		}
	}
	//focus the filter field if not on android (to avoid wasting half the screen on the virtual keyboard)
	let platformInfo = await browser.runtime.getPlatformInfo();
	platformInfo.os != "android" ? document.getElementById("filter_list").focus() : false;
}
//filter the list when user types something
document.getElementById("filter_list").addEventListener("keyup", async (e) => {
	filterList();
});

//clear the filter
document.getElementById("filter_clear").addEventListener("click", async (e) => {
	var filter = document.getElementById("filter_list");
	filter.value = "";
	var event = new Event('keyup', {
		'bubbles': true,
		'cancelable': true
	});
	filter.dispatchEvent(event);
});



//filter unread mangas
document.getElementById("unread_filter").addEventListener("click", async (e) => {
	e.target.filter_out = ! e.target.filter_out;
	e.target.classList.toggle("selected");
	
	filterList();
});
//initialize unread_filter
function initializeUnreadFilter() {
	document.getElementById("unread_filter").filter_out = false;
	document.getElementById("unread_filter").classList.add("selected");
} 
initializeUnreadFilter();



//filter read mangas
document.getElementById("already_read_filter").addEventListener("click", async (e) => {
	e.target.filter_out = ! e.target.filter_out;
	e.target.classList.toggle("selected");
	
	filterList();
});
//initialize read_filter
function initializeReadFilter() {
	document.getElementById("already_read_filter").filter_out = false;
	document.getElementById("already_read_filter").classList.add("selected");
} 
initializeReadFilter();



//filter on tags
document.getElementById("tags_filter").addEventListener("change", async (e) => {	
	filterList();
});
//initialize tags_filter
function initializeTagsFilter() {
	let tags_filter = document.getElementById("tags_filter");
	let tags = {};
	for (let manga in background.mangas_list) {
		if (background.mangas_list.hasOwnProperty(manga)) {
			for (let tag in background.mangas_list[manga]["tags"]) {
				if (background.mangas_list[manga]["tags"].hasOwnProperty(tag))
					tags[tag] = tag;
			}
		}
	}
	let ordered_tags = Object.keys(tags).sort(background.sortAlphaNum).reduce((r, k) => (r[k] = tags[k], r), {});
	for (let tag in ordered_tags) {
		if (ordered_tags.hasOwnProperty(tag)) {
			let dom_option = document.createElement("option");
			let dom_option_text = document.createTextNode(tag);
			dom_option.appendChild(dom_option_text);
			tags_filter.appendChild(dom_option);
		}
	}
} 
initializeTagsFilter();



//filter on websites
document.getElementById("websites_filter").addEventListener("change", async (e) => {	
	filterList();
});
//initialize websites_filter
function initializeWebsitesFilter() {
	let websites_filter = document.getElementById("websites_filter");
	let websites = {};
	for (let website in background.websites_list) {
		if (background.websites_list.hasOwnProperty(website) && !(background.websites_list[website]["unsupported"] == "total")) {
			websites[website] = website;
		}
	}
	let ordered_websites = Object.keys(websites).sort(background.sortAlphaNum).reduce((r, k) => (r[k] = websites[k], r), {});
	for (let website in ordered_websites) {
		if (ordered_websites.hasOwnProperty(website)) {
			let dom_option = document.createElement("option");
			let dom_option_text = document.createTextNode(website);
			dom_option.appendChild(dom_option_text);
			websites_filter.appendChild(dom_option);
		}
	}
} 
initializeWebsitesFilter();

///////////////////////////////////////

//[apply to all visible mangas] actions
//read all visible mangas
document.getElementById("list_read_icon").addEventListener("click", async (e) => {
	let visible_list = document.getElementById("list").getElementsByClassName("visible");
	for (let manga in visible_list) {
		if (visible_list.hasOwnProperty(manga)) {
			let my_manga = visible_list[manga];
			let manga_url = await background.reconstructChapterURL(my_manga.manga_name, my_manga.getElementsByClassName("chapters_select")[0].options[my_manga.getElementsByClassName("chapters_select")[0].selectedIndex].value); 
			await browser.tabs.create({url:manga_url, active:false});
		}
	}
	createMangasList();
});



//update all visible mangas
document.getElementById("list_update_icon").addEventListener("click", async (e) => {
	let visible_list = document.getElementById("list").getElementsByClassName("visible");
	let update_list = [];
	for (let manga in visible_list) {
		if (visible_list.hasOwnProperty(manga)) {
			let my_manga = visible_list[manga];
			update_list.push(my_manga.manga_name);
		}
	}
	await background.updateMangasList(update_list, false);
	createMangasList();
});



//mark all chapters as "read" for all visible mangas
document.getElementById("list_read_all_icon").addEventListener("click", async (e) => {
	let visible_list = document.getElementById("list").getElementsByClassName("visible");
	let promised_results = [];

	for (let manga in visible_list) {
		if (visible_list.hasOwnProperty(manga)) {
			let my_manga = visible_list[manga];
			let chapters_list = my_manga.getElementsByClassName("chapters_select")[0];
			
			for (let index in chapters_list.options) {
				if (chapters_list.options.hasOwnProperty(index) && chapters_list.options[index].classList.contains("unread_chapter")){
					let manga_url = await background.reconstructChapterURL(my_manga.manga_name, chapters_list.options[index].value); 
					promised_results.push(background.readMangaChapter({"target" : "background", "read" : manga_url}));
				} else break;
			}
		}
	}
	Promise.all(promised_results).then((result) => {
		createMangasList();
	});
});



//toggle "update with the rest of the list" option for all visible mangas
document.getElementById("list_update_toggle_icon").addEventListener("click", async (e) => {
	let visible_list = document.getElementById("list").getElementsByClassName("visible");

	for (let manga in visible_list) {
		if (visible_list.hasOwnProperty(manga)) {
			let my_manga = visible_list[manga];
			await background.setMangaUpdate(my_manga.manga_name, !my_manga.update_state);
		}
	}
	createMangasList();
});



//delete all visible mangas
document.getElementById("list_delete_icon").addEventListener("click", async (e) => {
	let visible_list = document.getElementById("list").getElementsByClassName("visible");
	let delete_modal_list = [];

	//creating modal title
	let title = "you're about to delete the following mangas :";
	//creating modal body
	for (let manga in visible_list) {
		if (visible_list.hasOwnProperty(manga)) {
			let my_manga = visible_list[manga];

			let list_line = document.createElement("div");
			list_line.manga_name = my_manga.manga_name;
			list_line.delete = true;
			list_line.classList.add("modal_list_line", "delete_modal_list_line");
			
			let dom_name_node = document.createElement("span");
			dom_name_node.classList.add("list_cell", "name_text");
			dom_name_node.title = my_manga.manga_name;
			let dom_name_text_node = document.createTextNode(my_manga.manga_name);
			dom_name_node.appendChild(dom_name_text_node);
			list_line.appendChild(dom_name_node);
			
			let dom_delete_toggle = document.createElement("img");
			dom_delete_toggle.classList.add("icons", "right");
			dom_delete_toggle.src = "../icons/yes.svg";
			list_line.appendChild(dom_delete_toggle);

			list_line.addEventListener("click", (e)=>{
				e.stopPropagation();
				list_line.delete = ! list_line.delete;
				list_line.getElementsByTagName("img")[0].src = "../icons/" + (list_line.delete?"yes":"no") + ".svg";
			});

			delete_modal_list.push(list_line);
		}
	}
	//creating modal confirm
	let onAgree = async function (e) {
		e.stopPropagation();
		let list = document.getElementById("modal_content");
		let mangas = [];

		for (let i in list.children) {
			if (list.children.hasOwnProperty(i) && list.children[i].delete) mangas.push(list.children[i].manga_name);
		}
		hideModal();
		if (mangas != []) {
			await background.deleteMangas(mangas);
			createMangasList();
		}
		document.getElementById("modal_agree").removeEventListener('click', onAgree);
	};
	
	revealModal(title, delete_modal_list, onAgree);
});



//manually refresh the list
document.getElementById("refresh_list").addEventListener("click", async (e) => {
	createMangasList();
});
