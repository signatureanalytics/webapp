import * as pbi from 'powerbi-client';
import store from '../state/store';
import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { setPages, setWorkspace, setWorkspaceToken, selectReport, selectPage, loadReport } from '../state/slice';
import { selectors } from '../state/selectors';

const models = pbi.models;
const refreshTokenBeforeExpiresMs = 5 * 60 * 1000;

class Report extends connect(store)(LitElement) {
    static get styles() {
        return css`
            *,
            :host,
            *::before,
            *::after {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            #reportContainer {
                height: 100%;
                width: 100%;
            }
            iframe {
                border: 0;
            }
        `;
    }

    static get properties() {
        return {
            loadingReport: { type: String },
            pageById: { type: Object },
            pageBySlug: { type: Object },
            pages: { type: Array },
            pageSlug: { type: Object },
            report: { type: Object },
            reportById: { type: Object },
            reportBySlug: { type: Object },
            reports: { type: Array },
            reportSlug: { type: Object },
            selectedPage: { type: String },
            selectedReport: { type: String },
            workspace: { type: Object },
        };
    }

    constructor() {
        super();
        window.addEventListener('popstate', e => {
            if (this.selectedReport.id !== e.state.report) {
                const report = this.reportById(e.state.report);
                store.dispatch(loadReport({ report }));
            } else if (this.selectedPage.id !== e.state.page) {
                store.dispatch(selectPage({ page: this.pageById(e.state.page) }));
            }
        });
    }

    stateChanged(state) {
        this.workspace = selectors.workspace(state);
        this.reports = selectors.reports(state);
        this.pages = selectors.pages(state);
        this.selectedPage = selectors.selectedPage(state);
        this.selectedReport = selectors.selectedReport(state);
        this.loadingReport = selectors.loadingReport(state);
        this.pageBySlug = selectors.pageBySlug(state);
        this.reportBySlug = selectors.reportBySlug(state);
        this.reportById = selectors.reportById(state);
        this.pageById = selectors.pageById(state);
        this.reportSlug = selectors.reportSlug(state);
        this.pageSlug = selectors.pageSlug(state);
    }

    firstUpdated() {
        this.loadWorkspace();
    }

    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('selectedPage') && this.report) {
            this.report.setPage(this.selectedPage.id);
        }
        if (changedProps.has('loadingReport') && this.report) {
            this.setReport(this.loadingReport);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('popstate');
    }

    async loadWorkspace() {
        try {
            const response = await fetch('/api/getWorkspaceToken').then(async response => {
                if (!response.ok) {
                    switch (response.status) {
                        case 401:
                            location = `/.auth/login/google?post_login_redirect_uri=${location}`;
                            break;
                        case 403:
                            location = new URL('..', location);
                            break;
                        case 400:
                        default:
                            return await response.json();
                    }
                } else {
                    return response.json();
                }
            });
            if (this.report) {
                const { token, tokenId, tokenExpires } = response;
                store.dispatch(setWorkspaceToken({ token, tokenId, tokenExpires }));
                this.report.setAccessToken(response.token);
            } else {
                store.dispatch(setWorkspace({ workspace: response }));
                const [, , reportSlug, pageSlug] = location.pathname.split('/');
                const report = this.reportBySlug(reportSlug) ?? this.reports[0];
                this.setReport(report, pageSlug);
            }
            const tokenExpiresMs = new Date(response.tokenExpires).getTime() - Date.now();
            setTimeout(_ => this.loadWorkspace(), tokenExpiresMs - refreshTokenBeforeExpiresMs);
        } catch (error) {
            console.error(error);
        }
    }

    async setReport(report, pageSlug) {
        const reportContainer = document.createElement('div');
        this.shadowRoot.getElementById('reportContainer').replaceWith(reportContainer);
        reportContainer.id = 'reportContainer';

        // Create a config object with type of the object, Embed details and Token Type
        let reportLoadConfig = {
            type: 'report',
            tokenType: models.TokenType.Embed,
            accessToken: this.workspace.token,

            // Use other embed report config based on the requirement. We have used the first one for demo purpose
            embedUrl: `https://app.powerbi.com/reportEmbed?groupId=${this.workspace.id}&reportId=${report.id}`,

            // Enable this setting to remove gray shoulders from embedded report
            settings: {
                // background: models.BackgroundType.Transparent,
                panes: {
                    pageNavigation: {
                        visible: false,
                    },
                },
            },
        };

        powerbi.bootstrap(reportContainer, { type: 'report' });
        const iframe = reportContainer.querySelector('iframe');
        const iframeLoad = _ => {
            // Embed Power BI report when Access token and Embed URL are available
            this.report = powerbi.load(reportContainer, reportLoadConfig);

            // Clear any other loaded handler events
            this.report.off('loaded');
            this.report.on('loaded', async _ => {
                console.log('Report load successful');

                const pages = await this.report.getPages();

                store.dispatch(selectReport({ report }));
                store.dispatch(
                    setPages({ pages: pages.map(({ name, displayName }) => ({ id: name, name: displayName })) })
                );
                if (pageSlug) {
                    const pageName = this.pageBySlug(pageSlug).name;
                    store.dispatch(selectPage({ page: this.pages.find(p => p.name === pageName) }));
                } else {
                    const [, workspaceSlug] = location.pathname.split('/');
                    const page = this.pages[0];
                    history.replaceState(
                        { report: report.id, page: page.id },
                        null,
                        `${location.origin}/${workspaceSlug}/${this.reportSlug(report)}/${this.pageSlug(page)}`
                    );
                }
                this.report.render();
            });

            this.report.off('rendered');
            this.report.on('rendered', _ => {
                console.log('Report render successful');
            });

            this.report.off('error');
            this.report.on('error', event => {
                let errorMsg = event.detail;
                console.error(errorMsg);
                return;
            });
        };

        iframe.addEventListener('load', iframeLoad, { once: true });
    }

    render() {
        return html`<div id="reportContainer"></div>`;
    }
}

customElements.define('sa-report', Report);
