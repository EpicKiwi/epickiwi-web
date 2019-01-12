const path = require("path");
const express = require("express");

const app = express();

app.use("/assets", express.static(path.resolve(__dirname, "./assets")));

app.get("/", (req, res) =>
  res.sendFile(path.resolve(__dirname, "./views/index.html"))
);

const port = process.env.PORT || (process.env.DEV ? 8080 : 80);
app.listen(port, () => {
  if (process.env.DEV) {
    console.info(`Listening on http://localhost:${port}/`);
  } else {
    console.info(`Listening on *:${port}`);
  }
});
