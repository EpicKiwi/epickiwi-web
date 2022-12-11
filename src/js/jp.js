import "./layout.js";

function shallowNavigate(toUrl) {
  history.pushState({}, null, toUrl);
}

function getLastMain() {
  return Array.from(document.querySelectorAll("main")).slice(-1)[0];
}

async function loadPage(fromUrl) {
  let existingEl = document.body.querySelector(
    `[data-source-url="${fromUrl}"]`
  );
  if (existingEl) {
    existingEl.scrollIntoView({ behavior: "smooth" });
    return;
  }

  let req = await fetch(fromUrl);
  if (!req.ok) throw new Error(`Request error ${req.status} ${req.statusText}`);
  let dom = new DOMParser().parseFromString(
    await req.text(),
    req.headers.get("Content-Type").split(";")[0]
  );

  let scriptEl = dom.querySelector('script[type="module"][src$="jp.js"]');
  if (!scriptEl) throw new Error("No jp.js script found on the target page");

  let mainEl = dom.querySelector("main");

  Array.from(mainEl.querySelectorAll("[href],[src]")).forEach((el) => {
    let sourceAttr = el.hasAttribute("href") ? "href" : "src";
    let sourceVal = el.getAttribute(sourceAttr);
    let url = new URL(sourceVal, fromUrl);
    el.setAttribute(sourceAttr, url.toString());
  });

  let currentMainEl = getLastMain();

  currentMainEl.parentElement.insertBefore(mainEl, currentMainEl.nextSibling);

  mainEl = getLastMain();
  mainEl.dataset.sourceUrl = fromUrl;
  mainEl.scrollIntoView({ block: "start", behavior: "smooth" });
}

document.body.addEventListener("click", async (e) => {
  if (!e.target.href || e.target.target == "_blank") return;

  e.preventDefault();

  let url = new URL(e.target.href, window.location);

  try {
    await loadPage(url);
    shallowNavigate(url);
  } catch (e) {
    console.warn(`Unable to load page from ${url.toString()} ${e.message}`);
    window.location = url;
  }
});

window.addEventListener("popstate", (e) => {
  loadPage(window.location);
});

getLastMain().dataset.sourceUrl = window.location;
