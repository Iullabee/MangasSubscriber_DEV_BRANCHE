


var websites_list = {
	"mangahere":{name:"mangahere",
				url:"www.mangahere.cc/manga/",
				getMangaName: function (url){return url.split(this.url)[1].split("/")[0];
				},
				getCurrentChapter:  function (url){var manga_name =  this.getMangaName(url);
													//get rid of website and manga name,
													var url_tail = url.split(this.url+manga_name+"/")[1];
													//if there is a chapter number
													if (url_tail.split("c")[1]){
														//get rid of volume and page number
														url_tail = url_tail.split("c")[1].split("/")[0];
													}
													return url_tail;
				},
				getAllChapters: async function (manga_name){var chapters_list = {};
															var source = "truc";

															//get manga's home page
															var source_url = this.url + manga_name + "/";
															source = await getSource(source_url);

															//extract the chapter list :: href property  from elementsByClassName "color_0077"  from elementsByClassName "left"  from elementsByClassName "detail_list"
															var parser = new DOMParser();
															var doc = parser.parseFromString(source, "text/html");
															if (doc.getElementsByClassName("detail_list")[0]) {
																var list = doc.getElementsByClassName("detail_list")[0].getElementsByClassName("left");
																for (let i = 0; i<list.length; i++){
																	if(list[i].getElementsByClassName("color_0077")[0].href){
																		//get the url, get rid of the website and manga name (split(source_url)[1]), get rid of everything left before chapter number (split("c")[1]) and get rid of the last / (slice (0,-1))
																		let chapter_number = list[i].getElementsByClassName("color_0077")[0].href.split(source_url)[1].split("c")[1].slice(0,-1);
																		if (chapter_number)
																			chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].getElementsByClassName("color_0077")[0].href.replace("moz-extension", "http")};
																	}
																}
															} else throw new Error("Error - can't find "+manga_name+" on "+this.name);
															return chapters_list;
				}
	},
	"fanfox":{name:"fanfox",
				url:"fanfox.net/manga/",
				getMangaName: function (url){return url.split(this.url)[1].split("/")[0];
				},
				getCurrentChapter:  function (url){var manga_name =  this.getMangaName(url);
													//get rid of website and manga name,
													var url_tail = url.split(this.url+manga_name+"/")[1];
													//if there is a chapter number
													if (url_tail.split("c")[1]){
														//get rid of volume and page number
														url_tail = url_tail.split("c")[1].split("/")[0];
													}
													
													return url_tail;
				},
				getAllChapters: async function (manga_name){var chapters_list = {};
															var source = "truc";

															//get manga's home page
															var source_url = this.url + manga_name + "/";
															source = await getSource(source_url);

															//extract the chapter list :: href property  from elementsByClassName "tips"  from elementById "chapters"
															var parser = new DOMParser();
															var doc = parser.parseFromString(source, "text/html");
															if (doc.getElementById("chapters")) {
																var list = doc.getElementById("chapters").getElementsByClassName("tips");
																for (let i = 0; i<list.length; i++){
																	if(list[i].href){
																		var url_tail = list[i].href.split(source_url)[1];
																		//if the name is different on fanfox
																		if (!url_tail) {
																			let fanfox_manga_name = doc.head.innerText.split("\n\n\n\n")[1];
																			fanfox_manga_name = fanfox_manga_name.split(" Manga")[0].replace(/ /g, "_").toLowerCase();
																			let source_name = this.url+fanfox_manga_name+"/";
																			url_tail = list[i].href.split(source_name)[1];
																		}
																			
																		url_tail = url_tail.split("c")[1];

																		let chapter_number = "";
																		chapter_number = url_tail.split("/")[0];
																		
																		if (chapter_number)
																			chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href.replace("moz-extension", "http")};
																	} else throw new Error("Error - can't find "+manga_name+" on "+this.name);
																}
															}
															return chapters_list;
				}
	},
	"mangatown":{name:"mangatown",
				url:"www.mangatown.com/manga/",
				getMangaName: function (url){return url.split(this.url)[1].split("/")[0];
				},
				getCurrentChapter:  function (url){var manga_name =  this.getMangaName(url);
													//get rid of website and manga name,
													var url_tail = url.split(this.url+manga_name+"/")[1];
													//if there is a chapter number
													if (url_tail.split("c")[1]){
														//get rid of volume and page number
														url_tail = url_tail.split("c")[1].split("/")[0];
													}
													return url_tail;
				},
				getAllChapters: async function (manga_name){var chapters_list = {};
															var source = "truc";

															//get manga's home page
															var source_url = this.url + manga_name + "/";
															source = await getSource(source_url);

															//extract the chapter list :: href property  from elementsByTagName "a"  from elementsByClassName "chapter_list"
															var parser = new DOMParser();
															var doc = parser.parseFromString(source, "text/html");
															if (doc.getElementsByClassName("chapter_list")[0]) {
																var list = doc.getElementsByClassName("chapter_list")[0].getElementsByTagName("a");
																for (let i = 0; i<list.length; i++){
																	if(list[i].href){
																		//get the url, get rid of the website and manga name (split(source_url)[1]), get rid of everything left before chapter number (split("c")[1]) and get rid of the last / (slice (0,-1))
																		let chapter_number = list[i].href.split(source_url)[1].split("c")[1].slice(0,-1);
																		if (chapter_number)
																			chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href.replace("moz-extension", "http")};
																	}
																}
															} else throw new Error("Error - can't find "+manga_name+" on "+this.name);
															return chapters_list;
				}
	},
};


//listen to content script, and set manga chapter as "read"
browser.runtime.onMessage.addListener(readMangaChapter);

async function readMangaChapter(message, sender) {
	if  (message.target == "background" && message.url){
		var url = message.url;
		var manga = {};
		var manga_name = getMangaName(url);
		var current_chapter = getCurrentChapter(url);
		let to_log = await getMangasList();

		manga = to_log[manga_name];
		if (manga) {
			if (current_chapter) {
				if (manga.chapters_list[current_chapter]["status"] != "read") {
					manga.chapters_list[current_chapter] = {"status" : "read", "url" : url};
					to_log[manga_name] = manga;
					browser.storage.local.set({"mangas_list" : to_log});
				}
				if (sender){
					//send navigation info to content_script
					let chapters_numbers = Object.keys(manga.chapters_list).sort();
					let index = chapters_numbers.indexOf(current_chapter);
					if (index >= 0) {
						//first chapter (if current chapter isn't the first)
						let first_chapter = index > 0 ? manga.chapters_list[chapters_numbers[0]].url : "";
						//previous chapter (if there is at least one chapter between first and current)
						let previous_chapter = index > 1 ? manga.chapters_list[chapters_numbers[index-1]].url : "";
						//next chapter (if there is at least one chapter between current and last)
						let next_chapter = index < (chapters_numbers.length-2) ? manga.chapters_list[chapters_numbers[index+1]].url : "";
						//last chapter (if current chapter isn't the last)
						let last_chapter = index < (chapters_numbers.length-1) ? manga.chapters_list[chapters_numbers[chapters_numbers.length-1]].url : "";
						
						browser.tabs.sendMessage(sender.tab.id, {"target":"content","navigation": {"first_chapter":first_chapter,"previous_chapter":previous_chapter,"next_chapter":next_chapter,"last_chapter":last_chapter}});
					}
				}
			}
		}
		//update badge
		setBadgeNumber();
	}
}


//expport mangas list to json file
async function exportMangasList(){
	var list = {"MangaSubscriberBackUp":await browser.storage.local.get()};
	var blob = new Blob([JSON.stringify(list, null, 2)], {type : 'application/json'});

	await browser.downloads.download({"url": URL.createObjectURL(blob), "filename": "MangaListBackUp.json", "saveAs":true});
	return;
}

//import mangas list from json file
async function importMangasList(file, import_option){
	if (import_option == "replace")
		await browser.storage.local.clear();
	
	var reader = new FileReader();
    reader.onloadend = async function(e){var import_file = JSON.parse(e.target.result);
							var back_up = import_file["MangaSubscriberBackUp"];
							var stored_list = await getMangasList();
							if (back_up){
								//if merge, merge storage and import_list
								if (import_option == "merge"){
									//for each item in import_list, check if storage_list has same item, if it does, merge read chapters
									for (let manga_name in stored_list){
										if (back_up["mangas_list"][manga_name]){
											for (let chapter_number in stored_list[manga_name]["chapters_list"]){
												if (stored_list[manga_name]["chapters_list"][chapter_number]["status"] == "read")
													back_up["mangas_list"][manga_name]["chapters_list"][chapter_number] = stored_list[manga_name]["chapters_list"][chapter_number];
											}
										} else {
											back_up["mangas_list"][manga_name] = stored_list[manga_name];
										}
									}
								} else await browser.storage.local.clear();
								await browser.storage.local.set(back_up);
								updateMangasList();
							}
							return ;
						};
    reader.readAsText(file);
}

//update the manga list
async function updateMangasList(){
	browser.browserAction.setBadgeText({"text" : "UPD"});
	//fetch current list
	var mangas_list = await getMangasList();
	var updated_chapters_list = {};
	var check_all_sites = await getCheckAllSites();
	//for each manga that is set to update, get an updated chapters list
	for (let manga in mangas_list) {
		if (mangas_list[manga]["update"]){
			updated_chapters_list[manga] = {};
			for (let website_name in websites_list){
				if (check_all_sites || website_name == mangas_list[manga].website_name) {
					browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"updating" , "details":""}}); //warning the popup
					updated_chapters_list[manga][website_name] = websites_list[website_name].getAllChapters(manga); //A PROMISE IS RETURNED HERE
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
																		await browser.storage.local.set({"mangas_list" : mangas_list});
																		setBadgeNumber();
																	},
																	function(error){
																		browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"errors" , "details":"couldn't get source : "+error}}); //warning the popup
																	}
					);
				}
			} 
		}
	}

	return;
}









async function getMangasList(){
	return (await browser.storage.local.get("mangas_list"))["mangas_list"];
}

async function isMangaFollowed(manga_name){
	var check = (await getMangasList())[manga_name];
	
	return check ? true : false;
}

//follow a manga
async function followManga(url){
	//populate manga values	
	var manga = {};
	var website = getWebsite(url);
	var manga_name = website.getMangaName(url);
	var chapters_list = await website.getAllChapters(manga_name);
	var current_chapter = website.getCurrentChapter(url);
	
	for (let chapter_number in chapters_list){
		chapters_list[chapter_number]["status"] = chapter_number <= current_chapter ? "read" : "unread";
	}
	
	manga = {"website_name":website.name,
				"update":true,	
				"chapters_list":chapters_list};

	//add manga to storage
	var list = await getMangasList();
	list[manga_name] = manga;
	await browser.storage.local.set({"mangas_list" : list});
	//update badge
	setBadgeNumber();
	//update follow button
	return ;
}

//delete a manga
async function deleteManga(manga_name){
	//get list
	var list = await getMangasList();
	//remove manga from list
	delete list[manga_name];
	//update storage
	await browser.storage.local.set({"mangas_list" : list});
	//update badge
	setBadgeNumber();
	return ;
}

async function setMangaUpdate(manga_name, update_state) {
	var mangas_list = await getMangasList();
	mangas_list[manga_name]["update"] = update_state;
	await browser.storage.local.set({"mangas_list":mangas_list});
	return;
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

function getMangaName(url){
	var website = getWebsite(url);
	if (website != "notAMangaWebsite")
		return website.getMangaName(url);
	else return "notAManga";
}

//get the chapter currently being read
function getCurrentChapter(url){
	var website = getWebsite(url);
	if (website != "notAMangaWebsite")
		return website.getCurrentChapter(url);
	else return "";
}

//get the list of all chapters for a given manga
async function getAllChapters(manga_name, website_name){
	var website = getWebsite(website_name);
	if (website != "notAMangaWebsite")
		return await website.getAllChapters(manga_name);
	else return "NotAChapter"; 
}

async function reconstructChapterURL(manga_name, chapter){
	return (await getMangasList())[manga_name]["chapters_list"][chapter]["url"];
}


async function getSource(source_url){
	var response = "";
	var data = "";

	try{
		response = await fetch("http://"+source_url);
		data = await response.text();
	} catch (e){
		console.log(e);
	}
	
	return data;
}

async function setBadgeNumber() {
	var number = 0;
	var mangas = await getMangasList();
	
	for (let name in mangas){
		let updated = false;
		for (let index in mangas[name]["chapters_list"]) {
			if (mangas[name]["chapters_list"][index]["status"] == "unread") {
				updated = true;
				break;
			}
		}
		if (updated)
			number++;
	}
	number > 0 ? number = number.toString() : number = "";
	browser.browserAction.setBadgeText({"text" : number});
}

async function toggleCheckAllSites(){
	var prefs = (await browser.storage.local.get("MangaSubscriberPrefs"))["MangaSubscriberPrefs"];
	prefs["check_all_sites"] = !prefs["check_all_sites"];
	await browser.storage.local.set({"MangaSubscriberPrefs" : prefs});
	return;
}

async function getCheckAllSites(){
	var prefs = (await browser.storage.local.get("MangaSubscriberPrefs"))["MangaSubscriberPrefs"];
	return prefs["check_all_sites"];
}

async function db_update(){
	var prefs = (await browser.storage.local.get("MangaSubscriberPrefs"))["MangaSubscriberPrefs"];
	var to_log = null;

	if (!prefs){
		browser.browserAction.setBadgeText({"text" : "U"});
		//fetch current list
		var mangas_list = await browser.storage.local.get("mangas_list")["mangas_list"];
		
		for (let manga in mangas_list) {
			if (mangas_list[manga]["website_name"] == "http://fanfox.net/manga/"){
				mangas_list[manga]["website_name"] = "fanfox";	
			}
			if (mangas_list[manga]["website_name"] == "http://www.mangahere.cc/manga/"){
				mangas_list[manga]["website_name"] = "mangahere";	
			}
			if (mangas_list[manga]["website_name"] == "http://www.mangatown.com/manga/"){
				mangas_list[manga]["website_name"] = "mangatown";	
			}
			for (let index in mangas_list[manga]["chapters_list"]) {
				mangas_list[manga]["chapters_list"][index.split("c")[1]] = {"status":mangas_list[manga]["chapters_list"][index], "url":""};
				delete(mangas_list[manga]["chapters_list"][index]);
			}
		}
		to_log = {"MangaSubscriberPrefs": {"check_all_sites": false, "DB_version":"1.0.0"},
						"mangas_list":mangas_list};
	}
	
	if (to_log){
		await browser.storage.local.clear();
		await browser.storage.local.set(to_log);
		await updateMangasList();
		//update badge
		setBadgeNumber();
	}
	return;
}

//returns an object containing each manganame as a key, associated to its preferred website -- can't return just the preferred website for one manga and call it each time we need it, it takes too much time to do that for each manga in options_page
async function getPreferredWebsites(){
	let mangas_list = await getMangasList();
	let preferred_websites = {};
	for (let manga in mangas_list) {
		preferred_websites[manga] = mangas_list[manga]["website_name"];
	}
	return preferred_websites;
}

//sets website_name as preferred website for manga_name
async function setPreferredWebsite(manga_name, website_name){
	let mangas_list = await getMangasList();
	mangas_list[manga_name]["website_name"] = website_name;
	await browser.storage.local.set({"mangas_list":mangas_list});
}













db_update();
//update badge
setBadgeNumber();