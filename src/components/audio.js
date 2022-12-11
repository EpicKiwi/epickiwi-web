import "./icon.js";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
<style>
    :host {
        display: block;
        width: 100%;
        overflow: hidden;

        --audio-color: var(--primary-color, white);
        --audio-text-color: var(--ondark-text-color, black);

        background: var(--audio-color);
        color: var(--audio-text-color);

        border-radius: 5px;
        overflow: hidden;
    }

    * {
        color: inherit;
        box-sizing: border-box;
    }

    #container {
        width: 100%;
        height: 100%;

        min-height: 125px;
        
        display: grid;
        grid-template-columns: min-content 1fr;
        grid-template-rows: min-content 1fr;

        padding-bottom: 10px;
        position: relative;

        background: linear-gradient(-10deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%);
    }

    .play-indicator {
        width: 50px;
        height: 50px;

        margin-top: 5px;
        margin-left: 10px;

        font-size: 35px;
        line-height: 55px;

        border-radius: 100%;

        cursor: pointer;

        border: none;
        background: none;

        position: relative;
        padding: 0;
    }

    .play-indicator:hover, .play-indicator:focus {
      background: rgba(255,255,255,0.1);
    }

    .play-indicator:active {
      background: rgba(255,255,255,0.2);
    }

    @keyframes play-ripple {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-50%) scale(0);
        }
        5% {
            opacity: 0.2;
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-50%) scale(10);
        }
    }

    .play-indicator .ripple {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        transform: translateX(-50%) translateY(-50%);
        border-radius: 100%;

        background: currentcolor;
        opacity: 0;
        pointer-events: none;
    }

    :host(.playing) .ripple {
        animation: ease-out 1s play-ripple;
    }

    .progress  {

      grid-column: 1 / 3;
      grid-row: 1;

      margin-top: 4px;
      margin-left: 2.5px;
      margin-right: 2.5px;
      border-radius: 2px 2px 0 0;
      overflow: hidden;

      height: 5px;

        background: transparent;

        border: none;

        -webkit-appearance: none;
        appearance: none;

        position: relative;
        z-index: 5;
    }

    .progress::-webkit-progress-value, .progress::-moz-progress-bar {
        background: currentcolor;
    }

    :host(.playing) .play-icon {
        display: none;
    }

    :host(:not(.playing)) .pause-icon {
        display: none;
    }

    #title {
      text-align: left;
      margin: 0;
      margin-left: 10px;
      font-size: 1em;
      font-weight: normal;
      margin-bottom: 5px;
      margin-top: 20px;
    }

    #play {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      border: none;
    }
</style>
<div id="container">
    <button id="play" tabindex="-1"></button>
  <progress id="progress" class="progress" min="0" max="100" value="0" ></progress>
    <button class="play-indicator">
        <ek-icon src="/src/imgs/icons/play.svg" class="play-icon"></ek-icon>
        <ek-icon src="/src/imgs/icons/pause.svg" class="pause-icon"></ek-icon>
        <div class="ripple"></div>
    </button>
    <h5 id="title"></h5>
</div>`;

class AudioElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

    this.shadowRoot
      .getElementById("play")
      .addEventListener("click", this.handlePlayButton.bind(this));

    this.shadowRoot
      .getElementById("play")
      .addEventListener("dblclick", this.handleResetButton.bind(this));

    this.shadowRoot
      .querySelector(".play-indicator")
      .addEventListener("click", this.handlePlayButton.bind(this));

    this.shadowRoot
      .querySelector(".play-indicator")
      .addEventListener("dblclick", this.handleResetButton.bind(this));

    this.audioEl = null;

    this.initAudioElement();

    this.updateUi()
  }

  getTitle(){
    if(this.title) return this.title;
    
    if(this.audioEl && this.audioEl.src){
      let src = this.audioEl.src;
      return src.split("/").slice(-1)[0]
    }
  }

  updateUi(){
    this.shadowRoot.getElementById("title").textContent = this.getTitle() || "";
  }

  initAudioElement() {
    this.audioEl = this.querySelector("audio");

    this.audioEl.addEventListener("play", () => {
      this.updatePlayState(true);
    });

    this.audioEl.addEventListener("pause", () => {
      this.updatePlayState(false);
    });

    this.audioEl.addEventListener("timeupdate", () => {
      this.updateProgress(this.audioEl.currentTime / this.audioEl.duration);
    });
  }

  handlePlayButton(e) {
    if (this.audioEl.paused) {
      this.audioEl.play();
    } else {
      this.audioEl.pause();
    }
  }

  handleResetButton(e){
    this.audioEl.pause();
    this.audioEl.currentTime = 0;
  }

  updatePlayState(playing) {
    this.classList.toggle("playing", playing);
  }

  updateProgress(progress) {
    this.shadowRoot.getElementById("progress").value = progress * 100;
  }
}

customElements.define("ek-audio", AudioElement);
