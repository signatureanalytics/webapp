import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { connect } from 'pwa-helpers/connect-mixin';
import store from '../state/store';
import { loadPageId, loadReportId, collapseReport, expandReport } from '../state/slice';
import { selectors } from '../state/selectors';
import navStyles from './navStyles';
import caret from '../assets/caret.svg';

class Nav extends connect(store)(LitElement) {
    static get styles() {
        return navStyles;
    }
    static get properties() {
        return {
            loadingReportId: { type: String },
            pageById: { type: Object },
            pages: { type: Array },
            pageSlug: { type: Object },
            reportById: { type: Object },
            reports: { type: Array },
            reportSlug: { type: Object },
            selectedPageId: { type: String },
            selectedReportId: { type: String },
        };
    }

    stateChanged(state) {
        this.loadingReportId = selectors.loadingReportId(state);
        this.pageById = selectors.pageById(state);
        this.pages = selectors.pages(state);
        this.pageSlug = selectors.pageSlug(state);
        this.reportById = selectors.reportById(state);
        this.reports = selectors.reports(state);
        this.reportSlug = selectors.reportSlug(state);
        this.selectedPageId = selectors.selectedPageId(state);
        this.selectedReportId = selectors.selectedReportId(state);
    }

    // interactions
    reportSelector(reportId) {
        return e => {
            if (reportId !== this.selectedReportId) {
                const report = this.reportById(reportId);
                const reportSlug = this.reportSlug(report);
                const [, workspaceSlug] = location.pathname.split('/');
                history.pushState({}, null, `${location.origin}/${workspaceSlug}/${reportSlug}`);
                store.dispatch(loadReportId({ reportId }));
            }
            e.preventDefault();
            e.stopPropagation();
        };
    }

    pageSelector(reportId, pageId) {
        return e => {
            if (reportId !== this.selectedReportId || pageId !== this.selectedPageId) {
                const report = this.reportById(reportId);
                const page = report.pages.find(page => page.id === pageId);
                const pageSlug = this.pageSlug(page);
                const reportSlug = this.reportSlug(report);
                const [, workspaceSlug] = location.pathname.split('/');
                history.pushState(
                    { report: reportId, page: pageId },
                    null,
                    `${location.origin}/${workspaceSlug}/${reportSlug}/${pageSlug}`
                );
                if (this.selectedReportId !== reportId) {
                    store.dispatch(loadPageId({ pageId, reportId }));
                } else {
                    store.dispatch(loadPageId({ pageId }));
                }
            }
            e.preventDefault();
            e.stopPropagation();
        };
    }

    reportCollapser(reportId) {
        return e => {
            store.dispatch(collapseReport({ reportId }));
            e.preventDefault();
            e.stopPropagation();
        };
    }

    reportExpander(reportId) {
        return e => {
            store.dispatch(expandReport({ reportId }));
            e.preventDefault();
            e.stopPropagation();
        };
    }
    // render
    renderReports() {
        return this.reports.map(report => {
            const isSelectedReport = report.id === this.selectedReportId;
            const isLoading = report.id === this.loadingReportId && !isSelectedReport;
            const reportClasses = {
                report: true,
                selected: isSelectedReport,
                loading: isLoading,
                expanded: report.expanded,
            };
            return html`
                <div class="${classMap(reportClasses)}" @click=${this.reportSelector(report.id)}>
                    <img
                        class="expander"
                        src=${caret}
                        @click=${report.expanded ? this.reportCollapser(report.id) : this.reportExpander(report.id)}
                    /><span class="name">${report.name} Report</span>
                    ${this.renderPages(report)}
                </div>
            `;
        });
    }

    renderPages(report) {
        return report.pages.map(page => {
            const isSelectedPage = report.id === this.selectedReportId && page.id === this.selectedPageId;
            const pageClasses = { page: true, selected: isSelectedPage };
            return html`
                <div class="${classMap(pageClasses)}" @click=${this.pageSelector(report.id, page.id)}>
                    <span class="name">${page.name}</span>
                </div>
            `;
        });
    }

    render() {
        return html`<nav>${this.renderReports()}</nav> `;
    }
}

customElements.define('sa-nav', Nav);
