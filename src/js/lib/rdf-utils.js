import Comunica from "./comunica-browser.js";

const SOURCES = [
  new URL("/schema/lib/schemaorg-all-http.ttl", document.baseURI).toString(),
];

let queryEngine = null;

export function getQueryEngine() {
  if (!queryEngine) {
    queryEngine = new Comunica.QueryEngine();
  }
  return queryEngine;
}

export async function queryCurrentPage(query, additionalSources = []) {
  return await queryPage(query, window.location, additionalSources);
}

export async function queryPage(query, url, additionalSources = []) {
  let pageUrl = new URL(url);
  pageUrl.hash = "";
  return await queryUrl(query, pageUrl, additionalSources);
}

export async function queryUrl(query, url, additionalSources = []) {
  let decoratedQuery = `
    PREFIX schema: <http://schema.org/>
    PREFIX : <${url.toString()}>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    ${query}
    `;

  let bindings = await getQueryEngine().queryBindings(decoratedQuery, {
    sources: [...SOURCES, url.toString(), ...additionalSources],
  });

  return await bindings.toArray();
}
