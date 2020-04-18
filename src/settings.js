const path = require("path")

const dev = !!process.env.DEV;

module.exports = {
	dev, // If the server is in DEV mode
	port: process.env.PORT || (dev ? 8080 : 80), // Current port to serve on

	// All settings related to markdown content
	content: {
		// Root folder containing all content files
		rootPath: path.resolve(__dirname, "../content"),
		// Folder containing blog articles
		articlesFolder: "articles",
	},
}