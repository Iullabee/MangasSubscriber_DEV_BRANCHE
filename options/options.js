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

        var reader = new FileReader();
        reader.onloadend = async function(e){let parsed_json = JSON.parse(e.target.result);
            let background = await browser.runtime.getBackgroundPage();
            var fail = await background.importMangasList(parsed_json, import_option);
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
		};
        reader.readAsText(file);

    } else {
        alert("please select an import option first (merge/replace)");
    }

});