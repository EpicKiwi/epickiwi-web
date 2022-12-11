import { queryCurrentPage } from "../js/lib/rdf-utils.js";
import {
  getAllCharacters,
  getAllFigures,
  getScenario,
} from "../js/lib/scenario-utils.js";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
<link rel="stylesheet" href="/src/css/lib/global.css" />
<link rel="stylesheet" href="/src/css/types.css" />
<style>

:host(.loading){
    display: none;
}

:host {
    display: flex;
    flex-wrap: wrap;

    margin-top: 10px;
    margin-bottom: 10px;

    background: var(--background-color);
    border: solid 1px currentcolor;

    padding: 10px;

    gaps: 10px;

    /*position: sticky;
    top: 10px;*/

    z-index: 20;
}

section {
    flex: 1;
    min-width: 300px;
}

h1, h2, h3, h4, h5, h6 {
    font-weight: normal;
}

.character-description::before {
    content: " – "
}

.character-description:empty {
    display: none;
}

ul {
    list-style-type: none;
}

ul ul {
  padding-left: 1em;
}

section > ul .organization {
  padding-left: 0.25em;
  padding-right: 0.25em;
  border-left: solid 1px currentcolor;
  margin-bottom: 0.5em;
  margin-top: 0.5em;
}

section > ul .organization .organization-name {
  font-weight: bold;
}

small, #media-list li[typeof] a::after {
    font-size: 0.85em;
}

#media-list li[typeof] a::after {
    content: " – " var(--type-label);
}

#main-button-container {
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;

    margin-bottom: 10px;
}

#brief-main-button {
  font-size: 25px;
  height: 1.5em;
  padding-left: calc((1.5em - 1ex) / 2);
  padding-right: calc((1.5em - 1ex) / 2);

  display: flex;
  justify-content: center;
  align-items: center;

  background: var(--background-color);
  border: solid 1px currentColor;
  border-radius: 3px;

  cursor: pointer;

  transition: ease 0.25s;
  transition-property: transform, font-size;
}

#brief-main-button .button-label {
    display: inline-block;
    font-size: 0.75em;
    font-weight: 300;
    white-space: nowrap;
    overflow: hidden;
    transition: ease 0.2s;
    transition-property: max-width, padding-left, opacity;
    transition-delay: 0.1s;
    max-width: 300px;
    padding-left: 0.5em;
    opacity: 1;
  }

:host(.scrolled) #brief-main-button .button-label {
    max-width: 0;
    opacity: 0;
    padding-left: 0;
}
  
#brief-main-button:hover .button-label,
#brief-main-button:active .button-label,
#brief-main-button:focus .button-label {
  max-width: 300px;
  padding-left: 0.5em;
  opacity: 1;
}

</style>

<div id="main-button-container">
    <button id="brief-main-button" title="Afficher l'aperçu" >&#10057;<span class="button-label">Aperçu du
  Scénario</span></button>
</div>

<section id="character-section" >
<h1>Personnages</h1>
<ul id="character-list"></ul>
</section>

<section id="media-section">
<h1>Media</h1>
<ul id="media-list"></ul>
</section>
`;

const CHARACTER_TEMPLATE = document.createElement("template");
CHARACTER_TEMPLATE.innerHTML = `<li><a class="character-link"><span class="character-name"></span><small class="character-description"></small></a></li>`;

const MEDIA_TEMPLATE = document.createElement("template");
MEDIA_TEMPLATE.innerHTML = `<li><a class="media-link"><span class="media-name"></span><small class="media-description"></small></a></li>`;

const ORG_TEMPLATE = document.createElement("template");
ORG_TEMPLATE.innerHTML = `<li class="organization" data-org-id=""><span class="organization-name"></span><ul></ul></li>`;

class BriefElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(TEMPLATE.content.cloneNode(true));

    this.classList.add("loading");
  }

  connectedCallback() {
    this.update().then(() => {
      this.classList.remove("loading");
    });
  }

  async update() {
    await Promise.all([this.updateCharacterList(), this.updateMediaList()]);
  }

  async updateCharacterList() {
    let characters = await getAllCharacters();

    console.log(characters)

    this.shadowRoot.getElementById("character-section").hidden =
      characters.length < 1;

    let charactersEl = characters.map((it) => {
      let el = CHARACTER_TEMPLATE.content.cloneNode(true);

      let link = el.querySelector(".character-link");
      if (it.url) {
        link.href = it.url;
      } else {
        link.parentElement.append(...link.childNodes);
        link.remove();
      }

      el.querySelector(".character-name").textContent = it.name;
      el.querySelector(".character-description").textContent =
        it.description || "";
      return [el, it];
    })

    let listEl = this.shadowRoot.getElementById("character-list");
    charactersEl.forEach(([el, c]) => {
      if(c.affiliatedTo?.length > 0){
        c.affiliatedTo.forEach((rel) => {
          let orgEl = listEl.querySelector(`[data-org-id="${rel.organization.id}"] ul`);

          if(!orgEl){
            let el = ORG_TEMPLATE.content.cloneNode(true);
            el.querySelector(".organization-name").textContent = rel.organization.name;
            el.querySelector(".organization").dataset.orgId = rel.organization.id;
            listEl.appendChild(el);
            orgEl = listEl.querySelector(`[data-org-id="${rel.organization.id}"] ul`);
          }

          orgEl.append(el.cloneNode(true));
        })
      } else {
        listEl.append(el)
      }
    })

  }

  async updateMediaList() {
    let media = await getAllFigures();

    this.shadowRoot.getElementById("media-section").hidden = media.length < 1;

    this.shadowRoot.getElementById("media-list").append(
      ...media.map((it) => {
        let el = MEDIA_TEMPLATE.content.cloneNode(true);

        let link = el.querySelector(".media-link");
        if (it.url) {
          link.href = it.url;
        } else {
          link.parentElement.append(...link.childNodes);
          link.remove();
        }

        el.querySelector(".media-name").textContent = it.name;

        let container = el.querySelector("li");

        container.setAttribute("typeof", it.type);
        container.setAttribute("resource", it.url);
        return el;
      })
    );
  }
}

customElements.define("ek-brief", BriefElement);
