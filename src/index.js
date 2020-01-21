const path = require("path");
const express = require("express");
const moduleResolver = require("./moduleResolver");
const nodePath = require("path");
const auth = require("basic-auth");

const app = express();

app.use("/assets", express.static(path.resolve(__dirname, "./assets")));

app.use((req, res, next) => {
  console.log(
    `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} ${req.method.toUpperCase()} ${
      req.path
    }`
  );
  return next();
});

app.get("/", (req, res) => {
  console.log(auth(req))
  res.sendFile(path.resolve(__dirname, "./views/index.html"))
});

app.get(
  ["/node_modules/:module/:path(*)?", "/scripts/:path(*)"],
  async (req, res) => {
    let result = {};
    const { module, path } = req.params;
    let modDir = `${module ? `/node_modules/${module}` : "/scripts"}${
      path ? `/${nodePath.dirname(path)}` : ""
    }`;
    try {
      result = moduleResolver.transformImports(
        modDir,
        await moduleResolver.getScript(module, path)
      );
      res.type("application/javascript");
    } catch (e) {
      if (e.status) {
        res.status(e.status);
      } else {
        res.status(500);
      }
      result = { error: e.message };
    }
    res.send(result);
  }
);

const port = process.env.PORT || (process.env.DEV ? 8080 : 80);
app.listen(port, () => {
  if (process.env.DEV) {
    console.info(`Listening on http://localhost:${port}/`);
  } else {
    console.info(`Listening on *:${port}`);
  }
});
