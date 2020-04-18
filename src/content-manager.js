const path = require("path");
const assert = require("assert");
const yaml = require("yaml");
const readline = require("readline");
const { promisify } = require("util");
const pglob = promisify(require("glob"));
const fs = require("fs");
const moment = require("moment");
const tagManager = require("./tag-manager");
moment.locale("fr");
const pfs = {
	stat: promisify(fs.stat),
};

//Parsing plugin stack
const unified = require("unified");
const remarkParse = require("remark-parse");
const remark2rehype = require("remark-rehype");
const rehypeRaw = require("rehype-raw");
const rehypeStringify = require("rehype-stringify");
const {
	figureOrdering,
	figureWrapped,
	requiredComponents,
	imagesAsFigure,
	mdHandlers,
	extractAbstract,
} = require("./content-plugins");

const settings = require("./settings");
const contentComponents = require("./content-components");

let PAGE_CACHE = {};

/**
 * A displayable page
 */
class Page {
	constructor(sourcePath) {
		this.sourcePath = sourcePath;
		this.relativePath = path.relative(
			settings.content.rootPath,
			sourcePath
		);
		this.href = this.relativePath.replace(/\.md$/, "");
		this.stats = {};

		/**
		 * category : Main tag representing the page Category
		 * tags : Array of tags
		 * date : Javascript Date of publication
		 * author : String of the author
		 * cover : Large image covering the title of the page
		 * theme : Name of the theme used
		 */
		this.meta = null;

		this.content = null;
		this.title = null;
		this.parsingResult = null;
		this.requiredComponents = null;
		this.abstract = null;
		this.htmlContent = null;
		this.hidden = false;
	}

	parseMeta() {
		Object.keys(this.meta).forEach((key) => {
			let setValue = (newVal, keyOver = key) =>
				(this.meta[keyOver] = newVal);
			let val = this.meta[key];
			switch (key) {
				case "date":
					let mm = moment(val, [
						"DD/MM/YYYY",
						"DD/MM/YYYY HH:MM",
						moment.HTML5_FMT.DATETIME_LOCAL,
					]);
					setValue(mm.toDate());
					break;
				case "tags":
					if (typeof val == "string") {
						let tags = val
							.split(",")
							.map((el) => tagManager.getTag(el.trim()));
						setValue(tags);
						let category = tags.find((el) => el.category);
						if (category) {
							setValue(category, "category");
						}
					}
					break;
			}
		});
	}

	/**
	 * Reads content of the file and extract title and meta
	 */
	readContent(force = false) {
		return new Promise((resolve, reject) => {
			if (this.content && !force) {
				return resolve();
			}

			const stream = readline.createInterface({
				input: fs.createReadStream(this.sourcePath),
			});

			let firstLine = true;
			let inMeta = false;
			let rawMeta = null;
			let content = "";
			let title = null;

			stream.on("line", (line) => {
				if (firstLine) {
					firstLine = false;

					if (line.startsWith("---")) {
						inMeta = true;
						rawMeta = "";
						return;
					} else if (line.startsWith("#")) {
						title = line.substring(1, line.length).trim();
					} else if (line == "") {
						firstLine = true;
						return;
					}
				}

				if (inMeta) {
					if (line.startsWith("---")) {
						inMeta = false;
						firstLine = true;
						return;
					}
					rawMeta += line + "\n";
				} else {
					content += line + "\n";
				}
			});

			stream.on("error", (e) => {
				stream.close();
				return reject(e);
			});

			stream.on("close", () => {
				this.content = content;
				this.title = title;

				if (rawMeta) {
					this.meta = yaml.parse(rawMeta);
					this.parseMeta(this.meta);
				} else {
					this.meta = {};
				}

				if (this.meta.hidden) {
					this.hidden = this.meta.hidden;
				}

				if (!this.meta.date) {
					this.meta.date = this.stats.birthtime;
				}

				return resolve();
			});
		});
	}

	get date() {
		return this.meta.date;
	}

	/**
	 * Parses Page content as HTML and extract abstract and required components
	 */
	async asHtml(force = false) {
		if (this.parsingResult && !force) {
			return String(this.parsingResult);
		}

		const parsingStack = unified()
			.use(remarkParse)
			.use(imagesAsFigure)
			.use(extractAbstract)
			.use(remark2rehype, {
				allowDangerousHtml: true,
				handlers: mdHandlers,
			})
			.use(rehypeRaw)
			.use(figureWrapped, {
				elements: [...contentComponents.getFigureComponents(), "img"],
			})
			.use(figureOrdering)
			.use(requiredComponents)
			.use(rehypeStringify);

		const parseStack = promisify(parsingStack.process);

		const result = await parseStack(this.content);

		this.parsingResult = result;
		this.requiredComponents = result.requiredComponents;
		this.abstract = result.abstract;
		this.htmlContent = String(result);

		return this.htmlContent;
	}

	/**
	 * Check if the page path is valid ans create a Page instance based on the file content
	 */
	static async getPage(pagePath, relative = true) {
		let resolvedPath = relative
			? Page.getAbsoluteContentPath(pagePath)
			: pagePath;

		if (!resolvedPath.endsWith(".md")) {
			resolvedPath = resolvedPath + ".md";
		}

		const pageStats = await pfs.stat(resolvedPath);

		assert(pageStats.isFile(), "Target page path must be a Markdown file");

		if (
			PAGE_CACHE[resolvedPath] &&
			PAGE_CACHE[resolvedPath].stats.mtimeMs == pageStats.mtimeMs
		) {
			return PAGE_CACHE[resolvedPath];
		}

		let page = new Page(resolvedPath);
		page.stats = pageStats;

		PAGE_CACHE[resolvedPath] = page;

		return page;
	}

	static async getAllArticles(
		number = -1,
		to = null,
		from = new Date(Date.now())
	) {
		let rootFolder = path.resolve(
			settings.content.rootPath,
			settings.content.articlesFolder
		);
		let articlesPaths = await pglob(path.resolve(rootFolder, "**/*.md"));

		let pages = await Promise.all(
			articlesPaths.map((el) => Page.getPage(el, false))
		);

		await Promise.all(pages.map((el) => el.readContent()));

		let filteredPages = pages.filter((pg, i) => {
			return (
				!pg.hidden &&
				pg.date.getTime() < from.getTime() &&
				(!to || pg.date.getTime() > to.getTime())
			);
		});

		filteredPages = filteredPages.sort(
			(a, b) => b.date.getTime() - a.date.getTime()
		);

		if (number > 0) {
			filteredPages = filteredPages.slice(0, number);
		}

		await Promise.all(filteredPages.map((el) => el.asHtml()));

		return filteredPages;
	}

	static getAbsoluteContentPath(contentPath) {
		contentPath = sanitizePagePath(contentPath);
		const absolutePath = path.resolve(
			settings.content.rootPath,
			contentPath
		);

		assert(
			absolutePath.startsWith(settings.content.rootPath),
			"Target page must be in content folder"
		);

		return absolutePath;
	}
}

/**
 * Remove before and after slashes and sanitize a page path to be relative
 */
function sanitizePagePath(pagePath) {
	if (pagePath.endsWith("/")) {
		pagePath = pagePath.substring(0, pagePath.length - 1);
	}

	if (pagePath.startsWith("/")) {
		pagePath = pagePath.substring(1, pagePath.length);
	}
	return pagePath;
}

module.exports = Page;
