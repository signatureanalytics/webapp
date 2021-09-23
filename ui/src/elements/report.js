import * as pbi from 'powerbi-client';
import store from '../state/store';
import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { setPages, setReports, selectReport, selectPage, loadReport } from '../state/navSlice';
import { navSelectors } from '../state/navSelectors';
import slug from '../slug';

const models = pbi.models;

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
            reports: { type: Array },
            pages: { type: Array },
            currentReport: { type: String },
            currentPage: { type: String },
            report: { type: Object },
            loadReport: { type: String },
            currentReportSlug: { type: String },
            pageNameBySlug: { type: Object },
            reportBySlug: { type: Object },
            slugForPageIndex: { type: Object },
            slugForReportIndex: { type: Object },
        };
    }

    constructor() {
        super();
        window.addEventListener('popstate', e => {
            if (this.currentReportSlug === e.state.report) {
                if (this.currentPage !== e.state.page) {
                    store.dispatch(selectPage({ page: e.state.page }));
                }
            } else {
                store.dispatch(loadReport({ report: this.reportBySlug(e.state.report) }));
                this.initReport();
            }
        });
    }

    disconnectedCallback() {
        window.removeEventListener('popstate');
    }

    stateChanged(state) {
        const priorPage = this.currentPage;
        const priorLoadReport = this.loadReport;

        this.reports = navSelectors.reports(state);
        this.pages = navSelectors.pages(state);
        this.currentPage = navSelectors.currentPage(state);
        this.currentReport = navSelectors.currentReport(state);
        this.loadReport = navSelectors.loadReport(state);
        this.currentReportSlug = navSelectors.currentReportSlug(state);
        this.pageNameBySlug = navSelectors.pageNameBySlug(state);
        this.reportBySlug = navSelectors.reportBySlug(state);
        this.slugForPageIndex = navSelectors.slugForPageIndex(state);
        this.slugForReportIndex = navSelectors.slugForReportIndex(state);

        if (this.currentPage && this.currentPage !== priorPage && this.report) {
            this.report.setPage(this.currentPage);
        }
        if (this.loadReport !== priorLoadReport && this.report) {
            this.initReport();
        }
    }

    firstUpdated() {
        this.initReport();
    }

    async initReport() {
        const reportContainer = document.createElement('div');
        this.shadowRoot.getElementById('reportContainer').replaceWith(reportContainer);
        reportContainer.id = 'reportContainer';
        try {
            // AJAX request to get the report details from the API and pass it to the UI
            const response = await fetch('/api/getEmbedToken').then(async response => {
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
                            const json = await response.json();
                            // reportContainer.innerHTML = `<p class="error">${json.error}</p>`;
                            return json;
                    }
                } else {
                    return response.json();
                }
            });

            store.dispatch(setReports({ reports: response.reports }));
            const [, workspaceSlug, reportSlug, pageSlug] = location.pathname.split('/');

            if (response.report.accessToken) {
                // Create a config object with type of the object, Embed details and Token Type
                let reportLoadConfig = {
                    type: 'report',
                    tokenType: models.TokenType.Embed,
                    accessToken: response.report.accessToken,

                    // Use other embed report config based on the requirement. We have used the first one for demo purpose
                    embedUrl: response.report.embedUrl[0].embedUrl,

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

                // Use the token expiry to regenerate Embed token for seamless end user experience
                // Refer https://aka.ms/RefreshEmbedToken
                // tokenExpiry = embedData.expiry;
                // Initialize iframe for embedding report
                powerbi.bootstrap(reportContainer, { type: 'report' });
                const iframe = reportContainer.querySelector('iframe');
                const iframeLoad = _ => {
                    // Embed Power BI report when Access token and Embed URL are available
                    this.report = powerbi.embed(reportContainer, reportLoadConfig);

                    // Clear any other loaded handler events
                    this.report.off('loaded');

                    this.report.on('loaded', async _ => {
                        console.log('Report load successful');

                        const pages = await this.report.getPages();

                        store.dispatch(
                            selectReport({
                                report: response.report.name,
                            })
                        );
                        store.dispatch(
                            setPages({ pages: pages.map(({ name, displayName }) => ({ name, displayName })) })
                        );
                        if (!pageSlug) {
                            const page = pages[0].name;
                            const encodedPageName = this.slugForPageIndex(0);
                            const encodedReportName = slug(response.report.name);
                            history.replaceState(
                                { report: reportSlug, page },
                                null,
                                `${location.origin}/${workspaceSlug}/${encodedReportName}/${encodedPageName}`
                            );
                        } else {
                            const page = this.pageNameBySlug(pageSlug);
                            store.dispatch(selectPage({ page }));
                        }
                    });

                    // Clear any other rendered handler events
                    this.report.off('rendered');

                    // Triggers when a report is successfully embedded in UI
                    this.report.on('rendered', function () {
                        console.log('Report render successful');
                    });

                    // Clear any other error handler events
                    this.report.off('error');

                    // Handle embed errors
                    this.report.on('error', function (event) {
                        let errorMsg = event.detail;
                        console.error(errorMsg);
                        return;
                    });
                };

                iframe.addEventListener('load', iframeLoad, { once: true });
            } else {
                const reportLinks = response.reports.map(
                    reportName => `<li><a href="${location}/${reportName}">${reportName} Report</a></li>`
                );

                reportContainer.innerHTML = `
                    <h2>Signature Analytics reports</h2>
                    <ul class="reportList">${reportLinks.join('')}</ul>
                `;
            }
        } catch (error) {
            // // Show error container
            // let errorContainer = $(".error-container");
            // $(".embed-container").hide();
            // errorContainer.show();

            // Get the error message from err object
            // let errorMsg = JSON.parse(error.responseText).error;

            // // Split the message with \r\n delimiter to get the errors from the error message
            // let errorLines = errorMsg.split("\r\n");

            // // Create error header
            // let errHeader = document.createElement("p");
            // let strong = document.createElement("strong");
            // let node = document.createTextNode("Error Details:");

            // // Get the error container
            // let errContainer = errorContainer.get(0);

            // // Add the error header in the container
            // strong.appendChild(node);
            // errHeader.appendChild(strong);
            // errContainer.appendChild(errHeader);

            // // Create <p> as per the length of the array and append them to the container
            // errorLines.forEach((element) => {
            //     let errorContent = document.createElement("p");
            //     let node = document.createTextNode(element);
            //     errorContent.appendChild(node);
            //     errContainer.appendChild(errorContent);
            // });

            console.error(error);
        }
    }

    render() {
        return html`<div id="reportContainer"></div>`;
    }
}

customElements.define('sa-report', Report);
