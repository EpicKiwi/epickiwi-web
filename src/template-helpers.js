const moment = require("moment");
const fs = require("fs");
const path = require("path");
moment.locale("fr");

function longDate(date) {
	return moment(date).format("dddd MM MMMM YYYY");
}

function isodate(date) {
	return date.toISOString();
}

function relativeToFile(sourceFile, pth) {
	if (pth.startsWith("/")) return pth;
	if (pth.startsWith("http")) return pth;
	let dirpath = path.dirname(sourceFile);
	return path.resolve("/" + dirpath, pth);
}

function iconSVG(iconName) {
	let svgContent = fs.readFileSync(
		`${__dirname}/../node_modules/@mdi/svg/svg/${iconName}.svg`
	);
	return svgContent;
}

module.exports = {
	longDate,
	iconSVG,
	isodate,
	relativeToFile,
};
