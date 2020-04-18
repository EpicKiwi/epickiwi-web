const path = require("path");
const { promisify } = require("util");
const pglob = promisify(require("glob"));
const fs = require("fs");
const pfs = {
  readFile: promisify(fs.readFile),
};

async function getScript(moduleName, modulePath, encoding = "utf8") {
  let filePath = "";

  if (modulePath && path.extname(modulePath) === "") {
    modulePath += ".js";
  }

  if (moduleName) {
    let mods = await pglob(
      `${__dirname}/../node_modules/${moduleName}/package.json`
    );
    if (mods.length < 1) {
      let err = new Error("Package not found");
      err.status = 404;
      throw err;
    }
    let modulePackage = require(mods[0]);
    let main = path.dirname(mods[0]) + "/.";
    if (modulePackage.main) {
      main = path.resolve(path.dirname(mods[0]), modulePackage.main);
    }
    filePath = modulePath ? path.resolve(path.dirname(main), modulePath) : main;
  } else {
    filePath = `${__dirname}/scripts/${modulePath}`;
  }

  return await pfs.readFile(filePath, encoding);
}

const SOURCE_MAP_REGEX = /\/\/.*sourceMappingURL=([^\s\n]+)/;
const IMPORT_REGEX = /(?:import|export)(?: .*? from (["'`])(.+?)(\1)| (["'`])(.+?)(\4)|\((["'`])(.+?)(\7)\))/;
function transformImports(scriptDir, jsScript) {
  let imports = jsScript.match(new RegExp(IMPORT_REGEX, "g"));

  if (imports) {
    imports.forEach((el) => {
      let match = el.match(IMPORT_REGEX);
      let importPath = match[2] || match[5] || match[8];
      let transformedImport = el;
      if (importPath.startsWith(".")) {
        transformedImport = el.replace(
          importPath,
          path.normalize(`${scriptDir}/${importPath}`)
        );
      } else {
        transformedImport = el.replace(
          importPath,
          `/node_modules/${importPath}`
        );
      }
      jsScript = jsScript.replace(el, transformedImport);
    });
  }

  let sourceMapDeclaration = jsScript.match(SOURCE_MAP_REGEX);
  if (sourceMapDeclaration) {
    let originalContent = sourceMapDeclaration[0];
    let mapPath = sourceMapDeclaration[1];
    let transformedContent = originalContent.replace(
      mapPath,
      path.normalize(`${scriptDir}/${mapPath}`)
    );
    jsScript = jsScript.replace(originalContent, transformedContent);
  }

  return jsScript;
}

module.exports = { getScript, transformImports };
