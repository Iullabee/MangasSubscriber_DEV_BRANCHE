function searchWebsitesFor () {
	if (document.getElementById("search_field").value == "") hideModal();
	else {
		let search = document.getElementById("search_field").value;
		//create modal title
		let title = "looking for ["+search+"] :";
		//create modal body
		let results = [];
		for (let website_name in background.websites_list) {
			if (background.websites_list.hasOwnProperty(website_name)) {
				let list_line = document.createElement("div");
				list_line.classList.add("modal_list_line", "search_modal_list_line");
				
				let toggleHidden = async function (event) {
					event.stopPropagation();
					let links_list = event.target.parentElement.getElementsByClassName("links_list")[0];
					links_list.classList.toggle("hidden");
				}

				let name = document.createElement("h2");
				name.classList.add("name_text");
				name.innerText = website_name;
				//eventlistener on click to set toggle this site as registered
				name.addEventListener("click", toggleHidden);
				list_line.appendChild(name);

				let links_list = document.createElement("div");
				links_list.classList.add("links_list");
				
				links_list.innerText = "searching, please wait...";
				background.websites_list[website_name].searchFor(search).then(async (links) => {
					links_list.innerText = "";
					for (let name in links) {
						if (links.hasOwnProperty(name)) {
							let manga_name = name;

							let container = document.createElement("div");
							container.classList.add("result_line");
							let link_container = document.createElement("div");
							link_container.classList.add("inline");
							let link = document.createElement("a");
							link.href = links[name];
							link.target = "_blank";
							link.innerText = manga_name;
							link.title = manga_name;
							link_container.appendChild(link);
							container.appendChild(link_container);

							let follow = document.createElement("img");
							follow.classList.add("icons", "text_icons", "cell");
							follow.name = "follow_button";
							if (await background.isMangaFollowed(manga_name)){
								follow.title = "already followed";
								follow.src = "../icons/followed.svg";
							} else {
								follow.title = "follow this manga";
								follow.src = "../icons/follow.svg";
							}
							follow.addEventListener("click", async (event) => {
								switch (event.target.title) {
									case "follow this manga" :
										event.target.title = "please wait";
										event.target.src = "../icons/dots.svg";
										var fail = await background.followManga(links[name]);
										if (!fail){
											event.target.title = "now following";
											event.target.src = "../icons/followed.svg";
											//mark manga with same name from other websites as followed
											let follow_buttons = document.getElementById("modal_content").querySelectorAll("[name=follow_button]");
											for (let i=0; i<follow_buttons.length; i++) {
												if (follow_buttons[i].parentElement.firstChild.firstChild.innerText == event.target.parentElement.firstChild.firstChild.innerText) {
													follow_buttons[i].title = "already followed";
													follow_buttons[i].src = "../icons/followed.svg";
												}
											}
										} else {
											event.target.title = "error, try again";
											event.target.src = "../icons/follow.svg";
											event.target.style.border = "2px solid red";
											setTimeout(() => {event.target.title = "follow this manga"; event.target.style.border = "";},3000);
										}
										break;
								}
							});
							container.appendChild(follow);
							links_list.appendChild(container);
						}
					}
				});
				
				list_line.appendChild(links_list);
				results.push(list_line);
			}
		}
		//no modal agree
		revealModal(title, results);
	}
}



//search the websites when user types something
document.getElementById("search_field").addEventListener("change", async (e) => {
	searchWebsitesFor();
});

//clear the search field
document.getElementById("search_field_clear").addEventListener("click", async (e) => {
	var filter = document.getElementById("search_field");
	filter.value = "";
});
