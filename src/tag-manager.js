const fs = require("fs");
const settings = require("./settings");
const yaml = require("yaml");
const path = require("path");

let tagsCache = {};
let lastCached = null;

class Tag {
	constructor(tagname) {
		this.name = tagname;
		this.icon = "tag";
		this.display = tagname;
		this.category = false;
		this.theme = undefined;
	}
}

function loadTags() {
	let rawFile = null;
	try {
		let sourcePath = path.resolve(settings.content.rootPath, "./tags.yaml");

		let stats = fs.statSync(sourcePath);

		if (lastCached != null && stats.mtimeMs == lastCached) {
			return false;
		}

		let fileStr = fs.readFileSync(sourcePath, "utf8");
		rawFile = yaml.parse(fileStr);

		lastCached = stats.mtimeMs;
	} catch (e) {
		if (e.code != "ENOENT") {
			throw e;
		}
		return false;
	}

	Object.keys(rawFile).forEach((key) => {
		let val = rawFile[key];
		let tag = new Tag(key);
		if (typeof val == "string") {
			tag.icon = val;
		}
		Object.assign(tag, val);
		tagsCache[key] = tag;
	});

	return true;
}

function getTag(tagname) {
	loadTags();
	if (tagsCache[tagname]) {
		return tagsCache[tagname];
	} else {
		return new Tag(tagname);
	}
}

module.exports = {
	getTag,
	loadTags,
	Tag,
};
