import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { connect } from 'pwa-helpers/connect-mixin';
import store from '../state/store';
import { selectPage, loadReport } from '../state/navSlice';
import { navSelectors } from '../state/navSelectors';
import navStyles from './navStyles';
import slug from '../slug';

class Nav extends connect(store)(LitElement) {
    static get styles() {
        return navStyles;
    }
    static get properties() {
        return {
            reports: { type: Array },
            pages: { type: Array },
            currentReport: { type: String },
            currentPage: { type: String },
            loadReport: { type: String },
            currentReportSlug: { type: String },
            currentPageSlug: { type: String },
            slugForPageName: { type: Object },
        };
    }

    stateChanged(state) {
        this.reports = navSelectors.reports(state);
        this.pages = navSelectors.pages(state);
        this.currentPage = navSelectors.currentPage(state);
        this.currentReport = navSelectors.currentReport(state);
        this.loadReport = navSelectors.loadReport(state);
        this.currentReportSlug = navSelectors.currentReportSlug(state);
        this.currentPageSlug = navSelectors.currentPageSlug(state);
        this.slugForPageName = navSelectors.slugForPageName(state);
    }

    // interactions
    reportSelector(report) {
        return e => {
            if (report !== this.currentReport) {
                const [, workspace] = location.pathname.split('/');
                history.pushState({}, null, `${location.origin}/${workspace}/${slug(report)}`);
                store.dispatch(loadReport({ report }));
            }
        };
    }

    pageSelector(page) {
        return e => {
            if (page !== this.currentPage) {
                const [, workspace, report] = location.pathname.split('/');
                history.pushState(
                    { report, page },
                    null,
                    `${location.origin}/${workspace}/${this.currentReportSlug}/${this.slugForPageName(page)}`
                );
                store.dispatch(selectPage({ page }));
            }
        };
    }

    // render
    renderReports() {
        return this.reports.map(report => {
            const isCurrentReport = report === this.currentReport;
            const isLoading = report === this.loadReport && report !== this.currentReport;
            const reportClasses = { report: true, current: isCurrentReport, loading: isLoading };
            return html`
                <div class="${classMap(reportClasses)}" @click=${this.reportSelector(report)}>${report} Report</div>
                ${isCurrentReport ? this.renderPages() : ''}
            `;
        });
    }

    renderPages() {
        if (this.loadingReport) {
            return;
        }
        return this.pages.map(page => {
            const isCurrentPage = page.name === this.currentPage;
            const pageClasses = { page: true, current: isCurrentPage };
            return html`
                <div class="${classMap(pageClasses)}" @click=${this.pageSelector(page.name)}>${page.displayName}</div>
            `;
        });
    }

    render() {
        return html`<nav>${this.renderReports()}</nav> `;
    }
}

customElements.define('sa-nav', Nav);
