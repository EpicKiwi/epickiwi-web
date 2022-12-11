async function attachBase() {
  let baseHtml = await (await fetch("/src/fragments/base.html")).text();

  document.body.attachShadow({ mode: "open" });
  document.body.shadowRoot.innerHTML = baseHtml;
}
attachBase();
