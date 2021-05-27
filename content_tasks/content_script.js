var websites_list = {"mangahere":"mangahere.cc/manga/",
					"mangafox":"fanfox.net/manga/",
					"mangatown":"mangatown.com/manga/",
					"webtoons":"webtoons.com/",
					"mangakakalot":"mangakakalot.com/",
					"manganelo":"manganelo.com/",
					"manganato":"readmanganato.com/",
					"isekaiscan":"isekaiscan.com/",
					"mangadex":"mangadex.org/"
					};

//fix fanfox annoying urls
(function fanfoxURLFix() {
	if (this.location.href.indexOf("fanfox.net//") >= 0)
		this.location.href = this.location.href.replace("fanfox.net//", "fanfox.net/");
})();
//fix manganato annoying urls
(function manganatoURLFix() {
	if (this.location.href.indexOf("manganato.com/") >= 0 && this.location.href.indexOf("readmanganato.com/") == -1 && this.location.href.split("manganato.com/")[1])
		this.location.href = this.location.href.replace("manganato.com/", "readmanganato.com/");
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
				is_placeholder = document.querySelector("img.reader-main-img") || document.querySelector("img#image") ? false : true;
				break;
			case "mangafox":
				is_placeholder = document.querySelector("img.reader-main-img") || document.querySelector("img#image") ? false : true;
				break;
			case "mangatown":
				is_placeholder = document.querySelector("#viewer.read_img") || document.querySelector("img#image") ? false : true;
				break;
			case "webtoons":
				is_placeholder = document.querySelector("img._images") || document.querySelector("img._checkVisible") ? false : true;
				break;
			case "mangakakalot":
				{let elem = document.querySelector("#vungdoc img");
				let source_url = elem ? elem.src : null;
				is_placeholder = source_url && ! source_url.includes("/nextchap.png") ? false : true; //no mobile site
				break;}
			case "manganelo":
				is_placeholder = document.querySelector(".container-chapter-reader img") ? false : true; //no mobile site
				break;
			case "manganato":
				is_placeholder = document.querySelector(".container-chapter-reader img") ? false : true; //no mobile site
				break;
			case "isekaiscan":
				is_placeholder = document.querySelector(".reading-content") ? false : true; //no mobile site
				break;
			case "mangadex":
				is_placeholder = document.querySelector(".reader-image-wrapper") ? false : true; //no mobile site
				break;
		}
	}
	
	if (!is_placeholder) {
		browser.runtime.sendMessage({"target":"background","read": url});
	} else {
		retryReading();
	}
}

var retry_number = 0;
var max_retry = 5;
function retryReading () {
	retry_number++;
	if (retry_number < max_retry)	setTimeout(readMangaChapter, 3000)
}

//listen to background script, and create navigation buttons
browser.runtime.onMessage.addListener(createNavigation);

function createNavigation(message) {
	if  (!(document.getElementById("mangassubscriber_nav_bar")) && message.target == "content" && message.navigation){
		let container = document.createElement("div");
		while (document.body.childNodes.length > 0) {
			container.appendChild(document.body.childNodes[0]);
		}
		while (document.body.classList.length > 0) {
			container.classList.add(document.body.classList.item(0)); 
			document.body.classList.remove(document.body.classList.item(0))
		}
		container.classList.add("navigation_bar_spacer");
		document.body.insertBefore(container, document.body.firstChild);
		
		var navigation = message.navigation;
		let nav_bar = document.createElement("div");
		nav_bar.setAttribute("id", "mangassubscriber_nav_bar");

		if (navigation.first_chapter != "") {
			let first_button = document.createElement("a");
			first_button.classList.add("left_nav_button", "mangassubscriber_button", "mangassubscriber_table");
			first_button.href = navigation.first_chapter.url;
			let first_button_link = document.createElement("div");
			first_button_link.classList.add("mangassubscriber_row");
			let first_button_arrow = document.createElement("img");
			first_button_arrow.classList.add("text_icons", "mangassubscriber_cell");
			first_button_arrow.src = browser.extension.getURL("../icons/arrow_left_double.svg");
			first_button_link.appendChild(first_button_arrow);
			let first_button_text_node = document.createElement("div");
			first_button_text_node.classList.add("mangassubscriber_cell");
			first_button_text_node.innerText = navigation.first_chapter.number;
			first_button_link.appendChild(first_button_text_node);
			first_button.appendChild(first_button_link);
			nav_bar.appendChild(first_button);
		}
		if (navigation.previous_chapter != "") {
			let previous_button = document.createElement("a");
			previous_button.classList.add("left_nav_button", "mangassubscriber_button", "mangassubscriber_table");
			previous_button.href = navigation.previous_chapter.url;
			let previous_button_link = document.createElement("div");
			previous_button_link.classList.add("mangassubscriber_row");
			let previous_button_arrow = document.createElement("img");
			previous_button_arrow.classList.add("text_icons", "mangassubscriber_cell");
			previous_button_arrow.src = browser.extension.getURL("../icons/arrow_left_single.svg");
			previous_button_link.appendChild(previous_button_arrow);
			let previous_button_text_node = document.createElement("div");
			previous_button_text_node.classList.add("mangassubscriber_cell");
			previous_button_text_node.innerText = navigation.previous_chapter.number;
			previous_button_link.appendChild(previous_button_text_node);
			previous_button.appendChild(previous_button_link);
			nav_bar.appendChild(previous_button);
		}
		//append last_chapter before next_chapter to avoid them getting inverted due to css : float:right
		if (navigation.last_chapter != "") {
			let last_button = document.createElement("a");
			last_button.classList.add("right_nav_button", "mangassubscriber_button", "mangassubscriber_table");
			last_button.href = navigation.last_chapter.url;
			let last_button_link = document.createElement("div");
			last_button_link.classList.add("mangassubscriber_row");
			let last_button_text_node = document.createElement("div");
			last_button_text_node.classList.add("mangassubscriber_cell");
			last_button_text_node.innerText = navigation.last_chapter.number;
			last_button_link.appendChild(last_button_text_node);
			let last_button_arrow = document.createElement("img");
			last_button_arrow.classList.add("text_icons", "mangassubscriber_cell");
			last_button_arrow.src = browser.extension.getURL("../icons/arrow_right_double.svg");
			last_button_link.appendChild(last_button_arrow);
			last_button.appendChild(last_button_link);
			nav_bar.appendChild(last_button);
		}
		if (navigation.next_chapter != "") {
			let next_button = document.createElement("a");
			next_button.classList.add("right_nav_button", "mangassubscriber_button", "mangassubscriber_table");
			next_button.href = navigation.next_chapter.url;
			let next_button_link = document.createElement("div");
			next_button_link.classList.add("mangassubscriber_row");
			let next_button_text_node = document.createElement("div");
			next_button_text_node.classList.add("mangassubscriber_cell");
			next_button_text_node.innerText = navigation.next_chapter.number;
			next_button_link.appendChild(next_button_text_node);
			let next_button_arrow = document.createElement("img");
			next_button_arrow.classList.add("text_icons", "mangassubscriber_cell");
			next_button_arrow.src = browser.extension.getURL("../icons/arrow_right_single.svg");
			next_button_link.appendChild(next_button_arrow);
			next_button.appendChild(next_button_link);
			nav_bar.appendChild(next_button);
		}

		let menu_wrapper = document.createElement("div");
		menu_wrapper.classList.add("centered");
		nav_bar.appendChild(menu_wrapper);

		let menu_button = document.createElement("div");
		menu_button.classList.add("mangassubscriber_button");
		let menu_button_link = document.createElement("span");
		menu_button_link.textContent = navigation.current_chapter;
		menu_button.appendChild(menu_button_link);
		menu_wrapper.appendChild(menu_button);

		if (navigation.unread_chapter != "") {
			let first_unread_button = document.createElement("a");
			first_unread_button.classList.add("mangassubscriber_hidden", "mangassubscriber_button");
			first_unread_button.href = navigation.unread_chapter.url;
			first_unread_button.innerText = "go to first unread chapter";
			menu_wrapper.appendChild(first_unread_button);
		}
		
		let mark_unread_button = document.createElement("div");
		mark_unread_button.classList.add("mangassubscriber_hidden", "mangassubscriber_button");
		mark_unread_button.addEventListener("click", () => {
			browser.runtime.sendMessage({"target":"background","unread": window.location.href});
		});
		let mark_unread_button_link = document.createElement("span");
		mark_unread_button_link.textContent = "mark chapter as not read";
		mark_unread_button.appendChild(mark_unread_button_link);
		menu_wrapper.appendChild(mark_unread_button);
		
		document.body.insertBefore(nav_bar, container);
	
		// Create an observer to fire readMangaCHapter when the body is modified (which recreates the nav_bar if it has been destroyed by MangaLoader)
		var config = { attributes: false, childList: true, subtree: true };
		var observer = new MutationObserver(readMangaChapter);
		observer.observe(document.body, config);
	}
}