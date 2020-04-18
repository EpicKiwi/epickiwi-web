const COMPONENTS = {
	"ek-video": {
		figure: true,
		source: "/scripts/components/VideoPlayer.js",
	},
	"ek-audio": {
		figure: true,
		source: "/scripts/components/AudioPlayer.js",
	},
	"ek-map": {
		figure: true,
		source: "/scripts/components/Map.js",
	},
	"ek-code": {
		figure: false,
		source: "/scripts/components/Code.js",
		style: "/assets/css/highlight-style.css",
	},
};

function getFigureComponents() {
	return Object.keys(COMPONENTS).filter((key) => !!COMPONENTS[key].figure);
}

module.exports = {
	COMPONENTS,
	getFigureComponents,
};
