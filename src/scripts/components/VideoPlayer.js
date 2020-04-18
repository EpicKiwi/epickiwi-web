import { LitElement, html } from "lit-element";
import { style } from "../util/styler";
import "./icon.js";

class VideoPlayer extends LitElement {
	static get properties() {
		return {
			src: String,
			muted: Boolean,
			playing: Boolean,
			loop: Boolean,
			showToolbar: Boolean,
			noFullscreen: Boolean,
			isFullscreen: Boolean,
		};
	}

	constructor() {
		super();

		this.noFullscreen = false;
		this.showToolbar = true;
		this.plaing = false;
		this.loop = false;
		this.muted = false;
	}

	get showActiveToolbar() {
		return !this.playing || this.showToolbar;
	}

	get videoEl() {
		return this.shadowRoot.querySelector("video");
	}

	firstUpdated(changedProperties) {
		let video = this.videoEl;

		video.muted = this.muted;

		video.addEventListener("play", () => (this.playing = true));
		video.addEventListener("pause", () => (this.playing = false));
		video.addEventListener(
			"volumechange",
			() => (this.muted = video.muted)
		);

		this.addEventListener("fullscreenchange", () => {
			this.isFullscreen = document.fullscreenElement == this;
		});
	}

	toggleFullscreen() {
		console.log("fullscreen", this.isFullscreen);
		if (this.isFullscreen) {
			document.exitFullscreen();
		} else if (!this.noFullscreen) {
			this.requestFullscreen();
		}
	}

	updated(changedProperties) {
		if (changedProperties.has("playing")) {
			if (this.playing) {
				this.videoEl.play();
			} else {
				this.videoEl.pause();
			}
		}

		if (changedProperties.has("muted")) {
			this.videoEl.muted = this.muted;
		}
	}

	render() {
		const css = style`
			:host {
				display: block;
				border-radius: var(--card-radius);
				box-shadow: var(--card-shadow);
				overflow: hidden;
			}

			.container, video {
				position: relative;
				max-width: 100%;
				display: block;
				background: black;
			}

			.container.fullscreen, .container.fullscreen video {
				width: 100%;
				height: 100%;
			}

			video {
				margin: auto;
			}

			.controls {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
			}

			.play {
				font-size: 130px;
				color: white;
				width: 100%;
				height: 100%;

				display: flex;
				justify-content: center;
				align-items: center;
				background: rgba(0,0,0,0.2);

				transition: opacity linear 0.1s;
			}

			.play.hidden {
				opacity: 0;
			}

			.tool-buttons {
				position: absolute;
				right: 10px;
				bottom: 10px;
				transition: opacity linear 0.1s;
			}

			.tool-buttons.hidden {
				opacity: 0;
			}

			.tool-buttons > * {
				display: block;
				font-size: 20px;
				color: white;
				border-radius: 100%;
				background: rgba(0,0,0,0.5);
				border: solid 1px rgba(255,255,255,0.5);
				width: 40px;
				height: 40px;
				line-height: 40px;
				text-align: center;
				margin-top: 10px;
			}

			.tool-buttons > button:focus {
				outline: none;
			}

		`;

		return html`
			${css}
			<div
				class="container ${this.isFullscreen ? "fullscreen" : ""}"
				@mouseenter=${() => (this.showToolbar = true)}
				@mouseleave=${() => (this.showToolbar = false)}
			>
				<video src="${this.src}" ?loop="${this.loop}"></video>
				<div class="controls">
					<div
						class="play ${this.playing ? "hidden" : ""}"
						@click=${() => (this.playing = !this.playing)}
					>
						<ek-icon icon="play"></ek-icon>
					</div>
					<nav
						class="tool-buttons ${!this.showActiveToolbar
							? "hidden"
							: ""}"
					>
						${!this.noFullscreen
							? html`
									<button
										@click=${() => this.toggleFullscreen()}
									>
										<ek-icon icon="fullscreen"></ek-icon>
									</button>
							  `
							: ""}
						<button @click=${() => (this.muted = !this.muted)}>
							<ek-icon
								icon="${this.muted
									? "volume-off"
									: "volume-high"}"
							></ek-icon>
						</button>
					</nav>
				</div>
			</div>
		`;
	}
}

customElements.define("ek-video", VideoPlayer);
