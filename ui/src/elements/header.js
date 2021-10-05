import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { selectors } from '../state/selectors';
import store from '../state/store';
import logo from '../assets/sa-covantage-logo.png';

const fixAssetUrl = url => `${`/${url}`.replace('//', '/')}`;

class Header extends connect(store)(LitElement) {
    static get styles() {
        return css`
            :host {
                --brand-clr: #228dc1;
            }
            header {
                box-sizing: border-box;
                display: grid;
                grid-auto-flow: column;
                grid-auto-columns: 300px auto min-content;
                gap: 10px;
                position: relative;
                height: 100%;
                padding: 10px 16px;
                border-bottom: 2px solid #ddd;
            }
            .logo {
                position: relative;
                height: 60px;
            }
            h1,
            h2 {
                text-align: center;
                font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin: auto;
            }
            h1 {
                font-size: 28px;
            }
            h2 {
                font-size: 22px;
                margin-top: 2px;
            }
            .userinfo {
                vertical-align: bottom;
                font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;
                font-size: 18px;
                margin: auto;
                padding-inline: 14px;
            }
        `;
    }

    static get properties() {
        return {
            selectedReportId: { type: String },
            selectedPageId: { type: String },
            user: { type: Object },
            workspace: { type: Object },
            pageById: { type: Object },
            reportById: { type: Object },
        };
    }

    stateChanged(state) {
        this.selectedReportId = selectors.selectedReportId(state);
        this.selectedPageId = selectors.selectedPageId(state);
        this.workspace = selectors.workspace(state);
        this.user = selectors.user(state);
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
        const workspaceName = this.workspace?.name;
        const reportName = this.reportById(this.selectedReportId)?.name;
        const pageName = this.pageById(this.selectedPageId)?.name;
        return html`
            <header>
                <img class="logo" src="${fixAssetUrl(logo)}" />
                <div class="title">
                    <h1>${reportName ? `${workspaceName} - ${reportName} Report` : ''}</h1>
                    <h2>${pageName}</h2>
                </div>
                <div class="userinfo">${this.user.email}</div>
            </header>
        `;
    }
}

customElements.define('sa-header', Header);
