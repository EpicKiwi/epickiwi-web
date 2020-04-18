import { LitElement, html } from "lit-element";
import { style } from "../util/styler";
import "./icon.js";

class Code extends LitElement {
	static get properties() {
		return {
			language: String,
			filename: String,
			copied: Boolean,
		};
	}

	get showHeader() {
		return !!this.filename;
	}

	get canCopy() {
		return !!(document.body.createTextRange || window.getSelection);
	}

	copyToClipboard() {
		let target = this;

		if (document.body.createTextRange) {
			const range = document.body.createTextRange();
			range.moveToElementText(target);
			range.select();
		} else if (window.getSelection) {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(target);
			selection.removeAllRanges();
			selection.addRange(range);
		}

		document.execCommand("copy");

		this.copied = true;
		setTimeout(() => (this.copied = false), 2000);
	}

	render() {
		let css = style`
			:host {
				display: block;
				border-radius: 5px;
				overflow: hidden;
				background-color: var(--background-color);
				color: var(--text-color);
				position: relative;
				border: solid 1px rgba(255,255,255,0.2);
				counter-reset: line-counter;
			}

			.content {
				margin: 0;
				padding: 10px;
				padding-left: 0;
			}

			.content, .content > * {
				word-wrap: break-word;
				overflow-wrap: anywhere;
				white-space: pre-wrap;
				font-family: monospace;
			}

			.header {
				display: flex;
				justify-content: flex-start;
				align-items: center;
				padding: 10px 20px;
			}

			.header .separator {
				flex: 1;
			}

			.header .filename {
				font-weight: bolder;
			}

			.header > * {
				margin-right: 20px;
			}

			.header > :last-child {
				margin-right: 0;
			}

			.line {
				border-top: solid 1px rgba(255,255,255,0.2);
				width: calc(100% - 40px);
				margin: auto; 
			}

			.footer {
				text-align: right;
				font-size: 10px;
				padding: 5px 20px;
			}

			.copy {
				border: none;
				padding: 5px 10px;
				border-radius: 3px;
				background: none;
				color: var(--text-color);
				font-size: 20px;
				cursor: pointer;
			}

			.copy.floating {
				position: absolute;
				right: 10px;
				top: 10px;
			}

			.copy:hover {
				background: rgba(255,255,255,0.1);
			}

			.copy.success {
				color: var(--success-color);
			}

			::slotted(.line) {
				position: relative;
				padding-left: 50px !important;
			}

			::slotted(.line)::before {
				position: absolute;
				left: 0;
				top: 0;

				display: inline-block;
				counter-increment: line-counter;
				content: counter(line-counter);
				width: 40px;
				opacity: 0.5;
				margin-right: 10px;
				text-align: right;
				white-space: nowrap;
				height: 100%;
			}
		`;

		let copyBtn = this.canCopy
			? html`
					<button
						@click="${() => this.copyToClipboard()}"
						class="copy ${this.copied ? "success" : ""} ${!this
							.showHeader
							? "floating"
							: ""}"
						title="Copier dans le presse papier"
					>
						<ek-icon
							icon="${this.copied
								? "clipboard-check-outline"
								: "clipboard-text-outline"}"
						></ek-icon>
					</button>
			  `
			: "";

		let heading = html`
			<div class="header">
				<span class="filename">${this.filename}</span>
				<span class="separator"></span>
				${copyBtn}
			</div>
			<div class="line"></div>
		`;

		let footer = html`
			<div class="footer">
				<span class="language">${this.language}</span>
			</div>
		`;

		return html`
			${css} ${this.showHeader ? heading : ""}
			<pre class="content"><code><slot></slot></code></pre>
			${!this.showHeader ? copyBtn : ""}${this.language ? footer : ""}
		`;
	}
}

customElements.define("ek-code", Code);
