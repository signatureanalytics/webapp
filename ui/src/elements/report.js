import { html } from 'lit';
import { models } from 'powerbi-client';
import slug from '../slug';
import { selectors } from '../state/selectors';
import { loadPageId, selectPageId, selectReportId, setWorkspace, setWorkspaceToken } from '../state/slice';
import { ConnectedLitElement, store } from '../state/store';
import reportStyles from './reportStyles';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: 'c19e2a02-9538-4212-b75d-eeaac38b0a28',
    },
});
appInsights.loadAppInsights();

// Token refreshes between 1 and 9 minutes before it expires, randomized to prevent synchronization between clients.
const refreshTokenMs = expires => new Date(expires) - Date.now() - ~~((Math.random() * 8 + 1) * 60 * 1000);

class Report extends ConnectedLitElement {
    static styles = reportStyles;
    static properties = {
        loadingReportId: String,
        loadingPageId: String,
        reportById: Object,
        reportBySlug: Object,
        pageBySlugs: Object,
        reportEmbedUrl: String,
        reports: Array,
        selectedPageId: String,
        workspace: Object,
        user: Object,
        favoritePages: Array,
        showFavoritePages: Boolean,
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
            this.report.setPage(this.selectedPageId).catch(error => {
                console.error(`Error setting page ${this.selectedPageId}: ${error ?? 'unspecified error'}`);
            });
        } else if (changedProps.has('loadingReportId') && this.report) {
            const report = this.reportById(this.loadingReportId);
            const [, workspaceSlug] = location.pathname.split('/');
            const page = changedProps.has('loadingPageId')
                ? report.pages.find(page => page.id === this.loadingPageId)
                : this.showFavoritePages
                ? report.pages.find(page =>
                      this.favoritePages.includes(`${workspaceSlug}/${slug(report.name)}/${slug(page.name)}`)
                  )
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
                            const identityProvider = response.headers.get('x-identity-provider');
                            location = `/.auth/login/${identityProvider}?post_login_redirect_uri=${location}`;
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
                const [, workspaceSlug, reportSlug, pageSlug] = location.pathname.split('/');
                const report = this.reportBySlug(reportSlug) ?? this.reports[0];
                const page = this.pageBySlugs(reportSlug, pageSlug);
                await this.setReport(
                    report,
                    page ??
                        (this.showFavoritePages
                            ? report.pages.find(page =>
                                  this.favoritePages.includes(
                                      `${workspaceSlug}/${slug(report.name)}/${slug(page.name)}`
                                  )
                              )
                            : report.pages[0])
                );
            }
            setTimeout(_ => this.loadWorkspace(), refreshTokenMs(workspace.tokenExpires));
        } catch (error) {
            console.error(error);
        }
    }

    async setReport(report, page = report.pages[0]) {
        const metricsPageName = `${report.name} Report - ${page.name}`;
        appInsights.setAuthenticatedUserContext(this.user.email);
        appInsights.startTrackPage(metricsPageName);
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
                appInsights.stopTrackPage(metricsPageName, location.href, {
                    workspace: this.workspace?.name,
                    report: report.name,
                    page: page.name,
                });
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
