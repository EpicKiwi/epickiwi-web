import { LitElement, html } from "lit-element";
import { style } from "../util/styler";
import "./FloatingCardComponent";

class LinkCardComponent extends LitElement {
  static get properties() {
    return {
      color: String,
      name: String,
      abbr: String,
      image: String,
      caption: String
    };
  }

  render() {
    // language=CSS
    let css = style`
        
        .container {
          position: relative;
          padding: 10px;
          width: 100px;
          height: 100px;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        
        .abbr {
            font-size: 50px;
            font-weight: lighter;
            position: relative;
            left: -5px;
        }
        
        .name {
          font-size: 15px;
        }
        
        .image {
          position: absolute;
          top: -5%;
          right: -20%;
          width: 100%;
          height: 100%;
          opacity: 0.2;
        }
        
        
        .caption {
          position: absolute;
          top: 5px;
          right: 5px;
          font-size: 12px;
          opacity: 0;
          transition: 0.5s linear opacity;
          z-index: -1;
        }
        
        .container:hover .caption {
          opacity: 1;
        }
        
        .image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `;

    return html`
      ${css}
      <floating-card color=${this.color}>
        <div class="container">
          <div class="caption">${this.caption}</div>
          <div class="abbr">${this.abbr}</div>
          <div class="name">${this.name}</div>
          <div class="image"><img src=${this.image} /></div>
        </div>
      </floating-card>
    `;
  }
}

customElements.define("link-card", LinkCardComponent);
