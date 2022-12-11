import "./icon.js";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = /*html*/ `
<style>
:host {
    display: block;
    border-radius: var(--card-radius);
    box-shadow: var(--card-shadow);
    overflow: hidden;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
}

.container {
    position: relative;
    max-width: 100%;
    display: block;
    background: black;
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;
}

.container.fullscreen, .container.fullscreen ::slotted(video) {
    width: 100% !important;
    height: 100% !important;
}

::slotted(video) {
    margin: auto;
    content-fit: scale-down;
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

    border: none;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,0.2);

    transition: opacity linear 0.1s;
}

.playing .play {
    opacity: 0;
}

.playing .play:focus, .playing .play:hover {
    outline: none;
    background: rgba(255,255,255,0.2);
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
    cursor: pointer;
}

.tool-buttons > * > * {
    position: relative;
    top: -0px;
}

.tool-buttons > button:focus, .tool-buttons > button:hover {
    outline: none;
    background: rgba(255,255,255,0.2);
}

</style>
<div class="container" id="container" >
    <slot></slot>
    <div class="controls">
        <button class="play" id="play-button">
        <ek-icon src="/src/imgs/icons/play.svg"></ek-icon>
        </div>
        <nav class="tool-buttons" id="toolbar">
            <button id="fullscreen-button">
                <ek-icon src="/src/imgs/icons/fullscreen.svg"></ek-icon>
            </button>
        </nav>
    </div>
</div>
`;

class VideoPlayerComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
  }

  connectedCallback() {
    this.containerEl = this.shadowRoot.getElementById("container");
    this.playButtonEl = this.shadowRoot.getElementById("play-button");
    this.videoEl = null;
    this.fullscreenButtonEl =
      this.shadowRoot.getElementById("fullscreen-button");

    this.playButtonEl.addEventListener("click", () => this.togglePlay());
    this.fullscreenButtonEl.addEventListener("click", () =>
      this.toggleFullscreen()
    );

    this.addEventListener("fullscreenchange", () => this.updateFullscreen());

    this.initVideoElement();
  }

  initVideoElement() {
    this.videoEl = this.querySelector("video");

    this.videoEl.addEventListener("play", () => {
      this.playing = true;
    });

    this.videoEl.addEventListener("pause", () => {
      this.playing = false;
    });

    this.videoEl.addEventListener("volumechange", () => {
      this.muted = this.videoEl.muted;
    });

    this.videoEl.controls = false;
  }

  get isFullscreen() {
    return document.fullscreenElement == this;
  }

  updateFullscreen() {
    this.containerEl.classList.toggle("fullscreen", this.isFullscreen);
  }

  togglePlay() {
    this.playing = !this.playing;
  }

  updatePlay() {
    if (!this.videoEl || !this.containerEl) return;
    if (this.playing) {
      this.videoEl.play();
    } else {
      this.videoEl.pause();
    }
    this.containerEl.classList.toggle("playing", this.playing);
  }

  get playing() {
    return !!this.$playing;
  }

  set playing(val) {
    this.$playing = !!val;
    this.updatePlay();
  }

  get src() {
    return this.$src;
  }

  set src(val) {
    this.$src = val;
    this.updateSrc();
  }

  toggleFullscreen() {
    if (this.isFullscreen) {
      document.exitFullscreen();
    } else if (!this.noFullscreen) {
      this.requestFullscreen();
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

customElements.define("ek-video", VideoPlayerComponent);
