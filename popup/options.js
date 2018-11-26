//toggle the "check all sites when updating the list" option
document.getElementById("check_all_sites").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();
	await background.toggleCheckAllSites();
	displayCheckAllSites();
});

//display the status of the "check all sites when updating the list" option
async function displayCheckAllSites(){
	var background = await browser.runtime.getBackgroundPage();
	var check_all = await background.getCheckAllSites();
    document.getElementById("check_all_sites_tickbox").src = check_all ? "../icons/yes.svg" : "../icons/no.svg";
}

//initialize the "check all sites when updating the list" option
displayCheckAllSites();

//toggle the navigation bar option
document.getElementById("navigation_bar_tickbox").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();
	await background.toggleNavigationBar();
	displayNavigationBar();
});

//display the status of the navigation bar option
async function displayNavigationBar(){
	var background = await browser.runtime.getBackgroundPage();
	var nav_bar = await background.getNavigationBar();
    document.getElementById("navigation_bar_tickbox").src = nav_bar ? "../icons/yes.svg" :"../icons/no.svg";
}

//initialize the navigation bar option
displayNavigationBar();

//export the mangas list
document.getElementById("export").addEventListener("click", async (e) => {
	var background = await browser.runtime.getBackgroundPage();

	var export_text = document.getElementById("export");

	export_text.textContent = "...";
	var fail = await background.exportMangasList();
	if (!fail){
		export_text.textContent = "list exported";
	} else {
		export_text.textContent = "error, try again";
	}
	setTimeout(()=>{export_text.textContent = "export mangas list";},3000);
});

//import the mangas list
async function importListAsText() {
    
    let import_option = "";
    let inputs = document.getElementsByName("import_option");
    let option_checked = false;
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].checked) {
            import_option = inputs[i].value;
            option_checked = true;
        }
    }
    
    if (option_checked) {
        let json = document.getElementById("import_as_text_field").value;
        if (json != "") {
            let parsed_json = JSON.parse(json);
            document.getElementById("import_as_text_desc").textContent = "...";

            let background = await browser.runtime.getBackgroundPage();
            var fail = await background.importMangasList(parsed_json, import_option);
            if (!fail){
                document.getElementById("import_as_text_desc").textContent = "list imported";
                document.getElementById("import_as_text_field").value = "";
            } else {
                document.getElementById("import_as_text_desc").textContent = "error, try again";
            }
            setTimeout(()=>{document.getElementById("import_as_text_desc").textContent = "import mangas list";
                            document.getElementById("visible_import").textContent = "[choose a file]";
                            for (let i = 0; i < inputs.length; i++) {
                                inputs[i].checked = false;
                            }
            },3000);
        }
    } else {
        alert("please select an import option first (merge/replace)");
    }
}

document.getElementById("import_as_text_agree").addEventListener("click", (e)=>importListAsText(), false);
document.getElementById("import_as_text_field").addEventListener("change", (e)=>importListAsText(), false);

document.getElementById("import_as_file").addEventListener("click", async (e) => {
	browser.runtime.openOptionsPage();
});