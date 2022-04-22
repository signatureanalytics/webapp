import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import caret from '../assets/caret.svg';
import slug from '../slug';
import { selectors } from '../state/selectors';
import { collapseReport, expandReport, loadPageId, loadReportId, setShowFavoritePages } from '../state/slice';
import { ConnectedLitElement, store } from '../state/store';
import navStyles from './navStyles';
import { repeat } from 'lit/directives/repeat.js';

const fixAssetUrl = url => `${`/${url}`.replace('//', '/')}`;

class Nav extends ConnectedLitElement {
    static styles = navStyles;
    static properties = {
        loadingReportId: String,
        reportById: Object,
        reports: Array,
        selectedPageId: String,
        selectedReportId: String,
        showFavoritePages: Boolean,
        favoritePages: Array,
    };

    stateChanged(state) {
        for (const name in this.constructor.properties) {
            this[name] = selectors[name](state);
        }
    }

    // interactions
    #reportSelector(reportId) {
        return e => {
            if (reportId !== this.selectedReportId) {
                const report = this.reportById(reportId);
                const reportSlug = slug(report.name);
                const [, workspaceSlug] = location.pathname.split('/');
                history.pushState({ report: reportId }, null, `${location.origin}/${workspaceSlug}/${reportSlug}`);
                store.dispatch(loadReportId({ reportId }));
            }
            e.preventDefault();
            e.stopPropagation();
        };
    }

    #pageSelector(reportId, pageId) {
        return e => {
            if (reportId !== this.selectedReportId || pageId !== this.selectedPageId) {
                const report = this.reportById(reportId);
                const page = report.pages.find(page => page.id === pageId);
                const pageSlug = slug(page.name);
                const reportSlug = slug(report.name);
                const [, workspaceSlug] = location.pathname.split('/');
                history.pushState(
                    { report: reportId, page: pageId },
                    null,
                    `${location.origin}/${workspaceSlug}/${reportSlug}/${pageSlug}`
                );
                store.dispatch(loadPageId({ reportId, pageId }));
            }
            e.preventDefault();
            e.stopPropagation();
        };
    }

    #reportExpander(report) {
        return e => {
            const reportId = report.id;
            store.dispatch(report.expanded ? collapseReport({ reportId }) : expandReport({ reportId }));
            e.preventDefault();
            e.stopPropagation();
        };
    }

    // render
    #renderReport(report) {
        const [, workspaceSlug] = location.pathname.split('/');
        const isSelectedReport = report.id === this.selectedReportId;
        const isLoading = report.id === this.loadingReportId && !isSelectedReport;
        const reportClasses = {
            selected: isSelectedReport,
            loading: isLoading,
            expanded: report.expanded,
        };
        const reportSlug = slug(report.name);
        const url = `${location.origin}/${workspaceSlug}/${reportSlug}`;
        return html`
            <div class="report ${classMap(reportClasses)}" @click=${this.#reportSelector(report.id)}>
                <img class="expander" src=${fixAssetUrl(caret)} @click=${this.#reportExpander(report)} /><a
                    class="name"
                    href="${url}"
                    >${report.name} Report</a
                >${repeat(
                    report.pages,
                    ({ id }) => id,
                    page => this.#renderPage(report, page)
                )}
            </div>
        `;
    }

    #renderPageStar(workspaceSlug, report, page) {
        if (this.favoritePages.includes(`${workspaceSlug}/${slug(report.name)}/${slug(page.name)}`)) {
            return html`<sa-icon name="star" size="20" fill="#4688ba"></sa-icon>`;
        }
        return '';
    }

    #renderPage(report, page) {
        const [, workspaceSlug] = location.pathname.split('/');
        const reportSlug = slug(report.name);
        const tabindex = report.expanded ? 0 : -1;
        const isSelectedPage = report.id === this.selectedReportId && page.id === this.selectedPageId;
        const pageClasses = { selected: isSelectedPage };
        const pageSlug = slug(page.name);
        const url = `${location.origin}/${workspaceSlug}/${reportSlug}/${pageSlug}`;
        return html`
            <div class="page ${classMap(pageClasses)}" @click=${this.#pageSelector(report.id, page.id)}>
                <a tabindex=${tabindex} class="name" href="${url}">${page.name}</a>
                ${this.#renderPageStar(workspaceSlug, report, page)}
            </div>
        `;
    }

    filterReports() {
        const [, workspaceSlug] = location.pathname.split('/');
        if (this.showFavoritePages) {
            return this.reports
                .map(report => ({
                    ...report,
                    pages: report.pages.filter(page =>
                        this.favoritePages.includes(`${workspaceSlug}/${slug(report.name)}/${slug(page.name)}`)
                    ),
                }))
                .filter(report => report.pages.length > 0);
        }
        return this.reports;
    }

    render() {
        const filteredReports = this.filterReports();

        return html`<nav>
            ${repeat(
                filteredReports,
                ({ id }) => id,
                report => this.#renderReport(report)
            )}
        </nav>`;
    }
}

customElements.define('sa-nav', Nav);
