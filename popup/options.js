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
document.getElementById("hidden_import").addEventListener("change", async (e) => {
    var file = e.target.files[0];
    //retrieve the chosen import option
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
        document.getElementById("visible_import").textContent = "["+ document.getElementById("hidden_import").files[0].name +"]";
        document.getElementById("import_text").textContent = "...";

        let background = await browser.runtime.getBackgroundPage();
        var fail = await background.importMangasList(file, import_option);
        if (!fail){
            document.getElementById("import_text").textContent = "list imported";
        } else {
            document.getElementById("import_text").textContent = "error, try again";
        }
        setTimeout(()=>{document.getElementById("import_text").textContent = "import mangas list";
                        document.getElementById("visible_import").textContent = "[choose a file]";
                        for (let i = 0; i < inputs.length; i++) {
                            inputs[i].checked = false;
                        }
        },3000);
    } else {
        alert("please select an import option first (merge/replace)");
    }
});