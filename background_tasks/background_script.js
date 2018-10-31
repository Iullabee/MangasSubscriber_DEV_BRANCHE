


var websites_list = {
	"mangahere":{name:"mangahere",
				url:"www.mangahere.cc/manga/",
				getMangaName: function (url){return url.split(this.url)[1].split("/")[0];
				},
				getCurrentChapter:  function (url){var manga_name =  this.getMangaName(url);
													//get rid of website and manga name,
													var url_tail = url.split(this.url+manga_name+"/")[1];
													//and get rid of page number
													return url_tail.substring(0,url_tail.lastIndexOf("/"));
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
																		//						get the url											get rid of the website and manga name				get rid of the last /
																		let chapter_number = list[i].getElementsByClassName("color_0077")[0].href.split(source_url)[1].slice(0,-1);
																		if (chapter_number)
																			chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].getElementsByClassName("color_0077")[0].href.replace("moz-extension", "http")};
																	}
																}
															}
															return chapters_list;
				},
				reconstructChapterURL: async function (manga_name, chapter){return (await browser.storage.local.get("mangas_list"))["mangas_list"][manga_name]["chapters_list"][chapter]["url"];
				}
	},
	"fanfox":{name:"fanfox",
				url:"fanfox.net/manga/",
				getMangaName: function (url){return url.split(this.url)[1].split("/")[0];
				},
				getCurrentChapter:  function (url){var manga_name =  this.getMangaName(url);
													//get rid of website and manga name,
													var url_tail = url.split(this.url+manga_name+"/")[1];
													//and get rid of volume and page number
													url_tail = url_tail.split("/");
													for (let x in url_tail) {
														if (url_tail[x].charAt(0) == "c")
															return url_tail[x];
													}
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
																		let url_tail = list[i].href.split(source_url)[1];
																		if (!url_tail)
																			throw new Error("different name on this website (url_tail is undefined)");
																		
																		let chapter_number = "";
																		
																		url_tail = url_tail.split("/");
																		for (let x in url_tail) {
																			if (url_tail[x].charAt(0) == "c")
																				chapter_number = url_tail[x];
																		}
																		if (chapter_number)
																			chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href.replace("moz-extension", "http")};
																	}
																}
															}
															return chapters_list;
				},
				reconstructChapterURL: async function (manga_name, chapter){return (await browser.storage.local.get("mangas_list"))["mangas_list"][manga_name]["chapters_list"][chapter]["url"];
				}
	},
	"mangatown":{name:"mangatown",
				url:"www.mangatown.com/manga/",
				getMangaName: function (url){return url.split(this.url)[1].split("/")[0];
				},
				getCurrentChapter:  function (url){var manga_name =  this.getMangaName(url);
													//get rid of website and manga name,
													var url_tail = url.split(this.url+manga_name+"/")[1];
													//and get rid of page number
													return url_tail.substring(0,url_tail.lastIndexOf("/"));
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
																		//					get the url		get rid of the website and manga name				get rid of the last /
																		let chapter_number = list[i].href.split(source_url)[1].slice(0,-1);
																		if (chapter_number)
																			chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href.replace("moz-extension", "http")};
																	}
																}
															}
															return chapters_list;
				},
				reconstructChapterURL: async function (manga_name, chapter){return (await browser.storage.local.get("mangas_list"))["mangas_list"][manga_name]["chapters_list"][chapter]["url"];
				}
	},
};


//listen to content script, and set manga chapter as "read"
browser.runtime.onMessage.addListener(readMangaChapter);

async function readMangaChapter(message) {
	if  (message.target == "background" && message.url){
		var url = message.url;
		var manga = {};
		var manga_name = getMangaName(url);
		
		manga = (await browser.storage.local.get("mangas_list"))["mangas_list"][manga_name];
		if (manga) {
			var current_chapter = getCurrentChapter(url);
			
			if (current_chapter) {
				if (manga.chapters_list[current_chapter]["status"] != "read") {
					manga.chapters_list[current_chapter] = {"status" : "read", "url" : url};
					let to_log = (await browser.storage.local.get("mangas_list"))["mangas_list"];
					to_log[manga_name] = manga;
					browser.storage.local.set({"mangas_list" : to_log});
				}
			}
		}
		//update badge
		setBadgeNumber();
	}
}


//extract mangas list to json file
async function exportMangasList(){
	var list = {"MangaSubscriberBackUp":await browser.storage.local.get()};
	var blob = new Blob([JSON.stringify(list, null, 2)], {type : 'application/json'});

	await browser.downloads.download({"url": URL.createObjectURL(blob), "filename": "MangaListTestCase.json", "saveAs":true});
	return;
}

//import mangas list from json file
async function importMangasList(file, import_option){
	if (import_option == "replace")
		await browser.storage.local.clear();
	
	var reader = new FileReader();
    reader.onloadend = async function(e){var import_file = JSON.parse(e.target.result);
							var back_up = import_file["MangaSubscriberBackUp"];
							var stored_list = (await browser.storage.local.get("mangas_list"))["mangas_list"];
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
								}
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
	var mangas_list = (await browser.storage.local.get("mangas_list"))["mangas_list"];
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
	var check = (await browser.storage.local.get("mangas_list"))["mangas_list"];
	
	return check[manga_name] ? true : false;
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
	var list = (await browser.storage.local.get("mangas_list"))["mangas_list"];
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
	var list = (await browser.storage.local.get("mangas_list"))["mangas_list"];
	//remove manga from list
	delete list[manga_name];
	//update storage
	await browser.storage.local.set({"mangas_list" : list});
	//update badge
	setBadgeNumber();
	return ;
}

async function setMangaUpdate(manga_name, update_state) {
	var mangas_list = (await browser.storage.local.get("mangas_list"))["mangas_list"];
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

async function reconstructChapterURL(website_name, manga_name, chapter){
	//var website = getWebsite(website_name);
	//if (websites_list[website_name])
		//return await website.reconstructChapterURL(manga_name, chapter);
		return (await browser.storage.local.get("mangas_list"))["mangas_list"][manga_name]["chapters_list"][chapter]["url"];
	//else return ""; 
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
	var mangas = (await browser.storage.local.get("mangas_list"))["mangas_list"];
	
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
	browser.browserAction.setBadgeText({"text" : "U"});
	//fetch current list
	var mangas_list = await browser.storage.local.get();
	
	for (let manga in mangas_list) {
		if (mangas_list[manga]["website_name"] == "http://mangafox.la/manga/"){
			mangas_list[manga]["website_name"] = "http://fanfox.net/manga/";
			let to_log = {};
			to_log[manga] = mangas_list[manga];
			await browser.storage.local.set(to_log);
		}
	}
	
	//update badge
	setBadgeNumber();
	return;
}

//update badge
setBadgeNumber();