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
                width: 188px;
                height: 38px;
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

    static get properties() {
        return {
            selectedReportId: { type: String },
            selectedPageId: { type: String },
            workspace: { type: Object },
            pageById: { type: Object },
            reportById: { type: Object },
        };
    }

    stateChanged(state) {
        this.selectedReportId = selectors.selectedReportId(state);
        this.selectedPageId = selectors.selectedPageId(state);
        this.workspace = selectors.workspace(state);
        this.pageById = selectors.pageById(state);
        this.reportById = selectors.reportById(state);
        if (this.title !== document.title) {
            document.title = this.title;
        }
    }

    get title() {
        const workspaceName = this.workspace?.name;
        const reportName = this.reportById(this.selectedReportId)?.name;
        const pageName = this.pageById(this.selectedPageId)?.name;
        return `Co:Vantage™${
            workspaceName
                ? ` ${workspaceName}${reportName ? ` ${reportName} Report${pageName ? ` - ${pageName}` : ''}` : ''}`
                : ''
        }`;
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
