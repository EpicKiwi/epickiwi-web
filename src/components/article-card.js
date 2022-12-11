class ArticleCardComponent extends HTMLElement {
  loaded = false;

  get href() {
    if (this.hasAttribute("resource")) return this.getAttribute("resource");
    let a = this.querySelector("a");
    if (!a) return null;
    return a.href;
  }

  get contentElement() {
    let a = this.querySelector("a");
    if (!a) return this;
    return a;
  }

  connectedCallback() {
    this.updateContent();
  }

  async updateContent() {
    let href = new URL(this.href, this.baseURI);
    if (!href) return;

    let dom = new DOMParser();
    let articleReq = await fetch(href);
    if (!articleReq.ok) {
      throw new Error(
        `Network error during article fetch : ${articleReq.status} ${articleReq.statusText}`
      );
    }
    let article = dom.parseFromString(await articleReq.text(), "text/html");

    let sourceTitle = article.querySelector("h1");
    if (sourceTitle) {
      let titleEl = this.getOrCreateElement("h2");
      titleEl.innerHTML = sourceTitle.innerHTML;
      titleEl.setAttribute("property", "name");
    }

    let sourceImage = article.querySelector(
      'header img[itemprop="image"], header img[property="image"], header img:first-child'
    );
    if (sourceImage) {
      let coverImg = this.getOrCreateElement("img");
      coverImg.classList.add("cover");
      coverImg.src = new URL(sourceImage.getAttribute("src"), href).toString();
      coverImg.alt = sourceImage.getAttribute("alt");
      coverImg.setAttribute("property", "image");
    }

    let sourceAbstract = article.querySelector(
      'main [itemprop="abstract"], main [property="abstract"], main p'
    );
    if (sourceAbstract) {
      let abstractEl = this.getOrCreateElement("p");
      abstractEl.classList.add("abstract");
      abstractEl.innerHTML = sourceAbstract.innerHTML;
      abstractEl.setAttribute("property", "abstract");
    }

    let sourceItemtype = article.querySelector("[itemtype], [typeof]");
    if (sourceItemtype) {
      this.setAttribute(
        "typeof",
        sourceItemtype.getAttribute("itemtype") ||
          sourceItemtype.getAttribute("typeof")
      );
    }

    let vocab = article.querySelector("body[vocab], main[vocab]");
    this.setAttribute(
      "vocab",
      vocab ? vocab.getAttribute("vocab") : "http://schema.org/"
    );

    this.setAttribute("resource", href);

    this.loaded = true;
  }

  /**
   * @param {string} tagname
   * @returns {Element}
   */
  getOrCreateElement(tagname) {
    let el = this.querySelector(tagname);
    if (!el) {
      el = document.createElement(tagname);
      this.contentElement.appendChild(el);
    }
    return el;
  }
}

customElements.define("ek-article-card", ArticleCardComponent, {
  extends: "article",
});
