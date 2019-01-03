//store the background page in a global var
var background = null;
(async ()=>{background = await browser.runtime.getBackgroundPage();})();

//display the version
document.getElementById("version").textContent = browser.runtime.getManifest().version;

//initialize follow button
async function initializeFollowButton(){
	var manga_name = "notAManga";
	var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
	manga_name = background.getMangaName(url);
	if (manga_name == "notAManga"){
        document.getElementById("follow").title = "can't follow this";
		document.getElementById("follow_icon").src = "../icons/not_followable.svg";
	} else if (await background.isMangaFollowed(manga_name)){
		document.getElementById("follow").title = "already followed";
		document.getElementById("follow_icon").src = "../icons/followed.svg";
	} else {
		document.getElementById("follow").title = "follow this manga";
		document.getElementById("follow_icon").src = "../icons/follow.svg";
	}
}

initializeFollowButton();


document.getElementById("follow").addEventListener("click", async (e) => {
	switch (document.getElementById("follow").title) {
		case "follow this manga" :
			var url = (await browser.tabs.query({active: true, currentWindow: true}))[0].url;
            document.getElementById("follow").title = "please wait";
            document.getElementById("follow_icon").src = "../icons/dots.svg";
			var fail = await background.followManga(url);
			if (!fail){
                document.getElementById("follow").title = "now following";
                document.getElementById("follow_icon").src = "../icons/followed.svg";
				setTimeout(async ()=>{document.getElementById("follow").title = "already followed"; createMangasList();},3000);
			} else {
                document.getElementById("follow").title = "error, try again";
                document.getElementById("follow_icon").src = "../icons/followed.svg";
                document.getElementById("follow_icon").style.border = "2px solid red";
				setTimeout(()=>{document.getElementById("follow").title = "follow this manga"; document.getElementById("follow_icon").style.border = "";},3000);
			}
			break;
	}
});

function selectTab (id) {
    let selected_tab = document.getElementsByClassName("selected_tab")[0];
    if (selected_tab) {
        selected_tab.classList.remove("selected_tab");
        if (id && selected_tab.id != id) document.getElementById(id).classList.add("selected_tab");
    } else if (id) document.getElementById(id).classList.add("selected_tab");
}

document.getElementById("menu").addEventListener("click", async (e) => {
    var tabs = {"options_toggle":"options", "console_toggle":"console", "help_toggle":"help"};
    let refresh_list = true;
    //if target has a panel attached
    if (tabs[e.target.parentElement.id]) {
        let visible = document.getElementById(tabs[e.target.parentElement.id]).classList.contains("visible_panel");
        //update buttons
        selectTab(e.target.parentElement.id);
        //hide panels
        for (let i in tabs) document.getElementById(tabs[i]).classList.remove("visible_panel");
        //if target was already hidden, show it
        if (!visible) {
            document.getElementById(tabs[e.target.parentElement.id]).classList.add("visible_panel");
            refresh_list = false; // no need to refresh the list if we're showing a panel on top
        }
    }
    else {
        //update buttons
        selectTab();
        //hide panels
        for (let i in tabs) document.getElementById(tabs[i]).classList.remove("visible_panel");
    }
    if (refresh_list) setTimeout(createMangasList, 1000); //wait for the sliding animation to finish before refreshing the list to avoid stuttering
    
});

