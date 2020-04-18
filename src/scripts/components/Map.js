import { LitElement, html } from "lit-element";
import { style } from "../util/styler";
import * as L from "leaflet/leaflet-src.esm.js";

class Map extends LitElement {
	static get properties() {
		return {
			src: String,
			geojson: Object,
			focus: String,
			zoom: Number,
		};
	}

	firstUpdated(changedProperties) {
		this.setupMap();
	}

	placeMarkers() {
		let icon = L.icon({
			iconUrl: "/node_modules/leaflet/images/marker-icon.png",
			iconRetinaUrl: "/node_modules/leaflet/images/marker-icon-2x.png",
			iconSize: [25, 41],
			iconAnchor: [13, 40],
			popupAnchor: [0, -28],
			shadowUrl: "/node_modules/leaflet/images/marker-shadow.png",
			shadowSize: [41, 41],
			shadowAnchor: [13, 39],
		});

		let bounds = [];

		Array.from(this.children).forEach((el) => {
			if (el.tagName != "EK-MAP-MARKER") return;

			bounds.push(el.loc);

			let marker = L.marker(el.loc, {
				icon,
				title: el.caption,
			}).addTo(this.$map);

			if (el.innerHTML) {
				marker.bindPopup(el.innerHTML);
				if (el.opened) {
					marker.openPopup();
				}
			}
		});

		if (!this.src && !this.focus) {
			this.$map.fitBounds(bounds, {
				padding: [20, 20],
				maxZoom: this.zoom ? parseFloat(this.zoom) : 23,
			});
		}
	}

	setupMap() {
		let mapEl = this.shadowRoot.getElementById("map");

		this.$map = L.map(mapEl, {
			zoomControl: false,
		});

		this.$map.setView([46.634, 2.483], 5);

		L.tileLayer(
			"https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=0a75309b1ac8485fbc6233131dd9b3ac",
			{
				attribution:
					'&copy; Contributeurs <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; Tiles <a href="https://www.thunderforest.com/maps/outdoors/">Thunderforest</a>',
			}
		).addTo(this.$map);

		this.placeMarkers();
	}

	updateGeoJson(geojson) {
		if (this.$geojsonLayer) {
			this.$geojsonLayer.removeFrom(this.$map);
		}

		let color = window.getComputedStyle(this).color;

		this.$geojsonLayer = L.geoJSON(geojson, {
			style: function(feature) {
				return { color };
			},
		}).addTo(this.$map);
		let geojsonBounds = this.$geojsonLayer.getBounds();
		if (!this.focus) {
			this.$map.fitBounds(geojsonBounds, {
				padding: [20, 20],
			});
		}
	}

	requestGeoJson(url) {
		fetch(url)
			.then((res) => res.json())
			.then((json) => (this.geojson = json))
			.catch((e) => console.error("Error while loading map", e));
	}

	updateCenter(centerString) {
		let coordinates = centerString.split(",").map((el) => el.trim());

		let zoom = coordinates[2] || this.zoom;

		this.$map.setView([coordinates[0], coordinates[1]], parseFloat(zoom));
	}

	updated(changedProperties) {
		if (changedProperties.has("src")) {
			this.requestGeoJson(this.src);
		}
		if (changedProperties.has("geojson")) {
			this.updateGeoJson(this.geojson);
		}
		if (changedProperties.has("focus")) {
			this.updateCenter(this.focus);
		}
	}

	render() {
		const css = style`
			:host {
				display: block;
				width: 100vw;
				min-height: 50vh;
				max-height: 100vh;
				border-radius: var(--card-radius);
				box-shadow: var(--card-shadow);
				overflow: hidden;
				color: var(--secondary-color);
			}

			.map-container {
				width: 100%;
				min-height: 50vh;
			}
		`;

		return html`
			<link
				type="text/css"
				rel="stylesheet"
				href="/node_modules/leaflet/leaflet.css"
			/>
			${css}
			<div id="map" class="map-container"></div>
		`;
	}
}

customElements.define("ek-map", Map);

class MapMarker extends LitElement {
	static get properties() {
		return {
			location: String,
			caption: String,
			opened: Boolean,
		};
	}

	get loc() {
		return this.location.split(",").map((el) => el.trim());
	}
}

customElements.define("ek-map-marker", MapMarker);
