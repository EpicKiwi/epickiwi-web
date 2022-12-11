const TEMPLATE = document.createElement("template")
TEMPLATE.innerHTML = `
<style>

:host {
    border-left: 1px currentColor solid;
    display: block;
}

pre {
    white-space: pre-wrap;
    margin-left: 1em;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
}
</style>
<pre part="pre"><code><slot></slot></code></pre>`

class CodeSnippetElement extends HTMLElement {

    #src = null;

    get src() {
        return this.#src
    }

    set src(val) {
        this.#src = val;
        this.updateContent();
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
    }

    connectedCallback(){
        this.addEventListener("click", () => {
            let range = document.createRange()
            range.selectNodeContents(this);
            document.getSelection().addRange(range)
        });
    }

    async updateContent() {
        if (!this.src) this.textContent = "";

        try {
            let res = await fetch(new URL(this.src, this.baseURI), { credentials: "include" });
            if (!res.ok) {
                this.dispatchEvent(new Event("error"));
                return;
            }

            this.textContent = await res.text()
        } catch (e) {
            this.dispatchEvent(new Event("error"));
        }
        
        this.dispatchEvent(new Event("load"));

    }

    static get observedAttributes() {
        return ["src"]
    }

    attributeChangedCallback(name, oldVal, newVal) {
        switch (name) {
            case "src":
                this.src = newVal;
                return;
        }
    }

}

customElements.define("ek-code-snippet", CodeSnippetElement)