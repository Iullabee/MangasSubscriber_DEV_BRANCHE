//set and show the modal
function revealModal(title, content_elements, onAgree) {
    let modal = document.getElementById("modal_background");
    let modal_title = document.getElementById("modal_title");
    modal_title.innerText = title;
    let modal_content = document.getElementById("modal_content");
    for (let i in content_elements) {
        modal_content.appendChild(content_elements[i]);
    }
    if (onAgree) {
        let modal_agree = document.getElementById("modal_agree");
        modal_agree.addEventListener("click", onAgree, false);
        modal_agree.classList.remove("hidden");
        let modal_cancel = document.getElementById("modal_cancel");
        modal_cancel.classList.remove("hidden");
        let modal_dismiss = document.getElementById("modal_dismiss");
        modal_dismiss.classList.add("hidden");
    } else {
        let modal_agree = document.getElementById("modal_agree");
        modal_agree.classList.add("hidden");
        let modal_cancel = document.getElementById("modal_cancel");
        modal_cancel.classList.add("hidden");
        let modal_dismiss = document.getElementById("modal_dismiss");
        modal_dismiss.classList.remove("hidden");
    }
    modal.classList.add("show_modal");
}

//reset and hide the modal
function hideModal() {
    let modal_title = document.getElementById("modal_title");
    modal_title.innerText = "";
    
    let modal_content = document.getElementById("modal_content");
    while (modal_content.firstChild) {modal_content.removeChild(modal_content.firstChild);}
    
    let modal_agree = document.getElementById("modal_agree");
    modal_agree.classList.add("hidden");
    
    let modal_cancel = document.getElementById("modal_cancel");
    modal_cancel.classList.add("hidden");
    
    let modal_dismiss = document.getElementById("modal_dismiss");
    modal_dismiss.classList.add("hidden");
    
    let modal = document.getElementById("modal_background");
    modal.classList.remove("show_modal");
}

document.getElementById("modal_background").addEventListener("click", async (e) => {
    e.stopPropagation();
    hideModal();
});

document.getElementById("modal_cancel").addEventListener("click", async (e) => {
    e.stopPropagation();
    hideModal();
});

document.getElementById("modal_dismiss").addEventListener("click", async (e) => {
    e.stopPropagation();
    hideModal();
});

document.getElementById("modal_window").addEventListener("click", async (e) => {
    //just stopping propagation in the modal window to avoid modal_background destroying the modal
    e.stopPropagation();
});
