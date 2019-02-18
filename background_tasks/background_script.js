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
					let list = doc.querySelectorAll(".detail-main-list li a");
					if (! list[0]) throw new Error(" can't find "+this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(this.url + list[i].href.split("/manga/")[1]); //since mangahere uses relative path for urls in chapters list, we need to get replace the extension ID at the start of the url
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + list[i].href.split("manga/")[1]};
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
						let source_url = "https://www.mangahere.cc/search?title="+manga_name.replace(/ /g, "+");
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("ul.manga-list-4-list li .manga-list-4-item-title a");
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].title)] = "https://" + this.url + list[i].href.split("manga/")[1];
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
						for (let i=0; i<list.length; i++){
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
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].title)] = "https://" + this.url + list[i].href.split("manga/")[1];
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
						for (let i=0; i<list.length; i++){
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
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].title)] = "https://" + this.url + list[i].href.split("manga/")[1];
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
						for (let i=0; i<list.length; i++){
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
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].title)] = list[i].href.replace("moz-extension", "http");
						}
						
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	},
	"webtoons":{name:"webtoons",
				url:"webtoons.com/",
				getMangaName: function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[2]);
				},
				getMangaRootURL: function (url) {
					//return "https://" + this.url + url.split(this.url)[1].split("/list?")[0] + "/";
					let url_tail = url.split(this.url)[1].split("/");

					let splitter = url.split("/list?")[1] ? "/list?" : "/viewer?"; // /list? if we're in manga root, /viewer? if we're reading a chapter
					return "https://" + this.url + url_tail[0] + "/" + url_tail[1] + "/" + url_tail[2] + "/list?" + url.split(splitter)[1].split("&episode_no")[0];
				},
				getCurrentChapter: async function (url){
					//get rid of website and manga name,
					var url_tail = url.split("&episode_no=")[1].split("&")[0];
					
					return url_tail;
				},
				getAllChapters: async function (manga_url){
					var chapters_list = {};
					var source = "truc";
					var parser = new DOMParser();
					let manga_name = this.getMangaName(manga_url);
					let already_updated_this = false

					try {
						//get manga's home page
						source = await getSource(manga_url);
					} catch (error) {
						throw error;
					}

					var doc = parser.parseFromString(source, "text/html");
					let list = doc.querySelectorAll(".detail_lst ul li a");
					list[0] ? false : list = doc.querySelectorAll("ul#_episodeList li a"); //if no chapters found, we might have been redirected to mobile website (different layout), check if we find something using that layout
					if (! list[0]) throw new Error(" can't find "+manga_name+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if(list[i].href && ! list[i].classList.contains("preview_pay_area")){ // ! list[i].classList.contains("preview_pay_area") to exclude chapters preview requiring payment (they screw up chapter number detection if not paid)
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number) {
									chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href};
									if (mangas_list[manga_name] && mangas_list[manga_name]["chapters_list"][chapter_number]) already_updated_this = true;
								}
							}
						}
					}
					if (!already_updated_this) {
						let paginate = doc.getElementsByClassName("paginate")[0];
						for (let i=0; i<paginate.children.length; i++) {
							if (paginate.children[i].href.substr(-1) == "#" && paginate.children[i+1]) {
								let chapters = await this.getAllChapters("https://" + this.url + paginate.children[i+1].href.split("moz-extension://")[1].substring(paginate.children[i+1].href.split("moz-extension://")[1].indexOf("/") + 1));
								for (let number in chapters){
									if(chapters.hasOwnProperty(number)){
										chapters_list[number] = chapters[number];
									}
								}
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
						let response1 = await getSource("https://www.webtoons.com/search?keyword=" + manga_name + "&searchType=WEBTOON");
						let doc1 = parser.parseFromString(response1, "text/html");
						
						let list1 = doc1.querySelectorAll(".card_lst li a");
						for (let i=0; i<list1.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							let name = cleanMangaName(list1[i].getElementsByClassName("subj")[0].innerText);
							results[name] = "https://" + this.url + "dummy_language/dummy_genre/" + name + "/list?title_no" + list1[i].href.split("episodeList?titleNo")[1];
						}

						//if nothing found in webtoons published, look in discovery/challenge category
						if (Object.keys(results).length == 0) {
							let response2 = await getSource("https://www.webtoons.com/search?keyword=" + manga_name + "&searchType=CHALLENGE");
							let doc2 = parser.parseFromString(response2, "text/html");
							
							let list2 = doc2.querySelectorAll(".challenge_lst ul li a");
							for (let i=0; i<list2.length; i++) {
								if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
								let name = cleanMangaName(list2[i].getElementsByClassName("subj")[0].innerText);
								results[name] = "https://" + this.url + "dummy_language/challenge/" + name + "/list?title_no" + list2[i].href.split("episodeList?titleNo")[1];
							}
						}
						
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	},
	"mangakakalot":{name:"mangakakalot",
				url:"mangakakalot.com/",
				getMangaName: async function (url){
					var source = "truc";
					var parser = new DOMParser();
					let name = "notAManga";
					try {
						//get manga's home page
						source = await getSource(this.getMangaRootURL(url));
					} catch (error) {
						throw error;
					}

					//extract the manga name
					var doc = parser.parseFromString(source, "text/html");
					name = doc.querySelector("ul.manga-info-text li h1");
					
					return name ? cleanMangaName(name.innerText) : "notAManga";
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + "manga/" + url.split(url.includes("/manga/") ? "/manga/" : url.includes("/chapter/") ? "/chapter/" : this.url)[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					//get rid of website and manga name
					let url_tail = url.split("chapter_")[1] ? url.split("chapter_")[1] : null;
					
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
					let list = doc.querySelectorAll("div.chapter-list div.row span a");
					if (! list[0]) throw new Error(" can't find "+ await this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + "chapter/" + list[i].href.split("chapter/")[1]};
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
						source_url = "https://mangakakalot.com/search/"+manga_name.replace(" ", "_");
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
						
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("div.daily-update-item span a");
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].innerText)] = "https://" + this.url + "manga/" + list[i].href.split("manga/")[1];
						}
						if (Object.keys(results).length) break; // if results are found, break and return
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	},
	"manganelo":{name:"manganelo",
				url:"manganelo.com/",
				getMangaName: async function (url){
					var source = "truc";
					var parser = new DOMParser();
					let name = "notAManga";
					try {
						//get manga's home page
						source = await getSource(this.getMangaRootURL(url));
					} catch (error) {
						throw error;
					}

					//extract the manga name
					var doc = parser.parseFromString(source, "text/html");
					name = doc.querySelector("ul.manga-info-text li h1");
					
					return name ? cleanMangaName(name.innerText) : "notAManga";
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + "manga/" + url.split(url.includes("/manga/") ? "/manga/" : url.includes("/chapter/") ? "/chapter/" : this.url)[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					//get rid of website and manga name
					let url_tail = url.split("chapter_")[1] ? url.split("chapter_")[1] : null;
					
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
					let list = doc.querySelectorAll("div.chapter-list div.row span a");
					if (! list[0]) throw new Error(" can't find "+ await this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + "chapter/" + list[i].href.split("chapter/")[1]};
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
						source_url = "https://manganelo.com/search/"+manga_name.replace(" ", "_");
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
						
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("div.daily-update-item span a");
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].innerText)] = "https://" + this.url + "manga/" + list[i].href.split("manga/")[1];
						}
						if (Object.keys(results).length) break; // if results are found, break and return
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	},
	"mangarock":{name:"mangarock",
				url:"mangarock.com/",
				getMangaName: async function (url){
					var source = "truc";
					var parser = new DOMParser();
					let name = "notAManga";
					try {
						//get manga's home page
						source = await getSource(this.getMangaRootURL(url));
					} catch (error) {
						throw error;
					}

					//extract the manga name
					var doc = parser.parseFromString(source, "text/html");
					name = doc.querySelector("div._3_XVY._1_8ki h1");
					
					return name ? cleanMangaName(name.innerText) : "notAManga";
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + "manga/" + url.split("/manga/")[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					let chapters = [];
					let chapter_number = url.split("/chapter/")[1];
					
					chapters = await this.getAllChapters(this.getMangaRootURL(url));
					let changed = false;
					for (let i in chapters) {
						if (chapters.hasOwnProperty(i) && chapters[i].url.split("chapter/")[1] == chapter_number) {
							chapter_number = i;
							changed = true;
							break;
						}
					}
					return changed ? chapter_number : null;
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
					let list = doc.querySelectorAll("td.col-8.col-md-9 a");
					if (! list[0]) throw new Error(" can't find "+ await this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = list[i].innerText.split("Chapter ")[1].split(":")[0];//await this.getCurrentChapter(list[i].href);
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + "manga/" + list[i].href.split("manga/")[1]};
							}
						}
					}
					return chapters_list;
				},
				searchFor: async function (manga_name){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					let untrimmed_results = {};
					let results = {};
					let index = manga_name.split(" ").length;

					while (Object.keys(results).length == 0 && index > 0) {
						let tab = await browser.tabs.create({url: "https://mangarock.com/search?q="+manga_name});
						let arrayed = [];
						for (i=0; i<10; i++) {
							arrayed = await browser.tabs.executeScript({
								code:'if (!list) {var list = [];} else {list = [];} list = document.querySelectorAll("a._2dU-m.vlQGQ"); if (!results) {var results = {};} else {results = {};}'+
								'for (let i=0; i<list.length; i++) {results[list[i].innerText] = "https://mangarock.com/manga/" + list[i].href.split("manga/")[1];}'+
								'JSON.stringify(results);',
								runAt: "document_idle"
							});
							if (arrayed[0] == undefined || arrayed[0].length < 3) {
								await (async function sleep(ms = 0) {
									return new Promise(r => setTimeout(r, ms));
								})(1000);
							} else break;
						}
						
						let raw_results = JSON.parse(arrayed[0]);
						for (let res in raw_results) {
							if (raw_results.hasOwnProperty(res)) {
								untrimmed_results[cleanMangaName(res)] = raw_results[res];
							}
						}
						
						browser.tabs.remove(tab.id);
						if (Object.keys(results).length) break; // if results are found, break and return
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}

					for (i=0; i<Object.keys(untrimmed_results).length; i++) {
						if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[Object.keys(untrimmed_results)[i]] = untrimmed_results[Object.keys(untrimmed_results)[i]];
						
					}
					
					return results;
				}
	}
};

function cleanMangaName (name) {
	return name.replace(/[\W_]+/g , " ").toLowerCase();
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
	a ? a == "" ? a = Number.MIN_SAFE_INTEGER : false
		: a = Number.MIN_SAFE_INTEGER;
	b ? b == "" ? b = Number.MIN_SAFE_INTEGER : false
		: b = Number.MIN_SAFE_INTEGER;
	return parseFloat(a) === parseFloat(b) ? 0 : parseFloat(a) > parseFloat(b) ? 1 : -1;
}

function customSort(a, b) {
	return mangassubscriber_prefs["unified_chapter_numbers"] ? sortNum(a, b) : sortAlphaNum(a, b);
}

function sortVersions(a, b) {
	let tabA = a.split(".");
	let tabB = b.split(".");
	let length = tabA.length > tabB.length ? tabA.length : tabB.length;
	let compare = null;

	for (i=0; i<length; i++) {
		compare = tabA[i] ? tabB[i] ? tabA[i] > tabB[i] ? 1 : tabA[i] == tabB[i] ? 0 : -1 : 1 : -1;
		if (compare != 0) break;
	}
	return compare;
}

function cloneObject(obj) {
	var clone = {};
	for(var i in obj) {
		if(obj[i] != null &&  typeof(obj[i])=="object")
			clone[i] = cloneObject(obj[i]);
		else
			clone[i] = obj[i];
	}
	return clone;
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
	var manga_name = await website.getMangaName(url);
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
	Promise.all(update_promises.map(p => p.catch(() => undefined))).then(() => {
		setBadgeNumber();
	});
	return;
}



//listen to content script, and set manga chapter as "read"
browser.runtime.onMessage.addListener(readMangaChapter);

async function readMangaChapter(message, sender) {
	if  (message.target == "background" && message.read){
		var url = message.read;
		var manga_name = await getMangaName(url);
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
						let first_chapter = index > 0 ? {"number": chapters_numbers[0], "url": mangas_list[manga_name].chapters_list[chapters_numbers[0]].url} : "";
						//previous chapter (if there is at least one chapter between first and current)
						let previous_chapter = index > 1 ? {"number": chapters_numbers[index-1], "url": mangas_list[manga_name].chapters_list[chapters_numbers[index-1]].url} : "";
						//next chapter (if there is at least one chapter between current and last)
						let next_chapter = index < (chapters_numbers.length-2) ? {"number": chapters_numbers[index+1], "url": mangas_list[manga_name].chapters_list[chapters_numbers[index+1]].url} : "";
						//last chapter (if current chapter isn't the last)
						let last_chapter = index < (chapters_numbers.length-1) ? {"number": chapters_numbers[chapters_numbers.length-1], "url": mangas_list[manga_name].chapters_list[chapters_numbers[chapters_numbers.length-1]].url} : "";
						//first unread chapter
						let unread_chapter = "";
						for (i=0; i<chapters_numbers.length; i++) {
							if (mangas_list[manga_name].chapters_list[chapters_numbers[i]].status == "unread") {
								unread_chapter = {"number": chapters_numbers[i], "url": mangas_list[manga_name].chapters_list[chapters_numbers[i]].url};
								break;
							}
						}

						if (await getNavigationBar())
							browser.tabs.sendMessage(sender.tab.id, {"target":"content","navigation": {"first_chapter": first_chapter, "previous_chapter": previous_chapter, "next_chapter": next_chapter, "last_chapter": last_chapter, "unread_chapter": unread_chapter}});
					}
				}
			}
		}
		//update badge
		setBadgeNumber();
	}
}




//listen to content script, and set manga chapter as "read"
browser.runtime.onMessage.addListener(unreadMangaChapter);

async function unreadMangaChapter(message, sender) {
	if  (message.target == "background" && message.unread){
		var url = message.unread;
		var manga_name = await getMangaName(url);
		var current_chapter = await getCurrentChapter(url);

		let mangas_list = await getMangasList();

		if (mangas_list[manga_name]) {
			if (current_chapter) {
				if (mangas_list[manga_name].chapters_list[current_chapter]) {
					mangas_list[manga_name].chapters_list[current_chapter]["status"] = "unread";
					browser.storage.local.set({"mangas_list" : mangas_list});
				} else {
					mangas_list[manga_name].chapters_list[current_chapter] = {"status" : "unread", "url" : url};
					browser.storage.local.set({"mangas_list" : mangas_list});
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
	var text_data = encodeURIComponent(JSON.stringify(list, null, 0));
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
	if (back_up && back_up["MangasSubscriberPrefs"] && back_up["MangasSubscriberPrefs"]["DB_version"] == "2.0.2"){
		await getMangasList();
		mangas_list = cloneObject(back_up["mangas_list"]);
		mangassubscriber_prefs = cloneObject(back_up["MangasSubscriberPrefs"]);
		await browser.storage.local.clear();
		await browser.storage.local.set(back_up);
		//update badge
		setBadgeNumber();
		//reset possible autoUpdate
		setAutoUpdate(await getAutoUpdateInterval());
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
	mangas_list[manga_name]["registered_websites"] = cloneObject(websites); //websites is a reference to an object created in the popup, it becomes DeadObject when the popup is destroyed
	browser.storage.local.set({"mangas_list" : mangas_list});
	return;
}


async function registerTags(manga_name, tags){
	let mangas_list = await getMangasList();

	mangas_list[manga_name]["tags"] = cloneObject(tags); //tags is a reference to an object created in the popup, it becomes DeadObject when the popup is destroyed
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
	
	clearTimeout(isAutoUpdating);
	if (interval > 0) {
		let remaining_time = interval*hours;
		let current_time = new Date().getTime();
		if (mangassubscriber_prefs["last_update"] > 0) remaining_time = remaining_time - (current_time - mangassubscriber_prefs["last_update"]);
		else mangassubscriber_prefs["last_update"] = current_time;
		if (remaining_time < 0) remaining_time = 0;
		isAutoUpdating = setTimeout(autoUpdate, remaining_time);
	} else {
		mangassubscriber_prefs["last_update"] = 0;
	}
	browser.storage.local.set({"MangasSubscriberPrefs":mangassubscriber_prefs});
}

//get auto update interval
async function getAutoUpdateInterval(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["auto_update"];
}

//auto update
async function autoUpdate(){
	let hours = 3600000;
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	let interval = mangassubscriber_prefs["auto_update"];
	
	clearTimeout(isAutoUpdating);
	if (interval > 0) {
		updateMangasList();
		isAutoUpdating = setTimeout(autoUpdate, interval*hours);
		mangassubscriber_prefs["last_update"] = new Date().getTime();
		browser.storage.local.set({"MangasSubscriberPrefs":mangassubscriber_prefs});
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



//set limit on search results
async function setPatchnotesVersion(version){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangassubscriber_prefs["patchnotes"] = version;
	await browser.storage.local.set({"MangasSubscriberPrefs":mangassubscriber_prefs});
}

//get search results limit
async function getPatchnotesVersion(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["patchnotes"];
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
async function getMangaName(url){
	var website = getWebsite(url);
	if (website != "notAMangaWebsite")
		return await website.getMangaName(url);
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

	if (!prefs || Object.keys(prefs).length < 8) {prefs = {"DB_version":"2.0.2", "unified_chapter_numbers":true, "check_all_sites":false, "navigation_bar":true, "auto_update":0, "last_update":0, "search_limit":5, "patchnotes": "0.0.0"}; mangassubscriber_prefs = prefs;}
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
	//reset possible autoUpdate
	setAutoUpdate(await getAutoUpdateInterval());
});
