import { LitElement, html } from "lit-element";
import { style } from "../util/styler";

class FloatingCardComponent extends LitElement {
  static get properties() {
    return {
      color: String,
      lightX: Number,
      lightY: Number,
      lightDirection: Number,
      rotateX: Number,
      rotateY: Number
    };
  }

  constructor() {
    super();
    this.moveLight = this.moveLight.bind(this);
  }

  moveLight(e) {
    let thisRect = this.getBoundingClientRect();
    let center = {
      x: thisRect.left + thisRect.width / 2,
      y: thisRect.top + thisRect.height / 2
    };
    this.lightX = e.clientX - thisRect.left;
    this.lightY = e.clientY - thisRect.top;

    let distanceY = e.clientY - center.y;
    let distanceX = e.clientX - center.x;

    this.rotateX = -1 * ((distanceX * 10) / thisRect.width);
    this.rotateY = -1 * ((distanceY * 10) / thisRect.height);

    let angle = Math.atan2(distanceY, distanceX) * (180 / Math.PI);
    this.lightDirection = angle;
  }

  mapDistance(min, max) {}

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("mousemove", this.moveLight);
  }

  render() {
    // language=CSS
    let css = style`

        .scaler {
          transition: 0.5s ease transform;
          transform: scale(1);
        }
        
        .scaler:hover{
          transform: scale(1.05);
        }
        
        .scaler:active, .scaler:focus{
          transform: scale(1.01);
        }

        .card {
          border-radius: 2px;
          overflow: hidden;
          position: relative;
          box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.3), 2px 0 3px rgba(0, 0, 0, 0.3);
          background: ${this.color || "#242424"};
        }
        
        .card::before {
          content: "";
          position: absolute;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%,rgba(255,255,255,0) 75%);
          width: 100px;
          height: 100px;
          left: ${this.lightX ? this.lightX + "px" : "-100px"};
          top: ${this.lightY ? this.lightY + "px" : "-100px"};
          z-index: 1;
          transform: translate(-50%,-50%);
        }
        
        .card:hover {
            transform: perspective(560px) rotateY(${this.rotateX}deg) rotateX(${
      this.rotateY
    }deg);
        }
        
        .card:not(:hover){
          transition: 0.5s ease transform;
        }
        
        .container {
          position: relative;
          border-radius: inherit;
          margin: 2px;
          background: inherit;
          z-index: 2;
        }
        
        .container::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          
          width: 150%;
          height: 150%;
          opacity: 0;
          
          transition: 0.5s linear opacity;
          transform: translate(-50%,-50%) rotate(${this.lightDirection -
            90}deg);
          background: linear-gradient(to top, rgba(255,255,255,0.3) 0%,rgba(255,255,255,0.03) 100%);
        }
        
        .card:hover .container::before {
          opacity: 1;
        }
        
        .content {
            position: relative;
            z-index: 3;
        }
    `;

    return html`
      ${css}
      <div class="scaler">
        <div class="card">
          <div class="container">
            <div class="content"><slot></slot></div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("floating-card", FloatingCardComponent);
