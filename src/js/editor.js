import "./layout.js"

{
    let editorButton = document.createElement("button")
    editorButton.className = "editor-button"
    editorButton.dataset.transient = true;
    editorButton.slot = "footer";
    editorButton.id = "editor-button";
    editorButton.textContent = "Éditer..."
    editorButton = document.body.appendChild(editorButton)
    editorButton.addEventListener("click", async e => {
        e.target.disabled = true;
        let { toggleEditor } = await import("./editor-app.js");
        toggleEditor();
        e.target.disabled = false;
    })
}