var websites_list = {mangahere:"www.mangahere.cc/manga/",
					mangafox:"fanfox.net/manga/",
					mangatown:"www.mangatown.com/manga/",
					};

window.addEventListener("load", readMangaChapter);

function readMangaChapter() {
	
	var url = window.location.href;
	var is_placeholder = true;
	var website = "notAMangaWebsite";
	//check if it's in the list and return the name
	for (let x in websites_list) {
		if (url.indexOf(websites_list[x]) >= 0){
			website = websites_list[x];
		}
	}
	
	//TO-DO check if the chapter is available or if it's a placeholder page
	switch (website) {
		case websites_list["mangahere"]:
			is_placeholder = document.getElementsByClassName("mangaread_error")[0] || document.getElementsByClassName("error_404")[0] ? true : false;
			break;
		case websites_list["mangafox"]:
			//if using mangaloader script in tampermonkey
			if (document.getElementsByClassName("ml-images")[0]){
				//mangaloader placeholder test
				is_placeholder = document.getElementsByClassName("ml-chap-nav")[0].getElementsByClassName("ml-chap-next")[0] ? false : true;
			} else {
				//regular placeholder test
				is_placeholder = document.getElementsByClassName("prev_page")[0] ? false : true;
			}
			break;
		case websites_list["mangatown"]:
			//if using mangaloader script in tampermonkey
			if (document.getElementsByClassName("ml-images")[0]){
				//mangaloader placeholder test
				is_placeholder = document.getElementsByClassName("ml-chap-nav")[0].getElementsByClassName("ml-chap-next")[0] ? false : true;
			} else {
				//regular placeholder test
				is_placeholder = document.getElementById("viewer") ? false : true;
			}
			break;
	}
	
	if (!is_placeholder)
		browser.runtime.sendMessage({"target":"background","url": url});
	
}

//listen to background script, and create navigation buttons
browser.runtime.onMessage.addListener(createNavigation);

function createNavigation(message) {
	
	if  (!(document.getElementById("mangasubscriber_nav_bar")) && message.target == "content" && message.navigation){
		var navigation = message.navigation;
		let nav_bar = document.createElement("div");
		nav_bar.setAttribute("id", "mangasubscriber_nav_bar");

		if (navigation.first_chapter != "") {
			let first_button = document.createElement("div");
			first_button.innerText = "first chapter";
			first_button.setAttribute("class", "left_nav_button button");
			first_button.addEventListener("click", 
											function(e){document.location.href = navigation.first_chapter;
														}
											, false);
			nav_bar.appendChild(first_button);
		}
		if (navigation.previous_chapter != "") {
			let previous_button = document.createElement("div");
			previous_button.innerText = "previous chapter";
			previous_button.setAttribute("class", "left_nav_button button");
			previous_button.addEventListener("click", 
											function(e){document.location.href = navigation.previous_chapter;
														}
											, false);
			nav_bar.appendChild(previous_button);
		}
		//append last_chapter before previous_chapter to avoid them getting inverted due to css : float:right
		if (navigation.last_chapter != "") {
			let last_button = document.createElement("div");
			last_button.innerText = "last chapter";
			last_button.setAttribute("class", "right_nav_button button");
			last_button.addEventListener("click", 
											function(e){document.location.href = navigation.last_chapter;
														}
											, false);
			nav_bar.appendChild(last_button);
		}
		if (navigation.next_chapter != "") {
			let next_button = document.createElement("div");
			next_button.innerText = "next chapter";
			next_button.setAttribute("class", "right_nav_button button");
			next_button.addEventListener("click", 
											function(e){document.location.href = navigation.next_chapter;
														}
											, false);
			nav_bar.appendChild(next_button);
		}
		document.body.appendChild(nav_bar);
	

		// Create an observer to fire readMangaCHapter when the body is modified (which recreates the nav_bar if it has been destroyed by MangaLoader)
		var config = { attributes: false, childList: true, subtree: false };
		var observer = new MutationObserver(readMangaChapter);
		observer.observe(document.body, config);
	}
}