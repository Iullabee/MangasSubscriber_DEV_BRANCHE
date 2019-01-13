var mangas_list = {};
var mangassubscriber_prefs = {};

var websites_list = {
	"mangahere":{name:"mangahere",
				url:"mangahere.cc/manga/",
				getMangaName: function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[0]);
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + url.split("/manga/")[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					//get rid of website and manga name,
					var url_tail = url.split("/manga/")[1];
					url_tail = url_tail.substring(url_tail.indexOf("/")+1);
					if (mangassubscriber_prefs["unified_chapter_numbers"]) {
						//if there is a chapter number
						if (url_tail.split("c")[1]){
							//get rid of volume and page number
							url_tail = url_tail.split("c")[1].split("/")[0];
						}
						while (url_tail.charAt(0) == "0" && url_tail.split(".")[0].length > 1) {
							url_tail = url_tail.slice(1);
						}
					} else {
						//if there is a chapter number and a page number
						if (url_tail.split("c")[1] && (url_tail.split("c")[1].split("/")[1] || url_tail.charAt(url_tail.length -1) == "/")){
							//get rid of page number
							url_tail = url_tail.substring(0, url_tail.lastIndexOf("/"));
						}
					}
					return url_tail;
				},
				getAllChapters: async function (manga_url){
					var chapters_list = {};
					var source = "truc";
					var parser = new DOMParser();

					try {
						//get manga's home page
						source = await getSource(manga_url);
					} catch (error) {
						throw error;
					}

					//extract the chapter list
					var doc = parser.parseFromString(source, "text/html");
					let list = doc.querySelectorAll(".detail_list a.color_0077");
					if (! list[0]) throw new Error(" can't find "+this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i = 0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href.replace("moz-extension", "https")};
							}
						}
					}
					return chapters_list;
				},
				searchFor: async function (manga_name){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					var results = {};
					var source = "truc";
					var index = manga_name.split(" ").length;
					var parser = new DOMParser();

					while (Object.keys(results).length == 0 && index > 0) {
						//get search page results for manga_name	
						let source_url = "https://mangahere.cc/search.php?name="+manga_name.replace(/ /g, "+");
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("a.manga_info");
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							if (list.hasOwnProperty(i))
								results[list[i].innerText] = list[i].href.replace("moz-extension", "https");
						}
						if (Object.keys(results).length) break; // if results are found, break and return
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
						
						//if no results, wait before trying again with shortened name to avoid triggering mangahere's antispam answer
						await new Promise( (resolve, reject) => {setTimeout(() => {resolve(true);}, 5500)});
					}
					return results;
				}
				
	},
	"fanfox":{name:"fanfox",
				url:"fanfox.net/manga/",
				getMangaName: function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[0]);
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + url.split("/manga/")[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					//get rid of website and manga name,
					var url_tail = url.split("/manga/")[1];
					url_tail = url_tail.substring(url_tail.indexOf("/")+1);
					if (mangassubscriber_prefs["unified_chapter_numbers"]) {
						//if there is a chapter number
						if (url_tail.split("c")[1]){
							//get rid of volume and page number
							url_tail = url_tail.split("c")[1].split("/")[0];
						}
						while (url_tail.charAt(0) == "0" && url_tail.split(".")[0].length > 1) {
							url_tail = url_tail.slice(1);
						}
					} else {
						//if there is a chapter number and a page number
						if (url_tail.split("c")[1] && (url_tail.split("c")[1].split("/")[1] || url_tail.charAt(url_tail.length -1) == "/")){
							//get rid of page number
							url_tail = url_tail.substring(0, url_tail.lastIndexOf("/"));
						}
					}
					return url_tail;
				},
				getAllChapters: async function (manga_url){
					var chapters_list = {};
					var source = "truc";
					var parser = new DOMParser();

					try {
						//get manga's home page
						source = await getSource(manga_url);
					} catch (error) {
						throw error;
					}

					//extract the chapter list
					var doc = parser.parseFromString(source, "text/html");
					//TODO - handle case where manga is marked mature (need the user to enable them at least once manually on the site)
					let list = doc.querySelectorAll("#chapterlist li a");
					if (! list[0]) throw new Error(" can't find "+this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i = 0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(this.url + list[i].href.split("/manga/")[1]); //since fanfox uses relative path for urls in chapters list, we need to get replace the extension ID at the start of the url
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + list[i].href.split("manga/")[1]};
							}
						}
					}
					return chapters_list;
				},
				searchFor: async function (manga_name){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					let results = {};
					var source = "truc";
					let index = manga_name.split(" ").length;
					var parser = new DOMParser();

					while (Object.keys(results).length == 0 && index > 0) {
						//get search page results for manga_name
						let source_url = "https://fanfox.net/search?title="+manga_name.replace(/ /g, "+");
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
	
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("ul.manga-list-4-list li .manga-list-4-item-title a");
						for (let i in list) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							if (list.hasOwnProperty(i))
								results[list[i].title] = "https://" + this.url + list[i].href.split("manga/")[1];
						}

						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	},
	"mangatown":{name:"mangatown",
				url:"mangatown.com/manga/",
				getMangaName: function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[0]);
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + url.split("/manga/")[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					//get rid of website and manga name,
					var url_tail = url.split("/manga/")[1]
					url_tail = url_tail.substring(url_tail.indexOf("/")+1);
					if (mangassubscriber_prefs["unified_chapter_numbers"]) {
						//if there is a chapter number
						if (url_tail.split("c")[1]){
							//get rid of volume and page number
							url_tail = url_tail.split("c")[1].split("/")[0];
						}
						while (url_tail.charAt(0) == "0" && url_tail.split(".")[0].length > 1) {
							url_tail = url_tail.slice(1);
						}
					} else {
						//if there is a chapter number and a page number
						if (url_tail.split("c")[1] && (url_tail.split("c")[1].split("/")[1] || url_tail.charAt(url_tail.length -1) == "/")){
							//get rid of page number
							url_tail = url_tail.substring(0, url_tail.lastIndexOf("/"));
						}
					}
					return url_tail;
				},
				getAllChapters: async function (manga_url){
					var chapters_list = {};
					var source = "truc";
					var parser = new DOMParser();

					try {
						//get manga's home page
						source = await getSource(manga_url);
					} catch (error) {
						throw error;
					}

					//extract the chapter list
					var doc = parser.parseFromString(source, "text/html");
					let list = doc.querySelectorAll(".chapter_list a");
					if (! list[0]) throw new Error(" can't find "+this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i = 0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + list[i].href.split("manga/")[1]};
							}
						}
					}
					return chapters_list;
				},
				searchFor: async function (manga_name){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					let results = {};
					var source = "truc";
					let index = manga_name.split(" ").length;
					var parser = new DOMParser();

					while (Object.keys(results).length == 0 && index > 0) {
						//get search page results for manga_name
						source_url = "https://mangatown.com/search.php?name="+manga_name;
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
						
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("ul.manga_pic_list li a.manga_cover");
						for (let i in list) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							if (list.hasOwnProperty(i))
								results[list[i].title] = "https://" + this.url + list[i].href.split("manga/")[1];
						}
						if (Object.keys(results).length) break; // if results are found, break and return
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
						
						//if no results, wait before trying again with shortened name to avoid triggering mangatown's antispam answer
						await new Promise( (resolve, reject) => {setTimeout(() => {resolve(true);}, 5500)});
					}
					return results;
				}
	},
	"readmangatoday":{name:"readmangatoday",
				url:"readmng.com/",
				getMangaName: function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[0]);
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + url.split(this.url)[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					//get rid of website and manga name,
					var url_tail = url.split(this.url)[1]
					url_tail = url_tail.substring(url_tail.indexOf("/")+1);
					
					if (mangassubscriber_prefs["unified_chapter_numbers"]) {
						url_tail = url_tail.split("/")[0];
						while (url_tail.charAt(0) == "0" && url_tail.split(".")[0].length > 1) {
							url_tail = url_tail.slice(1);
						}
					} else {
						//if there is a page number
						if (url_tail.split("/")[1] || url_tail.charAt(url_tail.length -1) == "/"){
							//get rid of page number
							url_tail = url_tail.substring(0, url_tail.lastIndexOf("/"));
						}
						//buffering chapter number with zeros and a c
						while (url_tail.split(".")[0].length < 3) {
							url_tail = "0" + url_tail;
						}
						url_tail = "c" + url_tail;
					}
					return url_tail;
				},
				getAllChapters: async function (manga_url){
					var chapters_list = {};
					var source = "truc";
					var parser = new DOMParser();

					try {
						//get manga's home page
						source = await getSource(manga_url);
					} catch (error) {
						throw error;
					}

					//extract the chapter list
					var doc = parser.parseFromString(source, "text/html");
					let list = doc.querySelectorAll(".chp_lst a");
					if (! list[0]) throw new Error(" can't find "+this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i = 0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href.replace("moz-extension", "http")};
							}
						}
					}
					return chapters_list;
				},
				searchFor: async function (manga_name){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					let results = {};
					let index = manga_name.split(" ").length;
					var parser = new DOMParser();

					while (Object.keys(results).length == 0 && index > 0) {
						let response = await fetch(`https://www.readmng.com/search`, {
							method: "POST",
							headers: {"Content-Type": "application/x-www-form-urlencoded"},
							body: ("query" + '=' + manga_name.replace(/ /g, "+")),
						});
						let doc = parser.parseFromString(await response.text(), "text/html");
						
						let list = doc.querySelectorAll(".style-list .box .title h2 a");
						for (let i in list) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							if (list.hasOwnProperty(i))
								results[list[i].title] = list[i].href.replace("moz-extension", "http");
						}
						
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	}
};

function cleanMangaName (name) {
	return name.replace(/[\W_]+/g , " ");
}

function sortAlphaNum(a, b) {
    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9.]/g;
    var aA = a.replace(reA, "");
    var bA = b.replace(reA, "");
    if (aA === bA) {
        var aN = parseFloat(a.replace(reN, ""));
        var bN = parseFloat(b.replace(reN, ""));
        return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
        return aA > bA ? 1 : -1;
    }
}

function sortNum (a, b) {
	a == "" ? a = Number.MIN_SAFE_INTEGER : false;
	b == "" ? b = Number.MIN_SAFE_INTEGER : false;
	return parseFloat(a) === parseFloat(b) ? 0 : parseFloat(a) > parseFloat(b) ? 1 : -1;
}

function customSort(a, b) {
	return mangassubscriber_prefs["unified_chapter_numbers"] ? sortNum(a, b) : sortAlphaNum(a, b);
}

async function getSource(source_url){
	var response = "";
	var data = "";

	try{
		response = await fetch(source_url);
		data = await response.text();
	} catch (error){
		throw error;
	}
	
	return data;
}



//follow a manga
async function followManga(url){
	//populate manga values	
	var manga = {};
	var website = getWebsite(url);
	var manga_name = website.getMangaName(url);
	let manga_root_url = website.getMangaRootURL(url);
	var chapters_list = await website.getAllChapters(manga_root_url);
	var current_chapter = await website.getCurrentChapter(url);
	let mangas_list = await getMangasList();
	await getMangasSubscriberPrefs(); //making sure preferences are initialized for customSort()
	
	for (let chapter_number in chapters_list){
		chapters_list[chapter_number]["status"] = customSort(chapter_number, current_chapter) <= 0 ? "read" : "unread";
	}
	let registered_websites = {};
	registered_websites[website.name] = manga_root_url;

	manga = {"website_name":website.name,
			"update":true,	
			"chapters_list":chapters_list,
			"registered_websites":registered_websites,
			"tags":{}};

	//add manga to storage
	mangas_list[manga_name] = manga;
	await browser.storage.local.set({"mangas_list" : mangas_list});
	//update badge
	setBadgeNumber();
	return ;
}



//update the manga list
async function updateMangasList(mangas_selection, ignore_no_update){
	if (browser.browserAction.setBadgeText)
		browser.browserAction.setBadgeText({"text" : "UPD"});
	let updated_chapters_list = {};
	let check_all_sites = await getCheckAllSites();
	let to_update_list = {};
	let update_promises = [];
	let mangas_list = await getMangasList();

	if (mangas_selection) {
		for (var i in mangas_selection) {
			if (mangas_selection.hasOwnProperty(i)) {
				to_update_list[mangas_selection[i]] = mangas_list[mangas_selection[i]];
			}
		}
	} else to_update_list = mangas_list;

	//for each manga that is set to update, get an updated chapters list
	for (let manga in to_update_list) {
		if (mangas_list[manga]["update"] || ignore_no_update){
			updated_chapters_list[manga] = {};
			for (let website_name in mangas_list[manga]["registered_websites"]){
				if (check_all_sites || website_name == mangas_list[manga].website_name) {
					browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"updating" , "details":""}}); //warning the popup
					updated_chapters_list[manga][website_name] = websites_list[website_name].getAllChapters(mangas_list[manga]["registered_websites"][website_name]); //A PROMISE IS RETURNED HERE
					updated_chapters_list[manga][website_name].then(async function(updated_chapters){
																		browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"completed" , "details":""}}); //warning the popup
																		for (let chapter in updated_chapters){
																			if (!mangas_list[manga].chapters_list[chapter]){
																				//if not on the list, update with what we have
																				mangas_list[manga].chapters_list[chapter] = {"status":"unread" , "url":updated_chapters[chapter]["url"]};
																			} else if (getWebsite(updated_chapters[chapter]["url"]).name == mangas_list[manga].website_name) {
																				//otherwise, if it's on the list AND it's the prefered website, update the url
																				mangas_list[manga].chapters_list[chapter] = {"status":mangas_list[manga].chapters_list[chapter]["status"] , "url":updated_chapters[chapter]["url"]};
																			}
																		}
																		browser.storage.local.set({"mangas_list" : mangas_list});
																	},
																	function(error){
																		browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"errors" , "details":"couldn't get source : "+error}}); //warning the popup
																	}
					);
					update_promises.push(updated_chapters_list[manga][website_name]);
				}
			} 
		}
	}
	//map a catch() clause to the promises so that promise.all.then triggers even if some promises are rejected
	Promise.all(update_promises.map(p => p.catch(() => undefined))).then( () => {
		setBadgeNumber();
	});
	return;
}



//listen to content script, and set manga chapter as "read"
browser.runtime.onMessage.addListener(readMangaChapter);

async function readMangaChapter(message, sender) {
	if  (message.target == "background" && message.url){
		var url = message.url;
		var manga_name = getMangaName(url);
		var current_chapter = await getCurrentChapter(url);

		let mangas_list = await getMangasList();
		await getMangasSubscriberPrefs(); //making sure preferences are initialized for customSort()

		if (mangas_list[manga_name]) {
			if (current_chapter) {
				if (mangas_list[manga_name].chapters_list[current_chapter] && mangas_list[manga_name].chapters_list[current_chapter]["status"] != "read") {
					mangas_list[manga_name].chapters_list[current_chapter]["status"] = "read";
					browser.storage.local.set({"mangas_list" : mangas_list});
				} else if (! mangas_list[manga_name].chapters_list[current_chapter]) {
					mangas_list[manga_name].chapters_list[current_chapter] = {"status" : "read", "url" : url};
					browser.storage.local.set({"mangas_list" : mangas_list});
				}
				if (sender){
					//send navigation info to content_script
					let chapters_numbers = Object.keys(mangas_list[manga_name].chapters_list).sort(customSort);
					let index = chapters_numbers.indexOf(current_chapter);
					if (index >= 0) {
						//first chapter (if current chapter isn't the first)
						let first_chapter = index > 0 ? mangas_list[manga_name].chapters_list[chapters_numbers[0]].url : "";
						//previous chapter (if there is at least one chapter between first and current)
						let previous_chapter = index > 1 ? mangas_list[manga_name].chapters_list[chapters_numbers[index-1]].url : "";
						//next chapter (if there is at least one chapter between current and last)
						let next_chapter = index < (chapters_numbers.length-2) ? mangas_list[manga_name].chapters_list[chapters_numbers[index+1]].url : "";
						//last chapter (if current chapter isn't the last)
						let last_chapter = index < (chapters_numbers.length-1) ? mangas_list[manga_name].chapters_list[chapters_numbers[chapters_numbers.length-1]].url : "";
						
						if (await getNavigationBar())
							browser.tabs.sendMessage(sender.tab.id, {"target":"content","navigation": {"first_chapter":first_chapter,"previous_chapter":previous_chapter,"next_chapter":next_chapter,"last_chapter":last_chapter}});
					}
				}
			}
		}
		//update badge
		setBadgeNumber();
	}
}



//delete mangas from an array of names
async function deleteMangas(mangas){
	let mangas_list = await getMangasList();

	//remove mangas from list
	for (let name in mangas) {
		delete mangas_list[mangas[name]];
	}
	//update storage
	await browser.storage.local.set({"mangas_list" : mangas_list});
	//update badge
	setBadgeNumber();
	return ;
}



//export mangas list to json file
async function exportMangasList(){
	var list = {"MangasSubscriberBackUp":await browser.storage.local.get()};
	var blob = new Blob([JSON.stringify(list, null, 2)], {type : 'application/json'});

	await browser.downloads.download({"url": URL.createObjectURL(blob), "filename": "MangaListBackUp.json", "saveAs":true});
	return;
}

//export mangas list online to pastebin
async function exportMangasListOnline(){
	var list = {"MangasSubscriberBackUp":await browser.storage.local.get()};
	var text_data = JSON.stringify(list, null, 2);
	//dev key 4f96e913faf4b10d77bd99304939270a
	//user key ff7e23814c18e02ebe244dc3aa70b020

	var request = new XMLHttpRequest();

	request.onreadystatechange = async function() {
		if (this.readyState == 4 && this.status == 200) {
			let key = this.responseText.split("https://pastebin.com/")[1];
			await browser.storage.sync.set({"sync_list_key":key});
		}
	};

	request.open("POST", "https://pastebin.com/api/api_post.php", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.send("api_dev_key=4f96e913faf4b10d77bd99304939270a&api_user_key=ff7e23814c18e02ebe244dc3aa70b020&api_option=paste&api_paste_private=0&api_paste_expire_date=N&api_paste_format=json&api_paste_code="+text_data);
	
	return;
}



//import mangas list from json
async function importMangasList(parsed_json){
	var back_up = parsed_json["MangasSubscriberBackUp"];
	if (back_up && back_up["MangasSubscriberPrefs"] && back_up["MangasSubscriberPrefs"]["DB_version"] == "2.0.0"){
		await browser.storage.local.clear();
		await browser.storage.local.set(back_up);
		//update badge
		setBadgeNumber();
	}
	return ;
}



async function registerWebsites(manga_name, websites){
	for (let name in websites) {
		if (websites.hasOwnProperty(name)) {
			let website = getWebsite(websites[name]);
			websites[name] = website.getMangaRootURL(websites[name]);
		}
	}

	let mangas_list = await getMangasList();
	mangas_list[manga_name]["registered_websites"] = Object.assign({}, websites); //websites is a reference to an object created in the popup, it becomes DeadObject when the popup is destroyed, Object.assign creates a copy to avoid that.
	browser.storage.local.set({"mangas_list" : mangas_list});
	return;
}


async function registerTags(manga_name, tags){
	let mangas_list = await getMangasList();

	mangas_list[manga_name]["tags"] = Object.assign({}, tags); //tags is a reference to an object created in the popup, it becomes DeadObject when the popup is destroyed, Object.assign creates a copy to avoid that.
	browser.storage.local.set({"mangas_list" : mangas_list});
	return;
}



async function setMangaUpdate(manga_name, update_state) {
	let mangas_list = await getMangasList();

	mangas_list[manga_name]["update"] = update_state;
	browser.storage.local.set({"mangas_list":mangas_list});
	return;
}



async function getMangasList(){
	if (Object.keys(mangas_list).length == 0)
		mangas_list = (await browser.storage.local.get("mangas_list"))["mangas_list"];
	return mangas_list;
}

async function getMangasSubscriberPrefs(){
	if (Object.keys(mangassubscriber_prefs).length == 0)
		mangassubscriber_prefs = (await browser.storage.local.get("MangasSubscriberPrefs"))["MangasSubscriberPrefs"];
	return mangassubscriber_prefs;
}



async function getSyncListURL() {
	return (await browser.storage.sync.get("sync_list_key"))["sync_list_key"];
}



async function toggleUnifiedChapterNumbers(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	let mangas_list = await getMangasList();

	mangassubscriber_prefs["unified_chapter_numbers"] = ! mangassubscriber_prefs["unified_chapter_numbers"];
	await browser.storage.local.set({"MangasSubscriberPrefs" : mangassubscriber_prefs});

	for (let i in mangas_list) {
		if (mangas_list.hasOwnProperty(i)) {
			let url = "";
			for (let a in mangas_list[i]["chapters_list"]) {
				if (mangas_list[i]["chapters_list"].hasOwnProperty(a)) {
					url = mangas_list[i]["chapters_list"][a]["url"];
					if (url == "") delete mangas_list[i]["chapters_list"][a];
					else {
						let new_chapter_number = await getWebsite(url).getCurrentChapter(url); 
						if (new_chapter_number != a) {
							mangas_list[i]["chapters_list"][new_chapter_number] = mangas_list[i]["chapters_list"][a];
							delete mangas_list[i]["chapters_list"][a];
						}
					}
				}
			}
		}
	}
	await browser.storage.local.set({"mangas_list" : mangas_list});
	return;
}

async function getUnifiedChapterNumbers(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["unified_chapter_numbers"];
}



async function toggleCheckAllSites(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangassubscriber_prefs["check_all_sites"] = ! mangassubscriber_prefs["check_all_sites"];
	await browser.storage.local.set({"MangasSubscriberPrefs" : mangassubscriber_prefs});
	return;
}

async function getCheckAllSites(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["check_all_sites"];
}



async function toggleNavigationBar(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangassubscriber_prefs["navigation_bar"] = ! mangassubscriber_prefs["navigation_bar"];
	await browser.storage.local.set({"MangasSubscriberPrefs" : mangassubscriber_prefs});
	return;
}

async function getNavigationBar(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["navigation_bar"];
}



//sets website_name as preferred website for manga_name
async function setPreferredWebsite(manga_name, website_name){
	let mangas_list = await getMangasList();
	mangas_list[manga_name]["website_name"] = website_name;
	browser.storage.local.set({"mangas_list":mangas_list});
	return;
}



var isAutoUpdating;
//set auto update interval and start the auto update
async function setAutoUpdate(interval){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	let hours = 3600000;
	mangassubscriber_prefs["auto_update"] = interval;
	await browser.storage.local.set({"MangasSubscriberPrefs":mangassubscriber_prefs});
	
	clearTimeout(isAutoUpdating);
	if (interval > 0) isAutoUpdating = setTimeout(autoUpdate, interval*hours);
}

//get auto update interval
async function getAutoUpdateInterval(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["auto_update"];
}

//auto update
async function autoUpdate(){
	let hours = 3600000;
	let interval = await getAutoUpdateInterval();
	
	clearTimeout(isAutoUpdating);
	if (interval > 0) {
		updateMangasList();
		isAutoUpdating = setTimeout(autoUpdate, interval*hours);
	}
}



//set limit on search results
async function setSearchLimit(limit){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangassubscriber_prefs["search_limit"] = limit;
	await browser.storage.local.set({"MangasSubscriberPrefs":mangassubscriber_prefs});
}

//get search results limit
async function getSearchLimit(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["search_limit"];
}



//check website url against websites list
function getWebsite(url){
	
	//check if it's in the list and return the name
	for (x in websites_list) {
		if (url.indexOf(websites_list[x].url) >= 0){
			return websites_list[x];
		}
	}
	//if not in the list
	//return "notAMangaWebsite";
	return "notAMangaWebsite";
}

//get manga name from the url corresponding website
function getMangaName(url){
	var website = getWebsite(url);
	if (website != "notAMangaWebsite")
		return website.getMangaName(url);
	else return "notAManga";
}

//get the chapter currently being read
async function getCurrentChapter(url){
	var website = getWebsite(url);
	if (website != "notAMangaWebsite")
		return await website.getCurrentChapter(url);
	else return "";
}

//get the list of all chapters for a given manga
async function getAllChapters(manga_name, website_name){
	var website = getWebsite(website_name);
	if (website != "notAMangaWebsite")
		return await website.getAllChapters(manga_name);
	else return "NotAChapter"; 
}

//get the chapter url
async function reconstructChapterURL(manga_name, chapter){
	let mangas_list = await getMangasList();
	return mangas_list[manga_name]["chapters_list"][chapter]["url"];
}

//check if the manga is followed
async function isMangaFollowed(manga_name){
	let mangas_list = await getMangasList();
	var check = mangas_list[manga_name];
	
	return check ? true : false;
}



//set/update the number of unread mangas on the badge
async function setBadgeNumber() {
	var number = 0;
	let mangas_list = await getMangasList();
	
	for (let name in mangas_list){
		let updated = false;
		for (let index in mangas_list[name]["chapters_list"]) {
			if (mangas_list[name]["chapters_list"][index]["status"] == "unread") {
				updated = true;
				break;
			}
		}
		if (updated)
			number++;
	}
	
	if (browser.browserAction.setBadgeText)
		browser.browserAction.setBadgeText({"text" : number > 0 ? number.toString() : ""});
}



async function install(){
	let prefs = await getMangasSubscriberPrefs();
	let list = await getMangasList();
	let to_log = null;

	if (!prefs || Object.keys(prefs).length == 0) {prefs = {"DB_version":"2.0.0", "unified_chapter_numbers":true, "check_all_sites":false, "navigation_bar":true, "auto_update":0, "search_limit":5}; mangassubscriber_prefs = prefs;}
	if (!list || Object.keys(list).length == 0) {list = {}; mangas_list = list;}

	to_log = {"MangasSubscriberPrefs": prefs, "mangas_list": list};
	
	await browser.storage.local.clear();
	await browser.storage.local.set(to_log);
		
	return;
}
install().then(async () => {
	mangas_list = await getMangasList();
	mangassubscriber_prefs = await getMangasSubscriberPrefs();
	//update badge
	setBadgeNumber();
});
