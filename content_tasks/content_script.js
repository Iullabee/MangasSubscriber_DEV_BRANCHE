var websites_list = {"mangahere":"mangahere.cc/manga/",
					"mangafox":"fanfox.net/manga/",
					"mangatown":"mangatown.com/manga/",
					"readmangatoday":"readmng.com/",
					};

//fix fanfox annoying urls
(function fanfoxURLFix() {
	if (this.location.href.indexOf("fanfox.net//") >= 0)
		this.location.href = this.location.href.replace("fanfox.net//", "fanfox.net/");
})();

window.addEventListener("load", readMangaChapter);
function readMangaChapter() {
	var url = window.location.href;
	var is_placeholder = true;
	var website = "notAMangaWebsite";
	//check if it's in the list and return the name
	for (let x in websites_list) {
		if (url.indexOf(websites_list[x]) >= 0){
			website = x;
		}
	}
	
	//check if the chapter is available or if it's a placeholder page
	//if using mangaloader script in tampermonkey
	if (document.getElementsByClassName("ml-images")[0]){
		is_placeholder = false;
	} else {
		switch (website) {
			case "mangahere":
				is_placeholder = document.querySelectorAll("#viewer.read_img")[0] ? false : true;
				break;
			case "mangafox":
				is_placeholder = document.querySelectorAll("img.loaded.reader-main-img")[0] ? false : true;
				break;
			case "mangatown":
				is_placeholder = document.querySelectorAll("#viewer.read_img")[0] ? false : true;
				break;
			case "readmangatoday":
				is_placeholder = document.querySelectorAll("#chapter_img")[0] ? false : true;
				break;
		}
	}
	
	if (!is_placeholder) {
		browser.runtime.sendMessage({"target":"background","url": url});
	}
}

//listen to background script, and create navigation buttons
browser.runtime.onMessage.addListener(createNavigation);

function createNavigation(message) {
	if  (!(document.getElementById("mangassubscriber_nav_bar")) && message.target == "content" && message.navigation){
		document.body.classList.add("navigation_bar_spacer");
		var navigation = message.navigation;
		let nav_bar = document.createElement("div");
		nav_bar.setAttribute("id", "mangassubscriber_nav_bar");

		if (navigation.first_chapter != "") {
			let first_button = document.createElement("div");
			let first_button_link = document.createElement("a");
			first_button_link.textContent = "first chapter";
			first_button.appendChild(first_button_link);
			first_button_link.href = navigation.first_chapter;
			first_button.setAttribute("class", "left_nav_button button");
			nav_bar.appendChild(first_button);
		}
		if (navigation.previous_chapter != "") {
			let previous_button = document.createElement("div");
			let previous_button_link = document.createElement("a");
			previous_button_link.textContent = "previous chapter";
			previous_button.appendChild(previous_button_link);
			previous_button_link.href = navigation.previous_chapter;
			previous_button.setAttribute("class", "left_nav_button button");
			nav_bar.appendChild(previous_button);
		}
		//append last_chapter before previous_chapter to avoid them getting inverted due to css : float:right
		if (navigation.last_chapter != "") {
			let last_button = document.createElement("div");
			let last_button_link = document.createElement("a");
			last_button_link.textContent = "last chapter";
			last_button_link.href = navigation.last_chapter;
			last_button.appendChild(last_button_link);
			last_button.setAttribute("class", "right_nav_button button");
			nav_bar.appendChild(last_button);
		}
		if (navigation.next_chapter != "") {
			let next_button = document.createElement("div");
			let next_button_link = document.createElement("a");
			next_button_link.textContent = "next chapter";
			next_button.appendChild(next_button_link);
			next_button_link.href = navigation.next_chapter;
			next_button.setAttribute("class", "right_nav_button button");
			nav_bar.appendChild(next_button);
		}
		document.body.appendChild(nav_bar);
	
		// Create an observer to fire readMangaCHapter when the body is modified (which recreates the nav_bar if it has been destroyed by MangaLoader)
		var config = { attributes: false, childList: true, subtree: false };
		var observer = new MutationObserver(readMangaChapter);
		observer.observe(document.body, config);
	}
}