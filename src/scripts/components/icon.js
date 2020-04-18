import { LitElement, html } from "lit-element";
import { style } from "../util/styler";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";

if (!window.icons) {
	window.icons = {};
}

class Icon extends LitElement {
	static get properties() {
		return {
			icon: String,
			svgContent: String,
		};
	}

	updated(changedProperties) {
		if (changedProperties.has("icon")) {
			if (!window.icons[this.icon]) {
				window.icons[this.icon] = fetch(
					`/node_modules/@mdi/svg/svg/${this.icon}.svg`
				)
					.then((response) => {
						return response.text();
					})
					.then((data) => {
						window.icons[this.icon] = data;
						this.svgContent = data;
					});
			} else {
				if (window.icons[this.icon] instanceof Promise) {
					window.icons[this.icon].then(
						() => (this.svgContent = window.icons[this.icon])
					);
				} else {
					this.svgContent = window.icons[this.icon];
				}
			}
		}
	}

	render() {
		let fontSize = window
			.getComputedStyle(this)
			.getPropertyValue("font-size");

		const css = style`
			:host {
				display: inline-block;
				position: relative;
				top: 2px;
			}

			svg {
				display: inline-block;
				width: ${fontSize};
				height: ${fontSize};
			}

			svg * {
				fill: currentcolor;
			}
		`;

		if (this.svgContent) {
			return html`
				${css}${this.svgContent ? unsafeHTML(this.svgContent) : ""}
			`;
		} else {
			return html`
				${css}<slot></slot>
			`;
		}
	}
}

customElements.define("ek-icon", Icon);
