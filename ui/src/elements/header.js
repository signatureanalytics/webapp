import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { navSelectors } from '../state/navSelectors';
import store from '../state/store';
import saLogo from '../assets/sa-logo.png';
import covantageLogo from '../assets/covantage-logo.png';

const fixAssetUrl = url => `${`/${url}`.replace('//', '/')}`;

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
                width: 156px;
                height: 50px;
            }
            .covantage-logo {
                position: relative;
                display: inline-block;
                width: 400px;
                height: 42px;
            }
            h1 {
                display: inline-block;
            }
        `;
    }
    constructor() {
        super();
    }
    static get properties() {
        return {
            currentReport: { type: String },
            currentPage: { type: Object },
            currentTitle: { type: String },
        };
    }
    stateChanged(state) {
        this.currentReport = navSelectors.currentReport(state);
        this.currentPage = navSelectors.currentPage(state);
        this.currentTitle = navSelectors.currentTitle(state);
        const documentTitle = `${this.currentTitle ? `${this.currentTitle} -` : ''} Co:Vantage™ by Signature Analytics`;
        if (documentTitle !== document.title) {
            document.title = documentTitle;
        }
    }
    render() {
        return html`
            <header>
                <img class="sa-logo" src="${fixAssetUrl(saLogo)}" />
                <img class="covantage-logo" src="${fixAssetUrl(covantageLogo)}" />
            </header>
        `;
    }
}

customElements.define('sa-header', Header);
