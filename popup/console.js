//toggle "updating" console messages display
document.getElementById("console_updating").addEventListener("click", async (e) => {
	//initializing if it's not
	e.target.status ? "" : e.target.status = "showing";

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
	e.target.status ? "" : e.target.status = "showing";

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
		let log = message.log;
		let console_display = document.getElementById("console_display");
		let user_scrolled = !(console_display.scrollHeight - console_display.clientHeight <= console_display.scrollTop + 1);

		let existing_line = document.getElementById(log.manga + " - " + log.from);

		if (!existing_line) {
			//displaying updates status
			//main line (name + website + status)
			let manga = document.createElement("div");
			manga.classList.add("console_line_container", document.getElementById("console_updating").status == "hiding" ? ("hidden") : "dummy");
			manga.setAttribute("id", log.manga + " - " + log.from);
			manga.status = log.status;

			//name 
			let retrieving = document.createElement("div");
			retrieving.classList.add("left", "console_line", "console_name_text");
			//name tooltip
			retrieving.title = log.manga.replace(/_/g, " ");
			retrieving.innerText = "retrieving "+log.manga.replace(/_/g, " ");
			manga.appendChild(retrieving);

			//website 
			let from = document.createElement("div");
			from.classList.add("console_from", "left", "console_line");
			from.innerText = " from "+log.from;
			manga.appendChild(from);

			//status 
			let status = document.createElement("div");
			status.classList.add("left", "console_status", "console_line");
			status.innerText = " - status : "+log.status;
			manga.appendChild(status);

			//toggle details display
			manga.addEventListener("click", function(e){this.getElementsByClassName("console_details")[0].innerText != "" ? this.getElementsByClassName("console_details")[0].classList.toggle("hidden") : false;});
			console_display.appendChild(manga);

			//details line
			let manga_details = document.createElement("div");
			manga_details.classList.add((log.status == "errors" ? "red_text" : "hidden"), "left", "console_details");
			manga_details.innerText = log.details != "" ? " details : "+log.details : "";
			manga.appendChild(manga_details);
			
		} else {
			existing_line.status = log.status;
			let status = existing_line.getElementsByClassName("console_status")[0];
			status.innerText = " - status : "+log.status;
			if (log.status == "completed") {
				status.classList.remove("red_text");
				status.classList.add("green_text");
				document.getElementById("console_completed").status == "hiding" ? existing_line.classList.add("hidden") : existing_line.classList.remove("hidden");
			}  else if (log.status == "errors") {
				existing_line.classList.remove("hidden");
				status.classList.remove("green_text");
				status.classList.add("red_text");
				document.getElementById("console_errors").status == "hiding" ? existing_line.classList.add("hidden") : existing_line.classList.remove("hidden");
			} else {
				status.classList.remove("red_text");
				status.classList.remove("green_text");
				document.getElementById("console_updating").status == "hiding" ? existing_line.classList.add("hidden") : existing_line.classList.remove("hidden");
			}

			let details = existing_line.getElementsByClassName("console_details")[0];
			details.innerText = log.details != "" ? " details : "+log.details : "";
			details.classList.remove("red_text", "hidden");
			details.classList.add((log.status == "errors" ? "red_text" : "hidden"), "left", "console_details");
		}
		
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
            background.setBadgeNumber();
            await createMangasList();
		}
	}
}
