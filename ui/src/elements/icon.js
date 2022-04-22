import { LitElement, html, svg } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

class Icon extends LitElement {
    static properties = {
        name: { type: String, attribute: true },
        size: Number,
        stroke: String,
        fill: String,
        transform: String,
        classes: Object,
    };

    icons = {
        completed: svg`<path d="M18.9 35.7 7.7 24.5 9.85 22.35 18.9 31.4 38.1 12.2 40.25 14.35Z" />`,
        failed: svg`<path d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z" />`,
        running: svg`<path d="M24 40Q17.35 40 12.675 35.325Q8 30.65 8 24Q8 17.35 12.675 12.675Q17.35 8 24 8Q28.25 8 31.45 9.725Q34.65 11.45 37 14.45V8H40V20.7H27.3V17.7H35.7Q33.8 14.7 30.85 12.85Q27.9 11 24 11Q18.55 11 14.775 14.775Q11 18.55 11 24Q11 29.45 14.775 33.225Q18.55 37 24 37Q28.15 37 31.6 34.625Q35.05 32.25 36.4 28.35H39.5Q38.05 33.6 33.75 36.8Q29.45 40 24 40Z" />`,
        pending: svg`<path d="M18 5V2H30V5ZM22.5 27.35H25.5V15.85H22.5ZM24 43.95Q20.3 43.95 17.025 42.525Q13.75 41.1 11.3 38.65Q8.85 36.2 7.425 32.925Q6 29.65 6 25.95Q6 22.25 7.425 18.975Q8.85 15.7 11.3 13.25Q13.75 10.8 17.025 9.375Q20.3 7.95 24 7.95Q27.35 7.95 30.3 9.075Q33.25 10.2 35.55 12.2L38.1 9.65L40.2 11.75L37.65 14.3Q39.45 16.3 40.725 19.15Q42 22 42 25.95Q42 29.65 40.575 32.925Q39.15 36.2 36.7 38.65Q34.25 41.1 30.975 42.525Q27.7 43.95 24 43.95ZM24 40.95Q30.25 40.95 34.625 36.575Q39 32.2 39 25.95Q39 19.7 34.625 15.325Q30.25 10.95 24 10.95Q17.75 10.95 13.375 15.325Q9 19.7 9 25.95Q9 32.2 13.375 36.575Q17.75 40.95 24 40.95ZM24 26Q24 26 24 26Q24 26 24 26Q24 26 24 26Q24 26 24 26Q24 26 24 26Q24 26 24 26Q24 26 24 26Q24 26 24 26Z" />`,
        disabled: svg`<path d="M40.65 44.95 34.4 38.7Q32.2 40.3 29.625 41.15Q27.05 42 24.15 42Q20.4 42 17.1 40.575Q13.8 39.15 11.325 36.7Q8.85 34.25 7.425 30.95Q6 27.65 6 23.9Q6 21 6.85 18.4Q7.7 15.8 9.3 13.6L3.05 7.35L5.2 5.2L42.8 42.8ZM24.15 39Q26.4 39 28.45 38.35Q30.5 37.7 32.25 36.55L11.45 15.75Q10.3 17.5 9.65 19.5Q9 21.5 9 23.75Q9 30.1 13.4 34.55Q17.8 39 24.15 39ZM30.45 17.65V14.65H35.7Q33.5 12.1 30.525 10.55Q27.55 9 24.15 9Q21.8 9 19.7 9.65Q17.6 10.3 15.75 11.45L13.6 9.3Q15.85 7.7 18.525 6.85Q21.2 6 24.15 6Q28.15 6 31.725 7.75Q35.3 9.5 37.9 12.55V7.25H40.9V17.65ZM25.55 21.25 22.55 18.25V13.85H25.55ZM38.7 34.4 36.55 32.25Q37.7 30.45 38.35 28.35Q39 26.25 39 23.95H42Q42 26.9 41.15 29.525Q40.3 32.15 38.7 34.4Z"/>`,
        doubleArrow: svg`<path d="M24.7 38 35.2 24 24.7 10H28.4L38.9 24L28.4 38ZM12.1 38 22.6 24 12.1 10H15.8L26.3 24L15.8 38Z"/>`,
    };

    constructor() {
        super();
        this.size = 48;
    }

    render() {
        return html`<svg
            xmlns="http://www.w3.org/2000/svg"
            height="${this.size}"
            width="${this.size}"
            stroke="${ifDefined(this.stroke)}"
            fill="${ifDefined(this.fill)}"
            transform="${ifDefined(this.transform)}"
            viewBox="0 0 48 48"
        >
            ${this.icons[this.name]}
        </svg>`;
    }
}

customElements.define('sa-icon', Icon);
