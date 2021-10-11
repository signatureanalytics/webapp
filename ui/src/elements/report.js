import { models } from 'powerbi-client';
import store from '../state/store';
import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { setWorkspace, setWorkspaceToken, selectReportId, selectPageId, loadPageId } from '../state/slice';
import { selectors } from '../state/selectors';
import slug from '../slug';
import reportStyles from './reportStyles';

// Token refreshes between 1 and 9 minutes before it expires, randomized to prevent synchronization between clients.
const refreshTokenMs = expires => new Date(expires) - Date.now() - ~~((Math.random() * 8 + 1) * 60 * 1000);

class Report extends connect(store)(LitElement) {
    static styles = reportStyles;
    static properties = {
        loadingReportId: String,
        loadingPageId: String,
        pages: Array,
        reportById: Object,
        reportBySlug: Object,
        pageBySlugs: Object,
        reportEmbedUrl: String,
        reports: Array,
        selectedPageId: String,
        workspace: Object,
    };

    stateChanged(state) {
        for (const name in this.constructor.properties) {
            this[name] = selectors[name](state);
        }
    }

    firstUpdated() {
        super.firstUpdated();
        this.loadWorkspace();
    }

    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('selectedPageId') && this.report) {
            this.report.setPage(this.selectedPageId);
        } else if (changedProps.has('loadingReportId') && this.report) {
            const report = this.reportById(this.loadingReportId);
            const page = changedProps.has('loadingPageId')
                ? report.pages.find(page => page.id === this.loadingPageId)
                : report.pages[0];
            this.setReport(report, page);
        } else if (changedProps.has('loadingPageId')) {
            store.dispatch(selectPageId({ pageId: this.loadingPageId }));
        }
    }

    popstateHandler = e => {
        store.dispatch(loadPageId({ reportId: e.state.report, pageId: e.state.page }));
    };

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('popstate', this.popstateHandler);
    }

    disconnectedCallback() {
        window.removeEventListener('popstate', this.popstateHandler);
        super.disconnectedCallback();
    }

    async loadWorkspace() {
        try {
            const workspace = await fetch('/api/workspace').then(async response => {
                if (!response.ok) {
                    switch (response.status) {
                        case 401:
                            location = `/.auth/login/google?post_login_redirect_uri=${location}`;
                            break;
                        case 403:
                        case 404:
                            location = '/';
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
                const { token, tokenId, tokenExpires } = workspace;
                store.dispatch(setWorkspaceToken({ token, tokenId, tokenExpires }));
                await this.report.setAccessToken(workspace.token);
            } else {
                store.dispatch(setWorkspace({ workspace }));
                const [, , reportSlug, pageSlug] = location.pathname.split('/');
                const report = this.reportBySlug(reportSlug) ?? this.reports[0];
                const page = this.pageBySlugs(reportSlug, pageSlug);
                await this.setReport(report, page);
            }
            setTimeout(_ => this.loadWorkspace(), refreshTokenMs(workspace.tokenExpires));
        } catch (error) {
            console.error(error);
        }
    }

    async setReport(report, page = report.pages[0]) {
        const reportContainer = document.createElement('div');
        this.shadowRoot.getElementById('reportContainer').replaceWith(reportContainer);
        reportContainer.id = 'reportContainer';

        let reportLoadConfig = {
            type: 'report',
            tokenType: models.TokenType.Embed,
            accessToken: this.workspace.token,
            embedUrl: this.reportEmbedUrl(report.name),
            settings: {
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
            this.report = powerbi.load(reportContainer, reportLoadConfig);
            store.dispatch(selectReportId({ reportId: report.id }));

            this.report.off('loaded');
            this.report.on('loaded', async _ => {
                console.log('Report load successful');

                store.dispatch(selectPageId({ pageId: page.id }));
                const [, workspaceSlug] = location.pathname.split('/');
                history.replaceState(
                    { report: report.id, page: page.id },
                    null,
                    `${location.origin}/${workspaceSlug}/${slug(report.name)}/${slug(page.name)}`
                );
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
