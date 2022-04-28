import { LitElement, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import buttonStyles from './buttonStyles';

class Button extends LitElement {
    static styles = buttonStyles;
    static properties = {
        disabled: Boolean,
        name: String,
        size: Number,
        fill: String,
        stroke: String,
        transform: String,
        label: String,
    };
    render() {
        return html`<div class="wrapper" ?disabled="${this.disabled}">
            <sa-icon
                name="${this.name}"
                size="${this.size}"
                transform="${ifDefined(this.transform)}"
                fill="${ifDefined(this.fill)}"
                stroke="${ifDefined(this.stroke)}"
            ></sa-icon>
            <div class="label">${this.label}</div>
        </div>`;
    }
}

customElements.define('sa-button', Button);
