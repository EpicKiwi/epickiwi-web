const path = require("path");
const express = require("express");
const nodePath = require("path");
const expressHandlebars = require("express-handlebars");
const mime = require("mime");

const settings = require("./settings");
const pages = require("./pages");
const moduleResolver = require("./moduleResolver");
const templateHelpers = require("./template-helpers.js");

const app = express();

app.engine("handlebars", expressHandlebars({ helpers: templateHelpers }));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use("/assets", express.static(path.resolve(__dirname, "./assets")));

app.use((req, res, next) => {
  console.log(
    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} ${req.method.toUpperCase()} ${
      req.path
    }`
  );
  return next();
});

// Inject current URL to renders
app.use(function(req, res, next) {
  res.locals.url = req.protocol + "://" + req.get("host") + req.originalUrl;
  next();
});

app.get(
  ["/node_modules/:moduleName/:assetPath(*)?", "/scripts/:assetPath(*)"],
  async (req, res) => {
    let result = {};
    let { moduleName, assetPath } = req.params;

    if (moduleName && moduleName.startsWith("@")) {
      let splittedAssets = assetPath.split("/");
      moduleName += "/" + splittedAssets[0];
      splittedAssets.splice(0, 1);
      assetPath = splittedAssets.join("/");
    }

    let modDir = `${moduleName ? `/node_modules/${moduleName}` : "/scripts"}${
      assetPath ? `/${nodePath.dirname(assetPath)}` : ""
    }`;

    try {
      if (
        !mime.getType(req.path) ||
        mime.getType(req.path) == "application/javascript"
      ) {
        result = moduleResolver.transformImports(
          modDir,
          await moduleResolver.getScript(moduleName, assetPath)
        );
      } else {
        result = await moduleResolver.getScript(moduleName, assetPath, null);
      }
    } catch (e) {
      if (e.status) {
        res.status(e.status);
      } else {
        res.status(500);
      }
      result = { error: e.message };
    }

    res.type(mime.getType(req.path) || "application/javascript");

    if (moduleName) {
      res.set("Cache-Control", "public, max-age=2629800");
    } else {
      res.set("Cache-Control", "public, max-age=86400");
    }

    res.send(result);
  }
);

app.use(pages);

const port = settings.port;
app.listen(port, () => {
  if (settings.dev) {
    console.info(`Listening on http://localhost:${port}/`);
  } else {
    console.info(`Listening on *:${port}`);
  }
});
