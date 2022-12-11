import { queryCurrentPage } from "./rdf-utils.js";

export async function getAllCharacters() {
  let q = await queryCurrentPage(`SELECT * WHERE { 
        {
          : schema:character ?c .
        } UNION {
          {
            : schema:hasPart+ ?part .
          } UNION {
            ?part schema:partOf+ : .
          }
          ?part schema:character ?c .
        }

        ?c schema:name ?name .

        OPTIONAL { ?c schema:description ?description }

        OPTIONAL {
          ?c ?orgRelation ?org .
          ?org  a schema:Organization ;
                schema:name ?orgName .
        }
    }`);

  let organizations = {};

  let characters = {};

  for (let record of q) {
    let characterId = record.get("c").value;
    if (!characters[characterId]) {
      characters[characterId] = {};
    }
    let character = characters[characterId];

    if (characterId.startsWith("http")) {
      character.url = characterId;
    }

    character.name = record.get("name").value;
    character.description = record.get("description")?.value;

    if(record.has("org")){
      let orgId = record.get("org").value;
      let orgName = record.get("orgName").value;
      let orgRelation = record.get("orgRelation").value;

      let org = organizations[orgId];
      if(!org) org = organizations[orgId] = {id: orgId, name: orgName}
      if(!character.affiliatedTo) character.affiliatedTo = []

      character.affiliatedTo.push({
        relation: orgRelation,
        organization: org
      })
    }
  }

  return Object.values(characters);
}

export async function getAllFigures() {
  let q = await queryCurrentPage(`SELECT * WHERE { 
      {
        : schema:hasPart+ ?part .
      } UNION {
        ?part schema:partOf+ : .
      }

      {
        ?part a ?type .
        ?type rdfs:subClassOf+ schema:CreativeWork .
      } UNION {
        ?part a schema:CreativeWork .
      }

      ?part schema:name ?name .

      OPTIONAL { ?part schema:description ?description }
    }`);

  let figures = [];

  for (let record of q) {
    let figureId = record.get("part").value;
    let figure = {};

    if (figureId.startsWith("http")) {
      figure.url = figureId;
    }

    figure.name = record.get("name").value;
    figure.type = record.get("type")?.value || "http://schema.org/CreativeWork";
    figure.description = record.get("description")?.value;

    figures.push(figure);
  }

  return figures;
}

export async function getScenario() {
  let q = await queryCurrentPage(`SELECT * WHERE { 
        : a ?type ;
          schema:name ?name .

        OPTIONAL { : schema:description ?description }
        
        OPTIONAL { : schema:abstract ?abstract } 
        
        OPTIONAL { 
          : schema:subjectOf ?subject

          OPTIONAL { ?subject schema:name ?subjectName } 
        }
    }`);

  if (q.length < 1) {
    return;
  }

  let record = q[0];

  let subject = null;

  if (record.has("subject")) {
    subject = {
      url: record.get("subject").value,
      name: record.get("subjectName")?.value,
    };
  }

  let scenario = {
    name: record.get("name").value,
    subject,
    description: record.get("description")?.value,
    abstract: record.get("abstract")?.value,
  };

  return scenario;
}
