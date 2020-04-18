const visit = require("unist-util-visit");
const parseSelector = require("hast-util-parse-selector");
const contentComponents = require("./content-components");
const detab = require("detab");
const u = require("unist-builder");
const hljs = require("highlight.js");
var htmlEscape = require("html-escape");

function figureOrdering() {
	function transformer(tree, file) {
		//If the last figure wes on right
		let lastRight = false;

		visit(tree, "element", (node, i, parent) => {
			if (node.tagName.toLowerCase() != "figure") return;

			if (!node.properties.className) {
				node.properties.className = [];
			}

			// If the figure already have a class defining its position
			let classes = node.properties.className;
			if (classes.indexOf("left") > -1) {
				lastRight = false;
				return;
			} else if (classes.indexOf("right") > -1) {
				lastRight = true;
				return;
			} else if (classes.indexOf("center") > -1) {
				return;
			}

			if (lastRight) {
				node.properties.className.push("left");
			} else {
				node.properties.className.push("right");
			}

			lastRight = !lastRight;
		});
	}

	return transformer;
}

function figureWrapped(options) {
	let wrappedElements = options.elements || [];

	function transformer(tree, file) {
		visit(tree, "element", (node, i, parent) => {
			if (wrappedElements.indexOf(node.tagName.toLowerCase()) == -1)
				return;

			let wrap = parseSelector("figure");

			if (node.properties.className) {
				let classes = node.properties.className;
				if (classes.indexOf("left") > -1) {
					wrap.properties.className = ["left"];
				} else if (classes.indexOf("right") > -1) {
					wrap.properties.className = ["right"];
				} else if (classes.indexOf("center") > -1) {
					wrap.properties.className = ["center"];
				}
			}

			wrap.children = [node];

			if (node.properties.caption) {
				let caption = parseSelector("figcaption");
				caption.children = [
					{ type: "text", value: node.properties.caption },
				];
				wrap.children.push(caption);
			}

			parent.children[i] = wrap;
		});
	}

	return transformer;
}

function requiredComponents() {
	let requireComponents = Object.keys(contentComponents.COMPONENTS).filter(
		(key) => !!contentComponents.COMPONENTS[key].source
	);

	let currentComponents = {};

	function transformer(tree, file) {
		visit(tree, "element", (node, i, parent) => {
			let tagname = node.tagName.toLowerCase();
			if (requireComponents.indexOf(tagname) == -1) return;
			if (!currentComponents[tagname]) {
				currentComponents[tagname] =
					contentComponents.COMPONENTS[tagname];
			}
		});
		file.requiredComponents = currentComponents;
	}

	return transformer;
}

function imagesAsFigure() {
	const CLASS_IDENTIFIERS = {
		"<<": "left",
		">>": "right",
		"!!": "center",
	};

	function transformer(tree, file) {
		visit(tree, "image", (node, i, parent) => {
			if (!node.data) {
				node.data = {
					hProperties: {
						className: [],
					},
				};
			}

			if (!node.data.hProperties) {
				node.data.hProperties = { className: [] };
			}

			if (!node.data.hProperties.className) {
				node.data.hProperties.className = [];
			}

			if (!node.alt) return;

			let caption = node.alt.trim();

			for (let identifier of Object.keys(CLASS_IDENTIFIERS)) {
				if (caption.startsWith(identifier)) {
					node.data.hProperties.className.push(
						CLASS_IDENTIFIERS[identifier]
					);
					caption = caption.substring(identifier.length).trim();
					break;
				}
			}

			if (caption && caption.length > 0) {
				node.data.hProperties.caption = caption;
			}
		});
	}
	return transformer;
}

function mdCode(h, node) {
	var value = node.value ? detab(node.value) : "";

	var lang = node.lang && node.lang.match(/^[^ \t]+(?=[ \t]|$)/);

	let highlightResult = null;
	let rawContent = value;

	console.log(node.lang);

	if (node.lang) {
		if (hljs.getLanguage(node.lang)) {
			highlightResult = hljs.highlight(node.lang, value);
			rawContent = highlightResult.value;
		} else {
			rawContent = htmlEscape(value);
		}
	} else {
		highlightResult = hljs.highlightAuto(value);
		rawContent = highlightResult.value;
	}

	if (highlightResult && highlightResult.language)
		node.lang = highlightResult.language;

	var props = {
		language: node.lang,
		filename: node.meta,
		serverHighlighted: !!highlightResult,
	};

	let content =
		'<div class="line">' +
		rawContent.split("\n").join('</div><div class="line">') +
		"</div>";

	return h(node.position, "ek-code", props, [u("raw", content)]);
}

function extractAbstract() {
	function transformer(tree, file) {
		let abstract = null;
		visit(tree, "paragraph", (node, i, parent) => {
			if (abstract == null) {
				let str = "";
				visit(node, "text", (node) => (str += node.value));
				abstract = str;
			}
		});
		file.abstract = abstract.replace(/\n/g, " ");
	}
	return transformer;
}

module.exports = {
	figureOrdering,
	figureWrapped,
	extractAbstract,
	requiredComponents,
	imagesAsFigure,
	mdHandlers: {
		code: mdCode,
	},
};
