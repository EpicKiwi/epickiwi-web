const moment = require("moment");
const fs = require("fs");
moment.locale("fr");

function longDate(date) {
	return moment(date).format("dddd MM MMMM YYYY");
}

function isodate(date) {
	return date.toISOString();
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
};
