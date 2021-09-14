var mangas_list = {};
var mangassubscriber_prefs = {};

var websites_list = {
	"mangahere":{name:"mangahere",
				url:"mangahere.cc/manga/",
				getMangaName: function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[0]);
				},
				getMangaRootURL: function (url) {
					return "https://www." + this.url + url.split("/manga/")[1].split("/")[0] + "/";
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
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number) {
									let url_tail = list[i].href.split("/manga/")[1];
									url_tail = url_tail.substring(url_tail.indexOf("/")+1);
									let update = new Date(list[i].querySelector(".title2").innerText) != "Invalid Date" ? new Date(list[i].querySelector(".title2").innerText).getTime()
										: list[i].querySelector(".title2").innerText == "Yesterday" ? new Date().getTime() - (24 * 3600 * 1000)
										: new Date().getTime();
									chapters_list[chapter_number] = {"status" : "unknown", "url" : this.getMangaRootURL(list[i].href) + url_tail, "update" : update};
								}
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
							results[cleanMangaName(list[i].title)] = this.getMangaRootURL(list[i].href);
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
								let update = new Date(list[i].querySelector(".title2").innerText) != "Invalid Date" ? new Date(list[i].querySelector(".title2").innerText).getTime()
									: list[i].querySelector(".title2").innerText == "Yesterday" ? new Date().getTime() - (24 * 3600 * 1000)
									: new Date().getTime();
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + list[i].href.split("manga/")[1], "update" : update};
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
					let list = doc.querySelectorAll(".chapter_list li");
					if (! list[0]) throw new Error(" can't find "+ await this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if (list.hasOwnProperty(i)){
								let chapter = list[i].querySelector("a");
								let update = new Date(list[i].querySelector(".time").innerText) != "Invalid Date" ? new Date(list[i].querySelector(".time").innerText).getTime()
									: list[i].querySelector(".time").innerText == "Yesterday" ? new Date().getTime() - (24 * 3600 * 1000)
									: new Date().getTime();
								if(chapter.href){
									let chapter_number = await this.getCurrentChapter(chapter.href);
									if (chapter_number)
										chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + chapter.href.split("manga/")[1], "update" : update};
								}
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
				"unsupported":"total",
				getMangaName: async function (url){
					return "notAManga";
				},
				getMangaRootURL: function (url) {
					return "../help/error.html";
				},
				getCurrentChapter: async function (url){
					return null;
				},
				getAllChapters: async function (manga_url){
					return {};
				},
				searchFor: async function (manga_name){
					return {};
				}
	},
	"webtoons":{name:"webtoons",
				url:"webtoons.com/",
				getMangaName: function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[2]);
				},
				getMangaRootURL: function (url) {
					let url_tail = url.split(this.url)[1].split("/");

					let splitter = url.split("/list?")[1] ? "/list?" : "/viewer?"; // /list? if we're in manga root, /viewer? if we're reading a chapter
					return "https://" + this.url + url_tail[0] + "/" + url_tail[1] + "/" + url_tail[2] + "/list?" + url.split(splitter)[1].split("&episode_no")[0];
				},
				getCurrentChapter: async function (url){
					//get rid of website and manga name,
					var url_tail = url.split("&episode_no=")[1] ? url.split("&episode_no=")[1].split("&")[0] :
									url.split("&episodeNo=")[1] ? url.split("&episodeNo=")[1].split("&")[0] :
									-1;
					
					return url_tail;
				},
				getAllChapters: async function (manga_url){
					//temporary, only dec/jan/feb confirmed, need to wait to get the missing months
					//var french_months = {"janv.":"jan", "févr.":"feb", "mars":"mar", "avril":"apr", "mai":"may", "juin":"jun", "juil.":"jul", "août":"aug","sept.":"sep", "oct.":"oct", "nov.":"nov", "déc.":"dec"};
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
							if(list[i].href && ! list[i].classList.contains("preview_pay_area") && ! list[i].classList.contains("_btnEpisodeEdit")){ // ! list[i].classList.contains("preview_pay_area") to exclude chapters preview requiring payment (they screw up chapter number detection if not paid) --- ! list[i].classList.contains("_btnEpisodeEdit") to exclude edit button broken links from webtoons in the challenge/discovery section
								let chapter_number = await this.getCurrentChapter(list[i].href);
								if (chapter_number) {
									let update = new Date(list[i].querySelector(".date").innerText).getTime();
									chapters_list[chapter_number] = {"status" : "unknown", "url" : list[i].href, "update" : update};
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
	"readmanganato":{name:"readmanganato",
				url:"readmanganato.com/",
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
					name = doc.querySelector("div.story-info-right h1");
					
					return name ? cleanMangaName(name.innerText) : "notAManga";
				},
				getMangaRootURL: function (url) {
					return "https://" + this.url + "manga-" + url.split("/manga-")[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					//get rid of website and manga name
					let url_tail = url.split("chapter-")[1] ? url.split("chapter-")[1] : null;
					
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
					let list = doc.querySelectorAll("li.a-h");
					if (! list[0]) throw new Error(" can't find "+ await this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if (list.hasOwnProperty(i)){
								let chapter = list[i].querySelector("a");
								let date = list[i].querySelector("span[title]").title;
								let update = new Date(date) != "Invalid Date" ? new Date(date).getTime()
									: date == "1 day ago" ? new Date().getTime() - (24 * 3600 * 1000)
									: date == "2 day ago" ? new Date().getTime() - (48 * 3600 * 1000)
									: date == "3 day ago" ? new Date().getTime() - (72 * 3600 * 1000)
									: new Date().getTime();
								if(chapter.href){
									let chapter_number = await this.getCurrentChapter(chapter.href);
									if (chapter_number)
										chapters_list[chapter_number] = {"status" : "unknown", "url" : manga_url + "chapter-" + chapter.href.split("chapter-")[1], "update" : update};
								}
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
						source_url = "https://readmanganato.com/search/story/"+manga_name.replace(" ", "_");
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
						
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("a.item-title");
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].innerText)] = this.getMangaRootURL(list[i].href);
						}
						if (Object.keys(results).length) break; // if results are found, break and return
						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	},
	"isekaiscan":{name:"isekaiscan",
				url:"isekaiscan.com/manga/",
				getMangaName: async function (url){
					return cleanMangaName(url.split(this.url)[1].split("/")[0]);
				},
				getMangaRootURL: async function (url) {
					return "https://" + this.url + url.split("/manga/")[1].split("/")[0] + "/";
				},
				getCurrentChapter: async function (url){
					let mangassubscriber_prefs = await getMangasSubscriberPrefs();
					//get rid of website and manga name,
					var url_tail = url.split("/chapter-")[1] ? url.split("/chapter-")[1].split("/")[0] : "";
					if (mangassubscriber_prefs["unified_chapter_numbers"]) {
						//while first char isn't 0~9
						while (url_tail.charCodeAt(0) < 48 || url_tail.charCodeAt(0) > 57) {
							url_tail = url_tail.slice(1);
						}
						//while last char isn't 0~9
						while (url_tail.charCodeAt(url_tail.length -1) < 48 || url_tail.charCodeAt(url_tail.length -1) > 57) {
							url_tail = url_tail.substring(0, url_tail.length-1);
						}
						//while there is more than one leading zero
						while (url_tail.charCodeAt(0) == 48 && url_tail.charCodeAt(1) == 48) {
							url_tail = url_tail.slice(1);
						}
						url_tail = url_tail.replace(/-|_/g, '.');
					}
					return url_tail;
				},
				getAllChapters: async function (manga_url){
					var chapters_list = {};
					var source = "truc";
					var parser = new DOMParser();

					try {
						source = await getSource(manga_url + "ajax/chapters/", {
							"headers": {
								"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
								"Sec-Fetch-Mode": "cors",
								"Sec-Fetch-Site": "same-origin",
								"Cache-Control": "max-age=0"
							},
							"method": "POST",
							"mode": "cors"
						});
					} catch (error) {
						throw error;
					}
					
					//extract the chapter list
					var doc = parser.parseFromString(source, "text/html");
					let list = doc.querySelectorAll("li.wp-manga-chapter a");
					if (! list[0]) throw new Error(" can't find "+this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let i=0; i<list.length; i++){
							if(list[i].href){
								let chapter_number = await this.getCurrentChapter(this.url + list[i].href.split("/manga/")[1]); 
								let date = list[i].parentElement.querySelector("i").innerText;
								let update = new Date(date) != "Invalid Date" ? new Date(date).getTime()
									: date == "1 day ago" ? new Date().getTime() - (24 * 3600 * 1000)
									: date == "2 days ago" ? new Date().getTime() - (48 * 3600 * 1000)
									: date == "3 days ago" ? new Date().getTime() - (72 * 3600 * 1000)
									: new Date().getTime();
								if (chapter_number)
									chapters_list[chapter_number] = {"status" : "unknown", "url" : "https://" + this.url + list[i].href.split("manga/")[1], "update" : update};
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
						let source_url = "https://isekaiscan.com/?s="+manga_name.replace(/ /g, "+")+"&post_type=wp-manga";
						try {
							//get search page
							source = await getSource(source_url);
						} catch (error) {
							throw error;
						}
	
						//extract mangas found
						let doc = parser.parseFromString(source, "text/html");
						let list = doc.querySelectorAll("h3.h4 a");
						for (let i=0; i<list.length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(list[i].innerText)] = await this.getMangaRootURL(list[i].href);
						}

						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	},
	"mangadex":{name:"mangadex",
				url:"mangadex.org/",
				getMangaName: async function (url){
					let name = "notAManga";
					let manga_id = "";
					//if on chapter page, get chapter data and extract manga id
					if (url.includes("/chapter/")){
						try {
							let chapter_source = JSON.parse(await getSource("https://api.mangadex.org/chapter/" + url.split("/chapter/")[1].split("/")[0]));
							manga_id = chapter_source["data"]["relationships"]["1"]["id"];
						} catch (error) {
							throw error;
						}
					} else if (url.includes("/title/") && url.split("/title/")[1]) { //if on root page, manga id is in url
						manga_id = url.split("/title/")[1];
						
					}
					//get manga data and extract name
					try {
						let manga_source = JSON.parse(await getSource("https://api.mangadex.org/manga/" + manga_id));
						name = cleanMangaName(manga_source["data"]["attributes"]["title"]["en"]);
					} catch (error) {
						throw error;
					}
					return name;
				},
				getMangaRootURL: async function (url) {
					let result = "";
					//if we're on root page, make sure the domain is mangadex and not mangassubscriber
					if (url.includes("/title/") && url.split("/title/")[1]) result = "https://" + this.url + "title/" + url.split("/title/")[1];
					//if we're on chapter page
					else if (url.includes("/chapter/")){
						try {
							let chapter_source = JSON.parse(await getSource("https://api.mangadex.org/chapter/" + url.split("/chapter/")[1].split("/")[0]));
							result = this.url + "/title/" + chapter_source["data"]["relationships"]["1"]["id"];
						} catch (error) {
							throw error;
						}
					}
					return result;
				},
				getCurrentChapter: async function (url){
					var chapter = null;
					//if we're on root page, no chapter number
					//if we're on chapter page
					if (url.includes("/chapter/")){
						try {
							let chapter_source = JSON.parse(await getSource("https://api.mangadex.org/chapter/" + url.split("/chapter/")[1].split("/")[0]));
							
							let volume_number = chapter_source["data"]["attributes"]["volume"] != null ? chapter_source["data"]["attributes"]["volume"] : "";
							let chapter_number = volume_number != "" ? chapter_source["data"]["attributes"]["chapter"].replace(/\./g, "") : chapter_source["data"]["attributes"]["chapter"];
							if (volume_number != "" && chapter_number.length == 1) chapter_number = "0" + chapter_number;
							
							let junction = (volume_number != "") && (chapter_number != "") ? "." : "";
							chapter = volume_number + junction + chapter_number;
						} catch (error) {
							throw error;
						}
					}
					return chapter;
				},
				getAllChapters: async function (manga_url){
					var chapters_list = {};
					let temp_list = {};
					let source = "truc";
					let manga_id = manga_url.split("/title/")[1].split("/")[0];

					try {
						let offset = 0;
						let total = 500;
						while (offset < total) {
							source = JSON.parse(await getSource("https://api.mangadex.org/manga/" + manga_id + "/feed?limit=500&offset=" + offset));
							total = source["total"];
							offset += 500;
							for(var i in source["data"]) {
								temp_list[i] = cloneObject(source["data"][i]);
							}
						}
					} catch (error) {
						throw error;
					}
					
					//extract the chapter list
					if (! temp_list["0"]) throw new Error(" can't find "+this.getMangaName(manga_url)+" on "+this.name); 
					if (Object.keys(temp_list).length == 0) throw new Error(" no chapters found for "+this.getMangaName(manga_url)+" on "+this.name);
					else {
						for (let index in temp_list){
							if(temp_list[index]["attributes"]["translatedLanguage"] == "en"){
								let volume_number = temp_list[index]["attributes"]["volume"] != null ? temp_list[index]["attributes"]["volume"] : "";
								let chapter_number = volume_number != "" ? temp_list[index]["attributes"]["chapter"].replace(/\./g, "") : temp_list[index]["attributes"]["chapter"];
								let chapter_id = temp_list[index]["id"];
								if (volume_number != "" && chapter_number.length == 1) chapter_number = "0" + chapter_number;
								
								let junction = (volume_number != "") && (chapter_number != "") ? "." : "";
								let chapter = volume_number + junction + chapter_number;

								let update = new Date(temp_list[index]["attributes"]["publishAt"]).getTime();
								if (chapter != "")
									chapters_list[chapter] = {"status" : "unknown", "url" : "https://mangadex.org/chapter/" + chapter_id, "update" : update};
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

					while (Object.keys(results).length == 0 && index > 0) {
						//get search page results for manga_name
						let source_url = "https://api.mangadex.org/manga?title=" + manga_name.replace(" ", "%20") + "&limit=30&offset=0&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";
						try {
							//get search page
							source = JSON.parse(await getSource(source_url, {
								"method": "GET",
								"mode": "cors"
							}));
						} catch (error) {
							throw error;
						}
						
						//extract mangas found
						for (let i=0; i<source["data"].length; i++) {
							if (mangassubscriber_prefs["search_limit"] > 0 && i >= mangassubscriber_prefs["search_limit"]) break;
							results[cleanMangaName(source["data"][i]["attributes"]["title"]["en"])] = "https://" + this.url + "title/" + source["data"][i]["id"];
						}

						manga_name = manga_name.substring(0, manga_name.lastIndexOf(" "));
						index--;
					}
					return results;
				}
	}
};

function cleanMangaName (name) {
	return htmlDecode(name).replace(/[\W_]+/g , " ").toLowerCase().trim();
}

function htmlDecode(input){
	let e = document.createElement('div');
	e.innerText = input;
	return e.childNodes[0].nodeValue;
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
		let Ai = tabA[i] ? parseInt(tabA[i]) : 0;
		let Bi = tabB[i] ? parseInt(tabB[i]) : 0;
		compare = Ai > Bi ? 1 : Ai == Bi ? 0 : -1;
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

async function getSource(url, options){
	var response = "";
	var data = "";
	var use_options = options ? options : {};

	try{
		response = await fetch(url, use_options);
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
	let manga_root_url = await website.getMangaRootURL(url);
	var chapters_list = await website.getAllChapters(manga_root_url);
	var current_chapter = await website.getCurrentChapter(url);
	let mangas_list = await getMangasList();
	await getMangasSubscriberPrefs(); //making sure preferences are initialized for customSort()
	
	let updates = [];

	for (let chapter_number in chapters_list){
		chapters_list[chapter_number]["status"] = customSort(chapter_number, current_chapter) <= 0 ? "read" : "unread";
		updates.push(chapters_list[chapter_number]["update"]);
		delete chapters_list[chapter_number]["update"];
	}
	let registered_websites = {};
	registered_websites[website.name] = manga_root_url;
	updates.sort(function(a, b){return b-a});

	manga = {"website_name":website.name,
			"update":true,
			"last_updated":updates[0],	
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
	if (browser.browserAction.setBadgeText)	browser.browserAction.setBadgeText({"text" : "UPD"});
	let updated_chapters_list = {};
	let check_all_sites = await getCheckAllSites();
	let to_update_list = {};
	let update_promises = [];
	let mangas_list = await getMangasList();

	//add cookies to bypass age verification hiding chapters lists
	await browser.cookies.set({url:"https://fanfox.net", name:"isAdult", value:"1"});
	await browser.cookies.set({url:"https://www.mangahere.cc", name:"isAdult", value:"1"});
	await browser.cookies.set({url:"https://www.webtoons.com", name:"ageGatePass", value:"true"});

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
					if (! mangassubscriber_prefs["performance_mode"]) browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"updating" , "details":""}}); //warning the popup
					updated_chapters_list[manga][website_name] = websites_list[website_name].getAllChapters(mangas_list[manga]["registered_websites"][website_name]); //A PROMISE IS RETURNED HERE
					updated_chapters_list[manga][website_name].then(async function(updated_chapters){
																		if (! mangassubscriber_prefs["performance_mode"]) browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"completed" , "details":""}}); //warning the popup
																		for (let chapter in updated_chapters){
																			if (!mangas_list[manga].chapters_list[chapter]){
																				//if not on the list, update with what we have
																				mangas_list[manga].chapters_list[chapter] = {"status":"unread" , "url":updated_chapters[chapter]["url"]};
																				if (!mangas_list[manga]["last_updated"] || updated_chapters[chapter]["update"] > mangas_list[manga]["last_updated"]) 
																					mangas_list[manga]["last_updated"] = updated_chapters[chapter]["update"];
																			} else if (getWebsite(updated_chapters[chapter]["url"]).name == mangas_list[manga].website_name) {
																				//otherwise, if it's on the list AND it's the prefered website, update the url
																				mangas_list[manga].chapters_list[chapter] = {"status":mangas_list[manga].chapters_list[chapter]["status"] , "url":updated_chapters[chapter]["url"]};
																				if (!mangas_list[manga]["last_updated"] || updated_chapters[chapter]["update"] > mangas_list[manga]["last_updated"]) 
																					mangas_list[manga]["last_updated"] = updated_chapters[chapter]["update"];
																			}
																		}
																	},
																	function(error){
																		browser.runtime.sendMessage({"target":"popup" , "log":{"manga":manga , "from":website_name , "status":"errors" , "details":"couldn't get source : "+ error +"\n"+ error.stack}}); //warning the popup
																	}
					);
					update_promises.push(updated_chapters_list[manga][website_name]);
				}
			} 
		}
	}
	//map a catch() clause to the promises so that promise.all.then triggers even if some promises are rejected
	Promise.all(update_promises.map(p => p.catch(() => undefined))).then(() => {
		browser.storage.local.set({"mangas_list" : mangas_list});
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

		await getMangasList();
		await getMangasSubscriberPrefs(); //making sure preferences are initialized for customSort()

		if (mangas_list[manga_name]) {
			if (current_chapter) {
				if (mangas_list[manga_name].chapters_list[current_chapter] && mangas_list[manga_name].chapters_list[current_chapter]["status"] != "read") {
					mangas_list[manga_name].chapters_list[current_chapter]["status"] = "read";
					browser.storage.local.set({"mangas_list" : mangas_list});
				} else if (! mangas_list[manga_name].chapters_list[current_chapter]) {
					mangas_list[manga_name].chapters_list[current_chapter] = {"status" : "read", "url" : url};
					//TODO : find a way to fetch last_updated value for that manga without updating the list
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
							browser.tabs.sendMessage(sender.tab.id, {"target":"content","navigation": {"current_chapter":current_chapter, "first_chapter": first_chapter, "previous_chapter": previous_chapter, "next_chapter": next_chapter, "last_chapter": last_chapter, "unread_chapter": unread_chapter, "previous_chapter_key":mangassubscriber_prefs["previous_chapter_key"], "next_chapter_key":mangassubscriber_prefs["next_chapter_key"]}});
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

	let now = new Date();
	let now_string = " - " + now.getFullYear()+ "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + "h" + now.getMinutes() + "m" + now.getSeconds() + "s";
	
	try{
		await browser.downloads.download({"url": URL.createObjectURL(blob), "filename": "MangaListBackUp"+ now_string +".json"});
	} catch (error){
		console.log(error);
	}
	return;
}

//export mangas list online to paste.ee
async function exportMangasListOnline(){
	var list = {"MangasSubscriberBackUp":await browser.storage.local.get()};
	var text_data = encodeURIComponent(JSON.stringify(list, null, 0));

	var request = new XMLHttpRequest();

	request.onreadystatechange = async function() {
		if (this.readyState == 4 && this.status == 201) {
			let decoded_json = decodeURIComponent(this.responseText);
			let parsed_json = JSON.parse(decoded_json);
			let key = parsed_json["id"];
			await browser.storage.sync.set({"sync_list_key":key});
		}
	};

	request.open("POST", "https://api.paste.ee/v1/pastes", true);
	request.setRequestHeader("Content-type", "application/json");
	request.setRequestHeader("X-Auth-Token", "aWYQmpKw3E1YdeYkuvEE3fMtAL2k3GdUNg5i3fEUH");
	request.send('{"sections":[{"contents":"'+text_data+'"}]}');

	return;
}



//import mangas list from json
async function importMangasList(parsed_json){
	var back_up = parsed_json["MangasSubscriberBackUp"];
	if (back_up && back_up["mangas_list"] && back_up["MangasSubscriberPrefs"]){
		await getMangasList();
		mangas_list = cloneObject(back_up["mangas_list"]);
		mangassubscriber_prefs = cloneObject(back_up["MangasSubscriberPrefs"]);
		await browser.storage.local.clear();
		await browser.storage.local.set(back_up);
		//update badge
		setBadgeNumber();
		//reset possible autoUpdate
		setAutoUpdate(await getAutoUpdateInterval());
		install();
	}
	return ;
}



async function registerWebsites(manga_name, websites){
	for (let name in websites) {
		if (websites.hasOwnProperty(name)) {
			let website = getWebsite(websites[name]);
			websites[name] = await website.getMangaRootURL(websites[name]);
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
	if (!mangas_list || Object.keys(mangas_list).length == 0)
		mangas_list = (await browser.storage.local.get("mangas_list"))["mangas_list"];
	return mangas_list;
}

async function getMangasSubscriberPrefs(){
	if (!mangassubscriber_prefs || Object.keys(mangassubscriber_prefs).length == 0)
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


async function togglePerformanceMode(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangassubscriber_prefs["performance_mode"] = ! mangassubscriber_prefs["performance_mode"];
	await browser.storage.local.set({"MangasSubscriberPrefs" : mangassubscriber_prefs});
	return;
}

async function getPerformanceMode(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["performance_mode"];
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

async function registerPreviousChapterKey(keycode){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangassubscriber_prefs["previous_chapter_key"] = keycode;
	await browser.storage.local.set({"MangasSubscriberPrefs" : mangassubscriber_prefs});
	return;
}

async function getPreviousChapterKey(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["previous_chapter_key"];
}

async function registerNextChapterKey(keycode){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangassubscriber_prefs["next_chapter_key"] = keycode;
	await browser.storage.local.set({"MangasSubscriberPrefs" : mangassubscriber_prefs});
	return;
}

async function getNextChapterKey(){
	let mangassubscriber_prefs = await getMangasSubscriberPrefs();
	return mangassubscriber_prefs["next_chapter_key"];
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
	mangassubscriber_prefs = await getMangasSubscriberPrefs();
	mangas_list = await getMangasList();
	let to_log = null;
	let update_list = false;

	//saving the existing list "just in case"
	if (mangas_list && mangassubscriber_prefs && (! mangassubscriber_prefs["version"] || mangassubscriber_prefs["version"] != browser.runtime.getManifest().version)) {
		await exportMangasList();
		mangassubscriber_prefs["version"] = browser.runtime.getManifest().version;
		update_list = true;
	}

	//initializing if nothing exists or it's outdated
	if (!mangassubscriber_prefs || Object.keys(mangassubscriber_prefs).length < 12) {mangassubscriber_prefs = {"DB_version":"2.0.5", "version":browser.runtime.getManifest().version, "unified_chapter_numbers":true, "performance_mode":true, "check_all_sites":false, "navigation_bar":true, "previous_chapter_key":"", "next_chapter_key":"", "auto_update":0, "last_update":0, "search_limit":5, "patchnotes": "0.0.0"};}
	if (!mangas_list || Object.keys(mangas_list).length == 0) {mangas_list = {};}

	//add here existing lists modification to comply with new version when needed
	if (update_list) {
		browser.browserAction.setBadgeText({"text" : "..."});
		for (let manga in mangas_list){
			console.log(mangas_list[manga]);
			if (mangas_list[manga]["registered_websites"]["isekaiscan"]) {
				mangas_list[manga]["registered_websites"]["isekaiscan"] = mangas_list[manga]["registered_websites"]["isekaiscan"].split("&")[0];
				for (let chapter in mangas_list[manga]["chapters_list"]){
					if (chapter.split("/")[1]) {
						let new_chapter = await websites_list["isekaiscan"].getCurrentChapter(mangas_list[manga]["chapters_list"][chapter]["url"]);
						if (! mangas_list[manga]["chapters_list"][new_chapter]) {
							mangas_list[manga]["chapters_list"][new_chapter] = cloneObject(mangas_list[manga]["chapters_list"][chapter]);
							mangas_list[manga]["chapters_list"][new_chapter]["url"] = (mangas_list[manga]["chapters_list"][new_chapter]["url"]).split("?")[0];
						}
						delete mangas_list[manga]["chapters_list"][chapter];
						
					}
				}
			}
		}
		setBadgeNumber();
	}

	to_log = {"MangasSubscriberPrefs": mangassubscriber_prefs, "mangas_list": mangas_list};
	
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
