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