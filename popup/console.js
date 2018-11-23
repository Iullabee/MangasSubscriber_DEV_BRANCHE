//toggle "updating" console messages display
document.getElementById("console_updating").addEventListener("click", async (e) => {
	//initializing if it's not
	e.target.status ? "" : e.target.status = "hiding";


	e.target.status == "hiding" ? e.target.status = "showing" :	e.target.status = "hiding";
	let messages = document.getElementsByClassName("console_line_container");
	if (messages.length > 0) {
		for (let index in messages){
			if (messages[index].status == "updating")
				e.target.status == "showing" ? messages[index].classList.remove("hidden") : messages[index].classList.add("hidden");
		}
	}
	e.target.status == "showing" ? e.target.firstChild.textContent = "updating (hide)" : e.target.firstChild.textContent = "updating (show)";
});

//toggle "completed" console messages display
document.getElementById("console_completed").addEventListener("click", async (e) => {
	//initializing if it's not
	e.target.status ? "" : e.target.status = "hiding";


	e.target.status == "hiding" ? e.target.status = "showing" :	e.target.status = "hiding";
	let messages = document.getElementsByClassName("console_line_container");
	if (messages.length > 0) {
		for (let index in messages){
			if (messages[index].status == "completed")
				e.target.status == "showing" ? messages[index].classList.remove("hidden") : messages[index].classList.add("hidden");
		}
	}
	e.target.status == "showing" ? e.target.firstChild.textContent = "completed (hide)" : e.target.firstChild.textContent = "completed (show)";
});

//turn console_errors div into a copy errors details to clipboard button if console_errors_number > 0
document.getElementById("console_errors").addEventListener("click", (e) => {
	let details = document.getElementsByClassName("console_details");
	let details_text = "";
	for (let index in details){
		if (details[index].classList) {
			details_text += details[index].classList.contains("red_text") ? details[index].textContent+"\n" : "";
		}
	}
	navigator.clipboard.writeText(details_text);
});

//listen to background script, and display console messages
browser.runtime.onMessage.addListener(updateConsole);

async function updateConsole(message) {
	if  (message.target == "popup" && message.log){
		var log = message.log;
		var console_display = document.getElementById("console_display");
		var user_scrolled = !(console_display.scrollHeight - console_display.clientHeight <= console_display.scrollTop + 1);

		//displaying updates status
		//main line (name + website + status)
		let manga = document.createElement("div");
		manga.classList.add("console_line_container");
		manga.setAttribute("id", log.manga+log.from+log.status);
		manga.status = log.status;

		//name 
		let retrieving = document.createElement("div");
		retrieving.classList.add("left", "console_line");
		//name tooltip
		retrieving.title = log.manga.replace(/_/g, " ");
		//add text to the name
		let retrieving_text = document.createElement("span");
		retrieving_text.classList.add("console_name_text");
		let retrieving_text_node = document.createTextNode("retrieving "+log.manga.replace(/_/g, " "));
		retrieving_text.appendChild(retrieving_text_node);
		retrieving.appendChild(retrieving_text);
		manga.appendChild(retrieving);

		//website 
		let from = document.createElement("div");
		from.classList.add("console_from", "left", "console_line");
		let from_text_node = document.createTextNode(" from "+log.from);
		from.appendChild(from_text_node);
		manga.appendChild(from);

		//status 
		let status = document.createElement("div");
		status.classList.add("left", "console_status", "console_line");
		if (log.status == "completed") {
			status.classList.add("green_text");
			manga.classList.add("hidden");
		}  else if (log.status == "errors") {
			status.classList.add("red_text");
		} else manga.classList.add("hidden");
		let status_text_node = document.createTextNode(" - status : "+log.status);
		status.appendChild(status_text_node);
		manga.appendChild(status);

		//toggle details display
		manga.addEventListener("click", 
								function(e){	if (log.details != "") {
														let details = document.getElementById(this.id+"details");
														details.classList.toggle("hidden");
													}
												}
								, false);
		console_display.appendChild(manga);

		//details line
		let manga_details = document.createElement("div");
		manga_details.setAttribute("id", log.manga+log.from+log.status+"details");
		let details = document.createElement("span");
		details.classList.add((log.status == "errors" ? "red_text" : "dummy"), "left", "console_details");
		let details_text_node = document.createTextNode((log.details != "" ? " details : "+log.details : ""));
		details.appendChild(details_text_node);
		manga_details.classList.add(log.status == "errors" ? "dummy" : "hidden");
		manga_details.appendChild(details);
		console_display.appendChild(manga_details);
		
		if (!user_scrolled)
			console_display.scrollTop = console_display.scrollHeight - console_display.clientHeight;

		//updating console recap numbers
		if (log.status == "updating") {
			let updating_number = document.getElementById("console_updating_number");
			if (!updating_number.value)
				updating_number.value = 0;
			updating_number.value += 1;
			updating_number.textContent = "("+updating_number.value+")";
		} else {
			let updating_number = document.getElementById("console_updating_number");
			updating_number.value -= 1;
			updating_number.textContent = "("+updating_number.value+")";
			let finished_number = document.getElementById("console_"+log.status+"_number");
			if (!finished_number.value)
				finished_number.value = 0;
			finished_number.value += 1;
			finished_number.textContent = "("+finished_number.value+")";
        }
        
        //updating browser action when update is finished
		if (document.getElementById("console_updating_number").value == 0) {
            var background = await browser.runtime.getBackgroundPage();
            background.setBadgeNumber();
            await createMangasList();
		}
	}
}