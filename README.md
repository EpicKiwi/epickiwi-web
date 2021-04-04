# EpicKiwi Web

> Mon site perosnnel servant de landing page pour [epickiwi.fr](http://epickiwi.fr)

Le site est un site statique Hugo disposant d'un layout personnalisé.

## Quick start

```bash
hugo server
```

## Contenu

Le contenu est divisé en plusieurs type de pages :

- Les _Articles_ standards de blog, listés chronologiquement sur la page d'acceuil
- Les _Read List items_, un lien vers une article, un média, une conference ou une oeuvre d'art qui m'a marqué
- Toutes les _autres pages_ qui sont simplement affichés dans leur hierarchie respective

Chaque Page ou Article peut disposer de _catégories_ (frontmatter `categories`) et de _tags_ (frontamtter `tags`).
Les catégories sont considérées comme plus fortes classifications que les tags mais se completent l'un l'autre.
Il est possible d'éditer plus finement les catégories dans le dossier `content/categories` et les tags dans `contenant/tags`.

Il est conseillé de restreindre les médias dans les dossier associés aus pages dans lesquels ils sont utilisés.

La configuration du site, des menus et des moyens de contact peuvent être édités dans le fichier `config.yml`
