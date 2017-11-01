


var websites_list = {
	"mangahere":{url:"https://www.mangahere.co/manga/",
				getMangaName: function (url){return url.split(this.url)[1].split("/")[0];
				},
				getCurrentChapter:  function (url){var manga_name =  this.getMangaName(url);
													//get rid of website and manga name,
													var url_tail = url.split(this.url+manga_name+"/")[1];
													//and get rid of page number
													return url_tail.substring(0,url_tail.lastIndexOf("/"));
				},
				getAllChapters: async function (manga_name){var chapter_list = [];
															var source = "truc";

															//get manga's home page
															var source_url = this.url + manga_name + "/";
															source = await getSource(source_url);

															//extract the chapter list :: href property  from elementsByClassName "color_0077"  from elementsByClassName "left"  from elementsByClassName "detail_list"
															var parser = new DOMParser();
															var doc = parser.parseFromString(source, "text/html");
															
															var list = doc.getElementsByClassName("detail_list")[0].getElementsByClassName("left");
															for (let i = 0; i<list.length; i++){
																if(list[i].getElementsByClassName("color_0077")[0].href){
																	//						get the url											get rid of the website and manga name				get rid of the last /
																	let chapter_number = list[i].getElementsByClassName("color_0077")[0].href.split(source_url.replace("https", "moz-extension"))[1].slice(0,-1);
																	if (chapter_number)
																		chapter_list.push(chapter_number);
																}
															}
															
															return chapter_list;
				},
				reconstructChapterURL: function (manga_name, chapter){return this.url+manga_name+"/"+chapter+"/";
				}
	}
};


//listen to content script, and set manga chapter as "read"
browser.runtime.onMessage.addListener(readMangaChapter);

async function readMangaChapter(message) {
	if  (message.url){
		var url = message.url;
		var manga = {};
		var manga_name = getMangaName(url);
		
		manga = (await browser.storage.local.get(manga_name))[manga_name];
		if (manga) {
			var current_chapter = getCurrentChapter(url);
			
			if (current_chapter) {
				if (manga.chapters_list[current_chapter] != "read") {
					manga.chapters_list[current_chapter] = "read";
					let to_log = {};
					to_log[manga_name] = manga;
					browser.storage.local.set(to_log);
				}
			}
		}
	}
}


//extract mangas list to json file
async function exportMangasList(){
	var list = {"valid_mangas_list":await browser.storage.local.get()};
	var blob = new Blob([JSON.stringify(list, null, 2)], {type : 'application/json'});

	await browser.downloads.download({"url": URL.createObjectURL(blob), "filename": "MangaListBackup.json", "saveAs":true});
	return;
}

//import mangas list from json file
async function importMangasList(file, import_option){
	if (import_option == "replace")
		await browser.storage.local.clear();
	
	var reader = new FileReader();
    reader.onloadend = async function(e){var import_file = JSON.parse(e.target.result);
							var import_list = import_file["valid_mangas_list"];
							if (import_list){
								//if merge, merge storage and import_list
								if (import_option == "merge"){
									//for each item in import_list, check if storage_list has same item, if it does, merge read chapters
									for (let manga_name in import_list){
										let imported_manga = import_list[manga_name];
										let imported_manga_chapters = imported_manga["chapters_list"];
										let stored_manga = (await browser.storage.local.get(manga_name))[manga_name];
										
										if (stored_manga){
											let stored_manga_chapters = stored_manga["chapters_list"];
										
											for (let chapter_number in imported_manga_chapters){
												if (stored_manga_chapters[chapter_number] == "read")
													imported_manga_chapters[chapter_number] = "read";
											}
										}
									}
								}
								await browser.storage.local.set(import_list);
								updateMangasList();
							}
							return ;
						};
    reader.readAsText(file);
}

//update the manga list
async function updateMangasList(){
	//fetch current list
	var mangas_list = await browser.storage.local.get();
	var updated_chapters_list = {};
	//for each manga, get an updated chapters list
	for (let manga in mangas_list) {
		let website = getWebsite(mangas_list[manga].website_name);
		updated_chapters_list[manga] = website.getAllChapters(manga); //A PROMISE IS RETURNED HERE
	}
	//for each manga, check if there is an update
	for (let manga in mangas_list) {
		let updated_chapters = await updated_chapters_list[manga]; //MUST AWAIT THE PROMISE RESOLUTION HERE
		//if there is, update the chapters list, and store the manga
		if (updated_chapters.length > Object.keys(mangas_list[manga].chapters_list).length){
			for (let chapter in updated_chapters){
				if (!mangas_list[manga].chapters_list[updated_chapters[chapter]]){
					mangas_list[manga].chapters_list[updated_chapters[chapter]] = "unread";
				}
			}
			let to_log = {};
			to_log[manga] = mangas_list[manga]
			await browser.storage.local.set(to_log);
		}
	}
	return;
}

async function getMangasList(){
	return await browser.storage.local.get();
}

async function isMangaFollowed(manga_name){
	var check = await browser.storage.local.get(manga_name);
	
	return check[manga_name] ? true : false;
}

//follow a manga
async function followManga(url){
	//populate manga values	
	var manga = {};
	var website = getWebsite(url);
	var manga_name = website.getMangaName(url);
	var chapters_number = await website.getAllChapters(manga_name);
	var current_chapter = website.getCurrentChapter(url);
	var all_chapters = {};
	
	for (i = 0; i < chapters_number.length; i++){
		all_chapters[chapters_number[i]] = chapters_number[i] <= current_chapter ? "read" : "unread";
	}
	
	manga[manga_name] = {website_name:website.url, 
						chapters_list:all_chapters};

	//add manga to storage
	await browser.storage.local.set(manga);
	//update follow button
	return ;
}

//delete a manga
async function deleteManga(manga_name){
	//remove manga from storage
	await browser.storage.local.remove(manga_name);
	return ;
}




//check website url against websites list
function getWebsite(url){
	
	//check if it's in the list and return the name
	for (x in websites_list) {
		if (url.indexOf(websites_list[x].url) == 0){
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
	var website = getWebsite(url);
	if (website != "notAMangaWebsite")
		return await website.getAllChapters(manga_name);
	else return "NotAChapter"; 
}

function reconstructChapterURL(website_name, manga_name, chapter){
	var website = getWebsite(website_name);
	if (website != "notAMangaWebsite")
		return website.reconstructChapterURL(manga_name, chapter);
	else return ""; 
}


async function getSource(source_url){
	var response = "";
	var data = "";

	try{
		response = await fetch(source_url);
		data = await response.text();
	} catch (e){
		console.log(e);
	}
	
	return data;
}


async function initializeStorage() {
	await browser.storage.local.clear();
	browser.storage.local.set(followed_mangas_list);
}


//initializeStorage();