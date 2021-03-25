const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = /* html */ `
<style>
:host {
    display: inline-block;
    height: 1em;
    width: 1em;

    position: relative;
    bottom: -2px;
}

svg {
    width: 100%;
    height: 100%;
}

.icon-container {
    width: 100%;
    height: 100%;
    color: currentColor;
}
</style>
<div aria-hidden="true" class="icon-container" id="container"></div>
`;

let ICONS_CACHE = {};

class IconComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
    this.props = {};
  }

  setIconContent(svgTemplate) {
    const container = this.shadowRoot.getElementById("container");
    container.innerHTML = "";
    if (svgTemplate) {
      container.appendChild(svgTemplate.content.cloneNode(true));
    }
  }

  get src() {
    return this.props.src;
  }

  set src(val) {
    this.props.src = val;
    if (!this.src) {
      this.setIconContent();
      return;
    }
    if (ICONS_CACHE[this.src]) {
      this.setIconContent(ICONS_CACHE[this.src]);
    } else {
      this.setIconContent("");
      fetch(this.src)
        .then((res) => res.text())
        .then((data) => {
          let template = document.createElement("template");
          template.innerHTML = data;
          if (
            Array.from(template.content.children).findIndex(
              (el) => el.tagName.toLowerCase() === "svg"
            ) < 0
          ) {
            throw new Error("Invalid icon, must contain an SVG at root");
          }
          ICONS_CACHE[this.src] = template;
          this.setIconContent(template);
        })
        .catch((err) => {
          console.error(err);
          this.error = err;
          this.iconContent = "";
        });
    }
  }

  get alt() {
    return this.props.alt;
  }

  set alt(val) {
    this.props.alt = val;
  }

  static get observedAttributes() {
    return ["src", "alt"];
  }

  attributeChangedCallback(name, _, newVal) {
    switch (name) {
      case "src":
        this.src = newVal;
        break;
      case "alt":
        this.alt = newVal;
        break;
    }
  }
}

window.customElements.define("ek-icon", IconComponent);
