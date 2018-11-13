//display the version
document.getElementById("details").textContent = "MangasSubscriber_DEV_BRANCHE " + browser.runtime.getManifest().version;

//open the options page
document.getElementById("options").addEventListener("click", async (e) => {
	window.location.href = ("../options/options.html");
});