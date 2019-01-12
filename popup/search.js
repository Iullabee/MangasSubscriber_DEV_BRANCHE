function searchWebsitesFor () {
    if (document.getElementById("search_field").value == "") hideModal();
    else {
        let search = document.getElementById("search_field").value;
        //create modal title
        let title = "looking for ["+search+"] :";
        //create modal body
        let results = [];
        for (let website_name in background.websites_list) {
            if (background.websites_list.hasOwnProperty(website_name)) {
                let list_line = document.createElement("div");
                list_line.classList.add("modal_list_line", "search_modal_list_line");
                
                let toggleHidden = async function (event) {
                    event.stopPropagation();
                    let links_list = event.target.parentElement.getElementsByClassName("links_list")[0];
                    links_list.classList.toggle("hidden");
                }

                let name = document.createElement("h2");
                name.classList.add("name_text");
                name.innerText = website_name;
                //eventlistener on click to set toggle this site as registered
                name.addEventListener("click", toggleHidden);
                list_line.appendChild(name);

                let links_list = document.createElement("div");
                links_list.classList.add("links_list");
                
                links_list.innerText = "searching, please wait...";
                background.websites_list[website_name].searchFor(search).then((links) => {
                    links_list.innerText = "";
                    for (let name in links) {
                        if (links.hasOwnProperty(name)) {
                            let container = document.createElement("div");
                            container.classList.add("result_line");
                            let name_span = document.createElement("span");
                            name_span.innerText = background.getMangaName(links[name]) + " ";
                            let link = document.createElement("a");
                            link.href = links[name];
                            link.target = "_blank";
                            link.innerText = "(link)";
                            name_span.appendChild(link);
                            container.appendChild(name_span);
                            links_list.appendChild(container);
                        }
                    }
                });
                
                list_line.appendChild(links_list);
                results.push(list_line);
            }
        }
        //no modal agree
        revealModal(title, results);
    }
}



//search the websites when user types something
document.getElementById("search_field").addEventListener("change", async (e) => {
	searchWebsitesFor();
});

//clear the search field
document.getElementById("search_field_clear").addEventListener("click", async (e) => {
    var filter = document.getElementById("search_field");
    filter.value = "";
});
