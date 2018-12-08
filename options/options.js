//import the mangas list
document.getElementById("hidden_import").addEventListener("change", async (e) => {
    var file = e.target.files[0];
    
    document.getElementById("visible_import").textContent = "["+ document.getElementById("hidden_import").files[0].name +"]";
    document.getElementById("import_text").textContent = "...";

    var reader = new FileReader();
    reader.onloadend = async function(e){let parsed_json = JSON.parse(e.target.result);
        let background = await browser.runtime.getBackgroundPage();
        var fail = await background.importMangasList(parsed_json);
        if (!fail){
            document.getElementById("import_text").textContent = "list imported";
        } else {
            document.getElementById("import_text").textContent = "error, try again";
        }
        setTimeout(()=>{document.getElementById("import_text").textContent = "import mangas list";
                        document.getElementById("visible_import").textContent = "[choose a file]";
        },3000);
    };
    reader.readAsText(file);
});