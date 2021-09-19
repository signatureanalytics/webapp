import store from '../state/store';
import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';

class Header extends connect(store)(LitElement) {
    static get styles() {
        return css`
            header {
                box-sizing: border-box;
                position: relative;
                height: 100%;
                padding: 10px;
                border-bottom: 2px solid #ddd;
            }
            .sa-logo {
                position: relative;
                display: inline-block;
                margin-inline: 10px;
                background-image: url(/assets/sa-logo.png);
                background-size: contain;
                width: 156px;
                height: 50px;
            }
            .covantage-logo {
                position: relative;
                display: inline-block;
                background-image: url(/assets/covantage-logo.png);
                background-size: contain;
                width: 400px;
                height: 42px;
            }
        `;
    }
    static get properties() {
        return {
            report: { type: String },
            page: { type: Object },
        };
    }
    stateChanged(state) {
        this.report = state.nav.report;
    }
    render() {
        return html`
            <header>
                <div class="sa-logo"></div>
                <div class="covantage-logo"></div>
                <h1>${this.report}</h1>
            </header>
        `;
    }
}

customElements.define('sa-header', Header);
