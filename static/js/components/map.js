import * as L from "../libs/leaflet-src.esm.js";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
<link
    type="text/css"
    rel="stylesheet"
    href="/css/libs/leaflet.css"
/>
<style>
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
</style>
<div id="map" class="map-container"></div>
`;

class MapComponent extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.append(TEMPLATE.content.cloneNode(true));
    }

    this.setupMap();
    this.updateSrc();
    this.updateGeoJson();
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

  updateGeoJson() {
    if (!this.geojson || !this.$map) return;

    if (this.$geojsonLayer) {
      this.$geojsonLayer.removeFrom(this.$map);
    }

    let color = window.getComputedStyle(this).color;

    this.$geojsonLayer = L.geoJSON(this.geojson, {
      style: function (feature) {
        return { color };
      },
    }).addTo(this.$map);

    let geojsonBounds = this.$geojsonLayer.getBounds();

    this.$map.fitBounds(geojsonBounds, {
      padding: [20, 20],
    });
  }

  requestGeoJson(url) {
    fetch(url)
      .then((res) => res.json())
      .then((json) => (this.geojson = json))
      .catch((e) => console.error("Error while loading map", e));
  }

  updateSrc() {
    if (!this.src) return;
    this.requestGeoJson(new URL(this.src, this.baseURI));
  }

  get geojson() {
    return this.$geojson;
  }

  set geojson(val) {
    this.$geojson = val;
    this.updateGeoJson();
  }

  get src() {
    return this.$src;
  }

  set src(val) {
    let lastVal = this.src;
    this.$src = val;
    if (lastVal != this.src) {
      this.updateSrc();
    }
  }

  static get observedAttributes() {
    return ["src"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch (name) {
      case "src":
        this.src = newVal;
        break;
    }
  }
}

customElements.define("ek-map", MapComponent);

class MapMarkerComponent extends HTMLElement {
  get loc() {
    return this.location.split(",").map((el) => el.trim());
  }

  get location() {
    return this.getAttribute("location");
  }

  get caption() {
    return this.getAttribute("caption");
  }

  get opened() {
    return this.hasAttribute("opened");
  }
}

customElements.define("ek-map-marker", MapMarkerComponent);
