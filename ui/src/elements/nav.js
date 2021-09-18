import store from '../state/store';
import { selectPage, loadReport } from '../state/slice';
import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { connect } from 'pwa-helpers/connect-mixin';
import slug from '../slug';

class Nav extends connect(store)(LitElement) {
    static get styles() {
        return css`
            div {
                cursor: pointer;
                font-family: 'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif;
                margin-top: 5px;
            }
            div:hover:not(.loading):not(.current) {
                text-decoration: underline;
            }
            .current {
                font-weight: 600;
            }
            .report {
                margin-left: 15px;
                font-size: 18px;
            }
            .report.loading {
                font-style: italic;
            }
            .report.loading::after {
                content: '...';
                animation: ellipsis 900ms linear infinite;
                width: 20px;
            }
            .page {
                margin-left: 30px;
                font-size: 16px;
            }
            .page + .report {
                margin-top: 10px;
            }
            @keyframes ellipsis {
                0% {
                    content: '...';
                }
                8% {
                    content: ' ..';
                }
                16% {
                    content: ' \\a0 .';
                }
                24% {
                    content: '';
                }
                32% {
                    content: ' \\a0 .';
                }
                40% {
                    content: ' ..';
                }
                48% {
                    content: '...';
                }
                54% {
                    content: '..';
                }
                62% {
                    content: '.';
                }
                70% {
                    content: '';
                }
                76% {
                    content: '';
                }
                84% {
                    content: '.';
                }
                92% {
                    content: '..';
                }
                100% {
                    content: '...';
                }
            }
        `;
    }
    static get properties() {
        return {
            reports: { type: Array },
            pages: { type: Array },
            currentReport: { type: String },
            currentPage: { type: String },
            loadReport: { type: String },
        };
    }

    stateChanged(state) {
        this.reports = state.nav.reports;
        this.pages = state.nav.pages;
        this.currentPage = state.nav.currentPage;
        this.currentReport = state.nav.currentReport;
        this.loadReport = state.nav.loadReport;
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
                const pageName = slug(this.pages.find(p => p.name === page).displayName);
                const reportName = slug(report);
                history.pushState({ report, page }, null, `${location.origin}/${workspace}/${reportName}/${pageName}`);
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
