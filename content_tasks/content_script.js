var websites_list = {mangahere:"https://www.mangahere.co/manga/"};

window.addEventListener("load", readMangaChapter);

function readMangaChapter() {
	
	
	//TO-DO check if the chapter if available or if it's a placeholder page
	var url = window.location.href;
	var is_placeholder = false;
	var website = "notAMangaWebsite";
	//check if it's in the list and return the name
	for (let x in websites_list) {
		if (url.indexOf(websites_list[x]) == 0){
			website = websites_list[x];
		}
	}
	
	switch (website) {
		case websites_list["mangahere"]:
			is_placeholder = document.getElementsByClassName("mangaread_error")[0];
			break;
	}
	
	if (!is_placeholder)
		browser.runtime.sendMessage({"url": url});
	
}