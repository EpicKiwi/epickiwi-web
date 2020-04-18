const express = require("express");
const router = express.Router();
const contentMgr = require("./content-manager");
const { promisify } = require("util");
const mime = require("mime");
const path = require("path");
const fs = require("fs");
const pfs = {
	stat: promisify(fs.stat),
};

router.get("/", async (req, res) => {
	let articles = await contentMgr.getAllArticles(10);
	res.render("index", {
		firstArticle: articles[0],
		articles: articles.slice(1),
		noArticles: articles.length < 2,
		css: ["/assets/css/app.css"],
		js: ["/scripts/app.js", "/scripts/components/icon.js"],
		opengraph: {
			type: "profile",
			image: "https://epickiwi.fr/assets/img/logo.png",
			"profile:username": "EpicKiwi",
		},
	});
});

router.get("/rss", async (req, res) => {
	let articles = await contentMgr.getAllArticles(100);

	let url = `${req.protocol}://${req.hostname}`;

	res.type("application/atom+xml");

	res.render("rss", {
		layout: false,
		feed: {
			url,
			title: "EpicKiwi.fr",
			lastUpdated: articles[0].date,
		},
		articles,
	});
});

router.get(/(\/.+)/, async (req, res) => {
	const pagePath = req.params[0];

	if (pagePath.endsWith("/")) {
		return res.redirect(301, pagePath.substring(0, pagePath.length - 1));
	}

	if (path.extname(path.basename(pagePath)) != "") {
		return sendStatic(req, res);
	}

	let page = null;

	try {
		page = await contentMgr.getPage(pagePath);
	} catch (e) {
		console.error(e.message);
		res.status(404);
		res.send("Page not found");
		return;
	}

	try {
		await page.readContent(pagePath);
	} catch (e) {
		console.error(e.message);
		res.status(500);
		res.send("There is an error with this page");
		return;
	}

	res.set("content-type", "text/html");

	const content = await page.asHtml();

	let extraOG = {};

	if (page.meta.date) {
		extraOG["article:published_time"] = page.meta.date.toISOString();
	}

	if (page.meta.author) {
		extraOG["article:author"] = page.meta.author;
	}

	if (page.meta.category) {
		extraOG["article:section"] = page.meta.category.display;
	}

	let theme = undefined;

	if (page.meta.theme) {
		theme = page.meta.theme;
	} else if (page.meta.category && page.meta.category.theme) {
		theme = page.meta.category.theme;
	}

	let scripts = Object.values(page.requiredComponents).reduce(
		(acc, el) =>
			typeof el.source == "string"
				? [...acc, el.source]
				: [...acc, ...el.source],
		[]
	);

	let styles = Object.values(page.requiredComponents).reduce((acc, el) => {
		if (el.style) {
			return typeof el.style == "string"
				? [...acc, el.style]
				: [...acc, ...el.style];
		} else {
			return acc;
		}
	}, []);

	let description = page.abstract;

	if (!description) {
		description =
			page.content.substring(0, 400) +
			(page.content.length > 400 ? "..." : "");
	}

	res.render("page", {
		title: page.title,
		meta: page.meta,
		content,
		theme,
		cover: page.meta.cover,
		css: [...styles, "/assets/css/page.css"],
		js: [...scripts, "/scripts/components/icon.js"],
		opengraph: {
			type: "article",
			description,
			...extraOG,
		},
	});
});

async function sendStatic(req, res) {
	try {
		const contentPath = contentMgr.getAbsoluteContentPath(req.params[0]);

		var range = req.headers.range;
		let stream = null;
		if (range) {
			let stats = await pfs.stat(contentPath);

			var positions = range.replace(/bytes=/, "").split("-");
			var start = parseInt(positions[0], 10);
			var total = stats.size;
			var end = positions[1] ? parseInt(positions[1], 10) : start + 62500;
			var chunksize = end - start + 1;

			stream = fs.createReadStream(
				contentPath,
				end ? { start, end } : { start }
			);

			res.writeHead(206, {
				"Content-Range":
					"bytes " + start + "-" + (end ? end : "") + "/" + total,
				"Accept-Ranges": "bytes",
				"Content-Length": chunksize,
				"Content-Type": mime.getType(contentPath),
			});
		} else {
			res.set("Content-Type", mime.getType(contentPath));
			stream = fs.createReadStream(contentPath);
		}

		stream
			.on("open", function() {
				stream.pipe(res);
			})
			.on("error", function(e) {
				console.error(e.message);
				res.end();
			});
	} catch (e) {
		if (e.code != "ENOENT") {
			console.error(e.message);
			res.status(500);
			res.send("There is an error with this content");
		} else {
			res.status(404);
			res.send("Content not found");
		}
		return;
	}
}

module.exports = router;
