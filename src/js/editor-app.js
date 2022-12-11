{
  document.addEventListener("keydown", (e) => {
    if (
      e.ctrlKey &&
      e.key == "Enter" &&
      isEditing() &&
      e.target.hasAttribute("contenteditable")
    ) {
      focusNextElement(e.target);
    }
  });
}

{
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && !e.shiftKey && e.key == "s" && isEditing()) {
      e.preventDefault();
      save();
    }
  });
}

let draggingElement = null;

{
  document.addEventListener("dragenter", (e) => {
    if (isEditing()) {
      e.preventDefault();
    }
  });

  document.addEventListener("drop", (e) => {
    if (isEditing()) {
      let nextSelected = document.querySelector(".drag-result");

      for (let el of document.querySelectorAll(".drag-result")) {
        el.classList.remove("drag-result");
      }

      if (draggingElement) {
        draggingElement.remove();
      }

      e.preventDefault();
      setupToolbarListener(nextSelected.parentElement);
      focusElement(nextSelected);
    }
  });

  document.addEventListener("dragend", (e) => {
    if (isEditing()) {
      for (let el of document.querySelectorAll(".drag-result")) {
        el.remove();
      }
    }
  });

  document.addEventListener("dragover", (e) => {
    let html = e.dataTransfer.getData("text/html");

    if (!html) return;

    let targetEl = findNearestBlockElement(e.clientX, e.clientY);

    if (targetEl.classList.contains("drag-result")) {
    } else {
      for (let el of document.querySelectorAll(".drag-result")) {
        el.remove();
      }

      let targetElRect = targetEl.getBoundingClientRect();

      let yInEl = e.clientY - targetElRect.top;

      let template = document.createElement("template");
      template.innerHTML = html;

      for (let el of template.content.children) {
        el.classList.add("drag-result");
      }

      if (targetEl.parentElement) {
        if (yInEl < targetElRect.height / 2) {
          targetEl.parentElement.insertBefore(
            template.content.cloneNode(true),
            targetEl
          );
        } else if (targetEl.nextElementSibling) {
          targetEl.parentElement.insertBefore(
            template.content.cloneNode(true),
            targetEl.nextElementSibling
          );
        } else {
          targetEl.parentElement.appendChild(template.content.cloneNode(true));
        }
      }
    }
  });
}

{
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#editor-toolbar")) {
      closeToolbarSubmenu();
    }
  });
}

function findNearestBlockElement(x, y) {
  return document
    .elementsFromPoint(x, y)
    .find(
      (el) =>
        !el.closest("[data-transient]") &&
        window.getComputedStyle(el).display != "inline"
    );
}

let lastTemplateAdded = null;
let toolbarFocusElement = null;

/**
 * Mark an element as Transient
 *
 * This element will not be saved in the final HTML
 *
 * @param {HTMLElement} element
 */
export function makeTransient(element) {
  element.dataset.transient = true;
}

/**
 * Return if the current page is being edited
 * @returns {bool} If the current page is being edited
 */
export function isEditing() {
  return document.body.classList.contains("editing");
}

/**
 * Focus an element for edition
 *
 * Options :
 * - `selectContent` Select all content of the element after focus
 *
 * @param {HTMLElement} element
 * @param {{selectContent: bool}} options
 */
export function focusElement(element, options = { selectContent: false }) {
  options = {
    selectContent: false,
    ...options,
  };

  element.focus();
  element.dispatchEvent(new FocusEvent("focus"));

  if (options.selectContent) {
    window.getSelection().selectAllChildren(element);
  }
}

export function focusNextElement(source, direction = 1) {
  let editableElements = Array.from(
    document.querySelectorAll("[contenteditable]")
  );
  let i = editableElements.indexOf(source);

  if (i < 0) i = 0;
  else i = Math.max(i + direction, 0);

  let nextElement = editableElements[i];

  if (nextElement) {
    focusElement(nextElement);
  } else if (direction > 1) {
    focusElement(editableElements[editableElements.length - 1]);
  } else if (lastTemplateAdded) {
    appendTemplate(lastTemplateAdded);
  }
}

/**
 * Get all element eligible to direct edition
 * @param {HTMLElement} rootElement
 * @returns
 */
function getEditedElements(rootElement) {
  return rootElement.querySelectorAll(
    "p,h1,h2,h3,h4,h5,h6,figcaption,blockquote,li,dt,dd"
  );
}

export async function toggleEditor() {
    let editorActivated = !document.body.classList.contains("editing");
    let allowMissingWebdav = ["localhost", "127.0.0.1"].indexOf(new URL(document.location).hostname) > -1;

    if (editorActivated) {
        let folderUrl = new URL(".", document.body.baseURI);
        let res = await fetch(folderUrl, { method: "PROPFIND" });
        if (!res.ok) {
            console.warn(`Unable to check folder content ${res.status} ${res.statusText}`)
            if(!allowMissingWebdav) {
                alert(`Impossible d'activer le mode d'édition : ${res.status} ${res.statusText}`);
                return;
            }
        }
        await res.text();
        
        await loadExtraTemplates();
    } else {
        try {
            await save();
        } catch (e) {
            console.error(e);
            alert(`Impossible de sauvegarder la page : ${e.message}\n\nUtilisez CTRL+S pour sauvegarder la page sur votre ordinateur`)
        }
    }

    setContentEditable(editorActivated, document.body.querySelector("main"))
    await setupTemplates();
    setupToolbar();

    document.body.classList.toggle("editing", editorActivated);
    document.getElementById("editor-button").textContent = editorActivated ? "Sauvegarder et quitter" : "Éditer...";
}

function setContentEditable(newState, rootElement) {
  if (!rootElement) {
    rootElement = document.querySelector("main") || document.body;
  }

  for (let el of getEditedElements(rootElement)) {
    el.toggleAttribute("contenteditable", newState);
  }
}

async function setupTemplates() {
    let containerEl = document.getElementById("editor-templates");
    if (!containerEl) {
      let el = document.createElement("article");
      el.id = "editor-templates";
      makeTransient(el);
      el.innerHTML = `<h1>Ajouter</h1><ul class="template-list"></ul>`;
      containerEl = document.body.appendChild(el);
    }

    let containerListEl = containerEl.querySelector(".template-list");
    containerListEl.innerHTML = "";

    injectTemplatesInElement(containerListEl).forEach(({ el, template }) =>
      el.addEventListener("click", () => appendTemplate(template))
    );
}

function injectTemplatesInElement(element) {
    element.innerHTML = "";
  let buttons = [];
  for (let template of document.querySelectorAll("template.editor-template")) {
    let templateEl = document.createElement("li");
    templateEl.innerHTML = `<button><span class="name"></span></button>`;
    templateEl.querySelector(".name").textContent =
      template.getAttribute("title");
    templateEl = element.appendChild(templateEl);
    buttons.push({ el: templateEl, template });
  }
  return buttons;
}

async function loadExtraTemplates(){
    for(let el of document.querySelectorAll(".editor-extra-template")){
        el.remove();
    }

    for(let meta of document.querySelectorAll(`meta[name="editor-templates"]`)){

        let url = new URL(meta.content, meta.baseURI)

        let res = await fetch(url);
        if(res.ok){
            let parser = new DOMParser();
            let result = null;
            
            try {
                result = parser.parseFromString(await res.text(), "text/html")
            } catch(e) {
                console.error(`Unable to parse extra templates ${url.toString()} : ${e.message}`);
            }

            if(result) {
                for(let t of result.querySelectorAll("template.editor-template")) {
                    let el = t.cloneNode(true);
                    el.classList.add("editor-extra-template");
                    document.body.appendChild(el);
                }
            }

        } else {
            console.error(`Unable to load extra templates ${url.toString()} : ${res.status} ${res.statusText}`);
        }

    }
}

function setupToolbar() {
  let containerEl = document.getElementById("editor-toolbar");
  if (!containerEl) {
    let el = document.createElement("nav");
    el.id = "editor-toolbar";
    el.style = "position: absolute";
    makeTransient(el);
    el.innerHTML = `
            <button class="add-block" title="Ajouter un bloc">
                <img src="/src/css/icons/ajouter.svg" alt="+" />
            </button>
            <button class="remove-block" title="Supprimer ce bloc">
                <img src="/src/css/icons/supprimer.svg" alt="-" />
            </button>
            <button class="drag-block" title="Déplacer ce bloc" draggable="true">
                <img src="/src/css/icons/drag.svg" alt="Déplacer ce bloc" />
            </button>
            <section class="add-block-submenu toolbar-submenu" hidden>
              <ul class="template-list"></ul>
            </section>
            `;
    containerEl = document.body.appendChild(el);
  }

  injectTemplatesInElement(containerEl.querySelector(".template-list")).forEach(
    ({ el, template }) => {
      el.addEventListener("click", () =>
        appendTemplate(template, toolbarFocusElement)
      );
      closeToolbarSubmenu();
    }
  );

  containerEl.querySelector(".add-block").addEventListener("click", (e) => {
    let el = e.target
      .closest("#editor-toolbar")
      .querySelector(".add-block-submenu");
    el.hidden = !el.hidden;
  });

  containerEl.querySelector(".remove-block").addEventListener("click", () => {
    if (toolbarFocusElement) {
      removeEditableElement(toolbarFocusElement);
    }
  });

  containerEl
    .querySelector(".drag-block")
    .addEventListener("dragstart", (e) => {
      if (toolbarFocusElement) {
        let elRect = toolbarFocusElement.getBoundingClientRect();
        let buttonRect = e.target.getBoundingClientRect();

        e.dataTransfer.setData("text/html", toolbarFocusElement.outerHTML);
        e.dataTransfer.setData("text/plain", toolbarFocusElement.textContent);
        e.dataTransfer.setDragImage(
          toolbarFocusElement,
          buttonRect.left - elRect.left + buttonRect.width / 2,
          buttonRect.top - elRect.top + buttonRect.height / 2
        );

        draggingElement = toolbarFocusElement;
      }
    });

  setupToolbarListener();

  containerEl.hidden = true;
}

function removeEditableElement(element) {
    if (element == toolbarFocusElement) {
        focusNextElement(element, -1);
    }
    let parent = element.parentElement;
    element.remove();
    if(parent.innerHTML.trim() == ""){
        parent.remove();
    }
}

function toolbarFocusHandler(e) {
  if (e.target.hasAttribute("contenteditable")) {
    let rect = e.target.getBoundingClientRect();

    toolbarFocusElement = e.target;

    let toolbar = document.getElementById("editor-toolbar");
    toolbar.style.top = document.body.scrollTop + rect.top + "px";
    toolbar.style.left = rect.left + "px";

    toolbar.style.setProperty("--target-block-width", rect.width + "px");
    toolbar.style.setProperty("--target-block-height", rect.height + "px");

    closeToolbarSubmenu();

    toolbar.hidden = false;
  }
}

function closeToolbarSubmenu() {
  for (let el of document
    .getElementById("editor-toolbar")
    .querySelectorAll(".add-block-submenu")) {
    el.hidden = true;
  }
}

function toolbarBlurHandler(e) {
  if (e.target == toolbarFocusElement) {
    document.getElementById("editor-toolbar").hidden = true;
  }
}

function setupToolbarListener(root = document) {
  for (let el of root.querySelectorAll("[contenteditable]")) {
    el.removeEventListener("focus", toolbarFocusHandler);
    el.removeEventListener("blur", toolbarBlurHandler);
    el.addEventListener("focus", toolbarFocusHandler);
    el.addEventListener("blur", toolbarBlurHandler);
  }
}

function appendTemplate(templateEl, after) {
  let containerEl = after
    ? after.parentElement
    : document.querySelector("main");
  let contentEl = templateEl.content.cloneNode(true);
  setContentEditable(isEditing(), contentEl);
  let fistEditableEl = contentEl.querySelector("[contenteditable]");

  if (after && after.nextElementSibling) {
    containerEl.insertBefore(contentEl, after.nextElementSibling);
  } else {
    containerEl.appendChild(contentEl);
  }

  if (fistEditableEl) {
    focusElement(fistEditableEl, { selectContent: true });
  }

  setupToolbarListener();
  lastTemplateAdded = templateEl;
}

export async function save() {
  let fileUrl = new URL(document.location);
  if (fileUrl.pathname.endsWith("/")) {
    fileUrl.pathname += "index.html";
  }

  let res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(
      `Unable to get existing file on server ${res.status} ${res.statusText}`
    );
  }
  let savedFileContent = new DOMParser().parseFromString(
    await res.text(),
    res.headers.get("content-type").split(";")[0]
  );

  {
    let savedFileMainEl = savedFileContent.querySelector("main");
    if (savedFileMainEl) {
      savedFileMainEl.innerHTML = document.querySelector("main").innerHTML;
    } else {
      savedFileContent.querySelector("body").innerHTML =
        document.body.innerHTML;
    }
  }

  {
    for (let el of savedFileContent.querySelectorAll("[data-transient]")) {
      el.remove();
    }
  }

  {
    for (let el of savedFileContent.querySelectorAll('[class=""]')) {
      el.removeAttribute("class");
    }
  }

  setContentEditable(false, savedFileContent.body);

  let savedRes = await fetch(fileUrl, {
    method: "PUT",
    body: savedFileContent.documentElement.outerHTML,
    headers: {
      "Content-Type": "text/html",
    },
  });

  if (!savedRes.ok) {
    throw new Error(
      `Unable to save file ${savedRes.status} ${savedRes.statusText}`
    );
  }
  await savedRes.text();

  console.info("File saved");
}
