import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { connect } from 'pwa-helpers/connect-mixin';
import store from '../state/store';
import { selectPage, loadReport } from '../state/slice';
import { selectors } from '../state/selectors';
import navStyles from './navStyles';

class Nav extends connect(store)(LitElement) {
    static get styles() {
        return navStyles;
    }
    static get properties() {
        return {
            loadingReport: { type: Object },
            pageById: { type: Object },
            pages: { type: Array },
            pageSlug: { type: Object },
            reportById: { type: Object },
            reports: { type: Array },
            reportSlug: { type: Object },
            selectedPage: { type: Object },
            selectedReport: { type: Object },
        };
    }

    stateChanged(state) {
        this.loadingReport = selectors.loadingReport(state);
        this.pageById = selectors.pageById(state);
        this.pages = selectors.pages(state);
        this.pageSlug = selectors.pageSlug(state);
        this.reportById = selectors.reportById(state);
        this.reports = selectors.reports(state);
        this.reportSlug = selectors.reportSlug(state);
        this.selectedPage = selectors.selectedPage(state);
        this.selectedReport = selectors.selectedReport(state);
    }

    // interactions
    reportSelector(reportId) {
        return e => {
            if (reportId !== this.selectedReport.id) {
                const report = this.reportById(reportId);
                const reportSlug = this.reportSlug(report);
                const [, workspaceSlug] = location.pathname.split('/');
                history.pushState({}, null, `${location.origin}/${workspaceSlug}/${reportSlug}`);
                store.dispatch(loadReport({ report }));
            }
        };
    }

    pageSelector(pageId) {
        return e => {
            if (pageId !== this.selectedPage?.id) {
                const page = this.pageById(pageId);
                const pageSlug = this.pageSlug(page);
                const [, workspaceSlug, reportSlug] = location.pathname.split('/');
                history.pushState(
                    { report: this.selectedReport.id, page: pageId },
                    null,
                    `${location.origin}/${workspaceSlug}/${reportSlug}/${pageSlug}`
                );
                store.dispatch(selectPage({ page }));
            }
        };
    }

    // render
    renderReports() {
        return this.reports.map(report => {
            const isSelectedReport = report === this.selectedReport;
            const isLoading = report === this.loadingReport && report !== this.selectedReport;
            const reportClasses = { report: true, selected: isSelectedReport, loading: isLoading };
            return html`
                <div class="${classMap(reportClasses)}" @click=${this.reportSelector(report.id)}>
                    ${report.name} Report
                </div>
                ${isSelectedReport && !isLoading ? this.renderPages() : ''}
            `;
        });
    }

    renderPages() {
        return this.pages.map(page => {
            const isSelectedPage = page === this.selectedPage;
            const pageClasses = { page: true, selected: isSelectedPage };
            return html`
                <div class="${classMap(pageClasses)}" @click=${this.pageSelector(page.id)}>${page.name}</div>
            `;
        });
    }

    render() {
        return html`<nav>${this.renderReports()}</nav> `;
    }
}

customElements.define('sa-nav', Nav);
