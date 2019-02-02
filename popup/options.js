//toggle the "unified chapter numbers" option
document.getElementById("unified_chapter_numbers").addEventListener("click", async (e) => {
	await background.toggleUnifiedChapterNumbers();
	displayUnifiedChapterNumbers();
});

//display the status of the "unified chapter numbers" option
async function displayUnifiedChapterNumbers(){
	var check_all = await background.getUnifiedChapterNumbers();
	document.getElementById("unified_chapter_numbers_tickbox").src = check_all ? "../icons/yes.svg" : "../icons/no.svg";
}
//initialize the "unified chapter numbers" option
displayUnifiedChapterNumbers();



//toggle the "check all sites when updating the list" option
document.getElementById("check_all_sites").addEventListener("click", async (e) => {
	await background.toggleCheckAllSites();
	displayCheckAllSites();
});

//display the status of the "check all sites when updating the list" option
async function displayCheckAllSites(){
	var check_all = await background.getCheckAllSites();
	document.getElementById("check_all_sites_tickbox").src = check_all ? "../icons/yes.svg" : "../icons/no.svg";
}
//initialize the "check all sites when updating the list" option
displayCheckAllSites();



//toggle the navigation bar option
document.getElementById("navigation_bar_tickbox").addEventListener("click", async (e) => {
	await background.toggleNavigationBar();
	displayNavigationBar();
});

//display the status of the navigation bar option
async function displayNavigationBar(){
	var nav_bar = await background.getNavigationBar();
	document.getElementById("navigation_bar_tickbox").src = nav_bar ? "../icons/yes.svg" :"../icons/no.svg";
}
//initialize the navigation bar option
displayNavigationBar();



//change the auto update interval (waits 0.5s after user stops changing it before setting it to avoid firing a ton of background stuff from scrolling the numbers)
var delay = null;
document.getElementById("auto_update_interval").addEventListener("change", async (e) => {
	if (delay) clearTimeout(delay);
	delay = setTimeout(async ()=>{
		delay = null;
		await background.setAutoUpdate(e.target.value);
		displayAutoUpdateInterval();
	}, 500);
});

//display the auto update interval
async function displayAutoUpdateInterval(){
	var auto_update_interval = await background.getAutoUpdateInterval();
	document.getElementById("auto_update_interval").value = auto_update_interval;
}
//initialize the auto update interval
displayAutoUpdateInterval();



//change the search results limit (waits 0.5s after user stops changing it before setting it to avoid firing a ton of background stuff from scrolling the numbers)
document.getElementById("search_limit_number").addEventListener("change", async (e) => {
	if (delay) clearTimeout(delay);
	delay = setTimeout(async ()=>{
		delay = null;
		await background.setSearchLimit(e.target.value);
		displayAutoUpdateInterval();
	}, 500);
});

//display the search results limit
async function displaySearchLimit(){
	var search_limit_number = await background.getSearchLimit();
	document.getElementById("search_limit_number").value = search_limit_number;
}
//initialize the search results limit
displaySearchLimit();



//export the mangas list as a local file
document.getElementById("export").addEventListener("click", async (e) => {

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



//import the mangas list from a local file
document.getElementById("import_as_file").addEventListener("click", async (e) => {
	browser.runtime.openOptionsPage();
});



//export the mangas list online
document.getElementById("export_online").addEventListener("click", async (e) => {
	var export_text = document.getElementById("export_online");
	export_text.textContent = "...";
	var fail = await background.exportMangasListOnline();
	if (!fail){
		export_text.textContent = "list exported";
	} else {
		export_text.textContent = "error, try again";
	}
	setTimeout(()=>{export_text.textContent = "export list to pastebin";},3000);
});



//import the mangas list online
document.getElementById("import_online").addEventListener("click", async (e) => {
	let json = "";
	let key = await background.getSyncListURL();

	let request = new XMLHttpRequest();
	request.open("POST", "https://pastebin.com/api/api_raw.php", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.send("api_dev_key=4f96e913faf4b10d77bd99304939270a&api_user_key=ff7e23814c18e02ebe244dc3aa70b020&api_option=show_paste&api_paste_key="+ key);

	request.onreadystatechange = async function() {
		if (this.readyState == 4 && this.status == 200) {
			json = this.responseText;
			if (json.split("Bad API request")[1] || json.split("Paste Removed")[1]) json = "";

			if (json != "") {
				let decoded_json = decodeURIComponent(json);
				let parsed_json = JSON.parse(decoded_json);
				document.getElementById("import_online").textContent = "...";
	
				var fail = await background.importMangasList(parsed_json);
				if (!fail){
					document.getElementById("import_online").textContent = "list imported";
				} else {
					document.getElementById("import_online").textContent = "error, try again";
				}
				setTimeout(()=>{document.getElementById("import_online").textContent = "import list from pastebin";},3000);
			}
		}
	};
});

