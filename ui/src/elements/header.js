import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { selectors } from '../state/selectors';
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
            selectedReport: { type: String },
            selectedPage: { type: Object },
            workspace: { type: Object },
        };
    }

    get title() {
        const workspaceName = this.workspace?.name;
        const reportName = this.selectedReport?.name;
        const pageName = this.selectedPage?.name;
        return `Co:Vantage™${
            workspaceName
                ? ` ${workspaceName}${reportName ? ` ${reportName} Report${pageName ? ` - ${pageName}` : ''}` : ''}`
                : ''
        }`;
    }

    stateChanged(state) {
        this.selectedReport = selectors.selectedReport(state);
        this.selectedPage = selectors.selectedPage(state);
        this.workspace = selectors.workspace(state);
        if (this.title !== document.title) {
            document.title = this.title;
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
