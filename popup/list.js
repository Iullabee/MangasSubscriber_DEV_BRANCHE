
async function createMangasList() {
    var background = await browser.runtime.getBackgroundPage();
		
					
    var mangas = await background.getMangasList();
    var prefered_websites = await background.getPreferredWebsites();
   
    //sorting the mangas alphabetically
    mangas = Object.keys(mangas).sort().reduce((r, k) => (r[k] = mangas[k], r), {});
    var unread_mangas = [];
    var read_mangas = [];
    
    var dom_mangas_list = document.getElementById("list"); //clear the existing list
	while (dom_mangas_list.firstChild){
        dom_mangas_list.removeChild(dom_mangas_list.firstChild);
    }
    var filter_list = document.getElementById("filter_list").value;
    //for each manga, 
    for (let name in mangas){
        var manga = mangas[name];
        
        //sort the chapters (unread ones by ascending order, read ones by descending order)
        let read_chapters = [];
        let unread_chapters = [];
        for (let chapter in manga.chapters_list){
            manga.chapters_list[chapter]["status"] == "unread" ? unread_chapters.push(chapter) : read_chapters.push(chapter);
        }
        unread_chapters.sort((a,b)=>{return parseFloat(a)-parseFloat(b);});
        read_chapters.sort((a,b)=>{return parseFloat(a)-parseFloat(b);}).reverse();
        
        //construct row element with manga & website name properties,   
        let dom_manga = document.createElement("div");
        dom_manga.manga_name = name;
        dom_manga.website_name = manga.website_name;
        dom_manga.classList.add("list_line", filter_list && !(name.includes(filter_list)) ? "hidden" : "visible");
        
        //displaying the manga name 
        let dom_manga_text = document.createElement("div");
        dom_manga_text.classList.add("list_cell");
        dom_manga_text.title = name;
        //add text to the name
        let dom_name_node = document.createElement("span");
        dom_name_node.classList.add("name_text");
        let dom_name_text_node = document.createTextNode(name);
        dom_name_node.appendChild(dom_name_text_node);
        dom_manga_text.appendChild(dom_name_node);

        dom_manga.appendChild(dom_manga_text);
        
        //and number of unread chapters
        let dom_unread_number_node = document.createElement("div");
        dom_unread_number_node.classList.add("unread_number", "list_cell", "align_right", unread_chapters.length ? "red_text" : "green_text");
        let text_node = document.createTextNode(" ("+unread_chapters.length+")");
        dom_unread_number_node.appendChild(text_node);
        dom_manga.appendChild(dom_unread_number_node);
        
        
        //and the sorted chapter list (unread first, then read)
        
        let dom_select_td = document.createElement("div");
        dom_select_td.classList.add("list_cell");
        let dom_select = document.createElement("select");
        dom_select.classList.add("chapters_select", unread_chapters.length?"unread_chapter":"read_chapter");
        //update background when selected option changes
        dom_select.addEventListener("change", function(e){
            e.target.classList.remove("unread_chapter", "read_chapter");
            e.target.classList.add(e.target.options[e.target.selectedIndex].classList);}, false);
        
        for (let x in unread_chapters){
            let dom_option = document.createElement("option");
            dom_option.classList.add("unread_chapter");
            let dom_option_text = document.createTextNode(unread_chapters[x]);
            dom_option.appendChild(dom_option_text);
            
            dom_select.appendChild(dom_option);
        }
        for (let x in read_chapters){
            let dom_option = document.createElement("option");
            dom_option.classList.add("read_chapter");
            let dom_option_text = document.createTextNode(read_chapters[x]);
            dom_option.appendChild(dom_option_text);
            
            dom_select.appendChild(dom_option);
        }
        dom_select_td.appendChild(dom_select);
        dom_manga.appendChild(dom_select_td);
        
        //button to read chapter selected from the list. button needs listener to (1) call background function to reconstruct url, and (2) open link in new tab
        let dom_read_button_td = document.createElement("div");
        dom_read_button_td.classList.add("list_cell");
        dom_read_button_td.title = "open this chapter in a new tab";
        let dom_read_button = document.createElement("img");
        dom_read_button.classList.add("icons");
        dom_read_button.src = "../icons/read.svg"
        dom_read_button.addEventListener("click", 
                async function(e){	let my_manga = e.target.parentElement.parentElement;
                                    let manga_url = await background.reconstructChapterURL(my_manga.manga_name, my_manga.getElementsByClassName("chapters_select")[0].options[my_manga.getElementsByClassName("chapters_select")[0].selectedIndex].value); 
                                    browser.tabs.create({url:manga_url, active:false});
                                }
                , false);
        dom_read_button_td.appendChild(dom_read_button);
        dom_manga.appendChild(dom_read_button_td);

        //and a button to delete the manga from the list
        let dom_delete_button_td = document.createElement("div");
        dom_delete_button_td.classList.add("list_cell", "left");
        dom_delete_button_td.title = "delete this manga from your list";
        let dom_delete_button = document.createElement("img");
        dom_delete_button.classList.add("icons");
        dom_delete_button.src = "../icons/trash.svg"
        dom_delete_button.addEventListener("click", 
                async function(e){	let my_manga = e.target.parentElement.parentElement;
                                    await background.deleteManga(my_manga.manga_name);
                                    dom_mangas_list.removeChild(e.target.parentElement.parentElement);
                                }
                , false);
        dom_delete_button_td.appendChild(dom_delete_button);
        dom_manga.appendChild(dom_delete_button_td);

        //a spacer to avoid missclicks
        let dom_spacer_td = document.createElement("div");
        dom_spacer_td.classList.add("list_cell", "right");
        let dom_spacer = document.createElement("img");
        dom_spacer.classList.add("icons");
        dom_spacer.src = "../icons/icon_spacer.svg";
        dom_spacer_td.appendChild(dom_spacer);
        dom_manga.appendChild(dom_spacer_td);

        //and a button to toggle updating of a manga
        let dom_update_toggle_button_td = document.createElement("div");
        dom_update_toggle_button_td.classList.add("list_cell", "right");
        dom_update_toggle_button_td.title = "do / don't update this manga with the rest of the list";
        let dom_update_toggle_button = document.createElement("img");
        dom_update_toggle_button.update_state = manga["update"];
        dom_update_toggle_button.classList.add("icons");
        dom_update_toggle_button.src = "../icons/update_"+dom_update_toggle_button.update_state+".svg";
        dom_update_toggle_button.addEventListener("click", 
                async function(e){	let my_manga = e.target.parentElement.parentElement;
                                    await background.setMangaUpdate(my_manga.manga_name, !e.target.update_state);
                                    e.target.update_state = !e.target.update_state;
                                    dom_update_toggle_button.src = "../icons/update_"+dom_update_toggle_button.update_state+".svg";
                                }
                , false);
        dom_update_toggle_button_td.appendChild(dom_update_toggle_button);
        dom_manga.appendChild(dom_update_toggle_button_td);

        //and a button to mark all chapters as read
        let dom_read_all_button_td = document.createElement("div");
        dom_read_all_button_td.classList.add("list_cell", "right");
        dom_read_all_button_td.title = "mark all chapters as \"read\"";
        let dom_read_all_button = document.createElement("img");
        dom_read_all_button.classList.add("icons");
        dom_read_all_button.src = "../icons/read_all.svg"
        dom_read_all_button.addEventListener("click", 
                async function(e){	let my_manga = e.target.parentElement.parentElement;
                                    let chapters_list = "";
                                    let select_list = my_manga.getElementsByTagName("select");
                                    for (let selector in select_list) {
                                        if (select_list.hasOwnProperty(selector) && select_list[selector].classList.contains("chapters_select")) {
                                            chapters_list = select_list[selector];
                                        }
                                    }
                                    
                                    for (let index in chapters_list.options) {
                                        if (chapters_list.options.hasOwnProperty(index) && chapters_list.options[index].classList.contains("unread_chapter")){
                                            let manga_url = await background.reconstructChapterURL(my_manga.manga_name, chapters_list.options[index].value); 
                                            await background.readMangaChapter({"target" : "background", "url" : manga_url});
                                            chapters_list[index].classList.remove("unread_chapter");
                                            chapters_list[index].classList.add("read_chapter");
                                        } else break;
                                    }
                                    let unread_number = my_manga.getElementsByClassName("red_text")[0];
                                    if (unread_number) {
                                        unread_number.textContent = " (0)";
                                        unread_number.classList.remove("red_text");
                                        unread_number.classList.add("green_text");
                                        chapters_list.classList.remove("unread_chapter");
                                        chapters_list.classList.add("read_chapter");
                                    }
                                }
                , false);
        dom_read_all_button_td.appendChild(dom_read_all_button);
        dom_manga.appendChild(dom_read_all_button_td);

        
        //button to update now
        let dom_update_button_td = document.createElement("div");
        dom_update_button_td.classList.add("list_cell", "right");
        dom_update_button_td.title = "update (only) this manga now";
        let dom_update_button = document.createElement("img");
        dom_update_button.update_state = manga["update"];
        dom_update_button.classList.add("icons");
        dom_update_button.src = "../icons/update.svg"
        dom_update_button.addEventListener("click", 
                async function(e){	let my_manga = e.target.parentElement.parentElement;
                                    await background.updateMangasList(my_manga.manga_name, true);
                                    //refresh list
                                    document.getElementById("list_container").scrollmemory = window.scrollY;
                                }
                , false);
                dom_update_button_td.appendChild(dom_update_button);
        dom_manga.appendChild(dom_update_button_td);


        //option to choose preferred website
        let dom_choose_preferred_website_cell = document.createElement("div");
        dom_choose_preferred_website_cell.classList.add("list_cell", "right");
        dom_choose_preferred_website_cell.title = "choose the preferred website on which to update/read this manga";
        let dom_choose_preferred_website = document.createElement("select");
        dom_choose_preferred_website.classList.add("websites_select");
        //update preferred website when selected option changes
        dom_choose_preferred_website.addEventListener("change", async function(e){let my_manga = e.target.parentElement.parentElement;
                                                                                background.setPreferredWebsite(my_manga.manga_name, e.target.value);}, false);
        //add options
        let dom_option_title = document.createElement("option");
        dom_option_title_text = document.createTextNode("preferred website");
        dom_option_title.appendChild(dom_option_title_text);
        dom_option_title.setAttribute("disabled", "disabled");
        dom_choose_preferred_website.appendChild(dom_option_title);

        for (let website_name in background.websites_list){
            let dom_option = document.createElement("option");
            let dom_option_text = document.createTextNode(website_name);
            dom_option.appendChild(dom_option_text);
            if (website_name == prefered_websites[name])
                dom_option.selected = "selected";
            dom_choose_preferred_website.appendChild(dom_option);
        }
        dom_choose_preferred_website_cell.appendChild(dom_choose_preferred_website);
        dom_manga.appendChild(dom_choose_preferred_website_cell);

        
        //add manga to the unread array or to the read array
        if (unread_chapters.length)
            unread_mangas.push(dom_manga);
        else read_mangas.push(dom_manga);
    
    }
    
    for (let dom_manga in unread_mangas){
        dom_mangas_list.appendChild(unread_mangas[dom_manga]);
    }
    for (let dom_manga in read_mangas){
        dom_mangas_list.appendChild(read_mangas[dom_manga]);
    }

    //get back to scroll position
    if (document.getElementById("list_container").scrollmemory) {
        window.scrollTo(0, document.getElementById("list_container").scrollmemory);
        document.getElementById("list_container").scrollmemory = 0;
    }
}

createMangasList();

//filter the list when user types something
document.getElementById("filter_list").addEventListener("keyup", async (e) => {
	var list = document.getElementById("list").children;
	//filter the list
	for (let manga in list) {
        if (list.hasOwnProperty(manga)) {
            if (!(list[manga].manga_name.includes(e.target.value))) {
                list[manga].classList.add("hidden");
                list[manga].classList.remove("visible");
            } else {
                list[manga].classList.remove("hidden");
                list[manga].classList.add("visible");
            }
        }
    }
});

//clear the filter
document.getElementById("filter_clear").addEventListener("click", async (e) => {
    var filter = document.getElementById("filter_list");
    filter.value = "";
    var event = new Event('keyup', {
        'bubbles': true,
        'cancelable': true
    });
    filter.dispatchEvent(event);
});