import { LitElement, html } from "lit-element";
import { style } from "../util/styler";
import "./icon.js";

class AudioPlayer extends LitElement {
	static get properties() {
		return {
			src: String,
			playing: Boolean,
			loop: Boolean,
			duration: Number,
			currentTime: Number,
		};
	}

	constructor() {
		super();

		this.noFullscreen = false;
		this.playing = false;
		this.loop = false;
		this.progress = 0;
		this.duration = 0;
		this.currentTime = 0;
	}

	get audioEl() {
		return this.shadowRoot.querySelector("audio");
	}

	get progressBar() {
		return this.shadowRoot.getElementById("progress-bar");
	}

	get progression() {
		return (this.currentTime / this.duration) * 100;
	}

	addZeros(value) {
		let str = value.toString();
		if (str.length < 2) {
			str = "0" + str;
		}
		return str;
	}

	displayedDuration(value) {
		let hours = Math.floor(value / 3600);
		let minutes = Math.floor((value - hours * 3600) / 60);
		let seconds = Math.floor(value - hours * 3600 - minutes * 60);
		if (hours > 0) {
			return `${this.addZeros(hours)}:${this.addZeros(
				minutes
			)}:${this.addZeros(seconds)}`;
		} else {
			return `${this.addZeros(minutes)}:${this.addZeros(seconds)}`;
		}
	}

	firstUpdated(changedProperties) {
		let audio = this.audioEl;

		audio.addEventListener("play", () => (this.playing = true));
		audio.addEventListener("pause", () => (this.playing = false));
		audio.addEventListener("timeupdate", () => {
			if (this.dragging) return;
			this.currentTime = this.audioEl.currentTime;
			this.duration = this.audioEl.duration;
		});
		audio.addEventListener("loadedmetadata", () => {
			if (this.dragging) return;
			this.currentTime = this.audioEl.currentTime;
			this.duration = this.audioEl.duration;
		});
		audio.addEventListener(
			"durationchanged",
			() => (this.duration = this.audioEl.duration)
		);
	}

	resetAudio() {
		let audio = this.audioEl;
		audio.currentTime = 0;
		audio.pause();
	}

	updated(changedProperties) {
		if (changedProperties.has("playing")) {
			if (this.playing) {
				this.audioEl.play();
			} else {
				this.audioEl.pause();
			}
		}
	}

	pause() {
		this.audioEl.pause();
	}

	seek(seekTime) {
		this.audioEl.currentTime;
	}

	play() {
		this.audioEl.play();
	}

	handlePress() {
		this.lastPlaying = this.playing;
		this.pause();
		this.dragging = true;
	}

	handleMove(e) {
		if (!this.dragging) return;
		this.currentTime = this.getTimeProgress(e);
	}

	getTimeProgress(e) {
		let rect = this.progressBar.getBoundingClientRect();
		let mousex = e.clientX - rect.left;
		let progress = mousex / rect.width;
		return this.duration * progress;
	}

	handleRelease(e) {
		if (!this.dragging) return;
		this.audioEl.currentTime = this.getTimeProgress(e);
		if (this.lastPlaying) {
			this.audioEl.play();
		}
		this.dragging = false;
	}

	render() {
		const css = style`
			:host {
				display: block;
				border-radius: var(--card-radius);
				box-shadow: var(--card-shadow);
				overflow: hidden;
				width: 100%;
				background: var(--bright-background-color);
				color: var(--onbright-text-color);
			}

			.container {
				display: flex;
				justify-content: center;
				align-items: flex-start;
				padding: 15px;
			}

			.play-btn {
				width: 55px;
				height: 55px;
				border-radius: 100%;
				color: var(--primary-color);
				box-shadow: 0 0 5px rgba(0,0,0,0.3);

				line-height: 55px;
				font-size: 50px;
				border:none;
				padding: 0;
				cursor: pointer;
			}

			.progression {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: stretch;
				flex: 1;
				width: 300px;
				margin-top: -5px;
			}

			.progress-bar {
				width: 100%;
				height: 10px;
				background: rgba(0,0,0,0.2);
				border-radius: 0 5px 5px 0;
			}

			.progress-bar .bar {
				background: var(--primary-color);
				height: 100%;
				border-radius: 0 5px 5px 0;
			}

			.duration {
				font-size: 13px;
				opacity: 0.5;
				text-align:right;
			}

			.reset-toolbar {
				opacity: 0.5;
				text-align:right;
			}

			.reset {
				border: none;
				padding: 0;
				font-size: 15px;
				cursor: pointer;
			}

			.reset.hidden {
				opacity: 0;
			}
		`;

		return html`
			${css}
			<div class="container">
				<button class="play-btn" @click=${() => (this.playing = !this.playing)}>
					<ek-icon icon="${this.playing ? "pause" : "play"}"></ek-icon>
				</button>
				<div class="progression"
					@mousemove=${(e) => this.handleMove(e)}
					@mouseup=${(e) => this.handleRelease(e)}
					@mouseleave=${(e) => this.handleRelease(e)}>
					<div class="reset-toolbar">
					<button class="reset ${this.currentTime > 0 ? "" : "hidden"}" @click=${() =>
			this.resetAudio()} ><ek-icon icon="refresh"></ek-icon></button>
					</div>
					<div class="progress-bar"
					id="progress-bar"
					@mousedown=${(e) => this.handlePress(e)}>
						<div class="bar" style="width: ${this.progression}%">
					</div>
					<div class="duration">${this.displayedDuration(
						this.currentTime
					)} / ${this.displayedDuration(this.duration)}</div>
				</div>
			</div>
			<audio src="${this.src}" ?loop="${this.loop}"></video>
		`;
	}
}

customElements.define("ek-audio", AudioPlayer);
