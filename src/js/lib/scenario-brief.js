import {
  getAbstract,
  getAllCharacters,
  getAllFigures,
  getTitle,
} from "./scenario-utils.js";

const MAIN_BUTTON = document.createElement("template");
MAIN_BUTTON.innerHTML = `
<div class="brief-panel">
  <button id="brief-main-button" title="Afficher l'aperçu" >&#10057;<span class="button-label">Aperçu du
  Scénario</span></button>

<aside id="brief-content" hidden>
  <div class="brief-section" id="brief-character-list-section">
    <h1>Personnages</h1>
    <ul id="brief-character-list"></ul>
  </div>

  <div class="brief-section" id="brief-figure-list-section">
    <h1>Media</h1>
    <ul id="brief-figure-list"></ul>
  </div>
</aside>

</div>

<template id="brief-character-template">
  <li><a class="character-anchor character-name"></a></li>
</template>

<template id="brief-figure-template">
  <li><a class="figure-anchor figure-name"></a></li>
</template>

`;

function updateBriefContent() {
  let root = document.getElementById("brief-content");

  let characters = getAllCharacters();
  root.querySelector("#brief-character-list-section").hidden =
    characters.length == 0;

  let characterTemplate = document.getElementById("brief-character-template");

  let characterList = document.getElementById("brief-character-list");
  characterList.innerHTML = "";
  characters
    .map((el) => {
      el.generateId();

      let elt = characterTemplate.content.cloneNode(true);
      elt.querySelector(".character-name").innerHTML = el.name;
      elt.querySelector(".character-anchor").href = "#" + el.id;
      return elt;
    })
    .forEach((el) => characterList.appendChild(el));

  let figureTemplate = document.getElementById("brief-figure-template");

  let figures = getAllFigures();
  root.querySelector("#brief-figure-list-section").hidden =
    characters.length == 0;
  let figureList = root.querySelector("#brief-figure-list");
  figureList.innerHTML = "";

  figures
    .map((el) => {
      el.generateId();

      let elt = figureTemplate.content.cloneNode(true);
      elt.querySelector(".figure-name").innerHTML = el.caption;
      elt.querySelector(".figure-anchor").href = "#" + el.id;
      return elt;
    })
    .forEach((el) => figureList.appendChild(el));
}

function insertAside() {
  let buttonEl = MAIN_BUTTON.content.cloneNode(true);

  let header = document.querySelector("main header");

  header.parentElement.insertBefore(buttonEl, header.nextElementSibling);
}

export async function initScenarioBrief() {
  insertAside();
  updateBriefContent();

  let toggleButtonEl = document.getElementById("brief-main-button");
  let contentEl = document.getElementById("brief-content");

  let updateBtnState = function updateBtnState() {
    toggleButtonEl.classList.toggle("opened", !contentEl.hidden);
    document.body.classList.toggle("brief-opened", !contentEl.hidden);
  };

  toggleButtonEl.addEventListener("click", () => {
    contentEl.hidden = !contentEl.hidden;
    updateBtnState();
  });
  updateBtnState();
}
