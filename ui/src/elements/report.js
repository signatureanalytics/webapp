import * as pbi from 'powerbi-client';
import store from '../state/store';
import { LitElement, html, css } from 'lit';
import { connect } from 'pwa-helpers/connect-mixin';
import { setPages, setReports, selectReport, selectPage, loadReport } from '../state/slice';
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
        };
    }

    constructor() {
        super();
        window.addEventListener('popstate', e => {
            if (slug(this.currentReport) === e.state.report) {
                if (this.currentPage !== e.state.page) {
                    store.dispatch(selectPage({ page: e.state.page }));
                }
            } else {
                store.dispatch(loadReport({ report: this.reports.find(r => slug(r) === e.state.report) }));
                this.initReport();
            }
        });
    }

    disconnectedCallback() {
        window.removeEventListener('popstate');
    }

    stateChanged(state) {
        if (state.nav.currentPage && state.nav.currentPage !== this.currentPage && this.report) {
            this.report.setPage(state.nav.currentPage);
        }
        if (state.nav.loadReport !== this.loadReport && this.report) {
            this.initReport();
        }
        this.reports = state.nav.reports;
        this.pages = state.nav.pages;
        this.currentPage = state.nav.currentPage;
        this.currentReport = state.nav.currentReport;
        this.loadReport = state.nav.loadReport;
    }

    firstUpdated() {
        this.initReport();
    }

    async initReport() {
        const reportContainer = document.createElement('div');
        reportContainer.id = 'reportContainer';
        this.shadowRoot.getElementById('reportContainer').replaceWith(reportContainer);

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
            const [, workspaceName, reportName, pageName] = location.pathname.split('/');

            if (response.accessToken) {
                // Create a config object with type of the object, Embed details and Token Type
                let reportLoadConfig = {
                    type: 'report',
                    tokenType: models.TokenType.Embed,
                    accessToken: response.accessToken,

                    // Use other embed report config based on the requirement. We have used the first one for demo purpose
                    embedUrl: response.embedUrl[0].embedUrl,

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

                // Embed Power BI report when Access token and Embed URL are available
                this.report = powerbi.load(reportContainer, reportLoadConfig);

                // Clear any other loaded handler events
                this.report.off('loaded');

                this.report.on('loaded', async _ => {
                    console.log('Report load successful');
                    const pages = await this.report.getPages();

                    store.dispatch(
                        selectReport({
                            report: reportName ? this.reports.find(r => slug(r) === reportName) : this.reports[0],
                        })
                    );
                    store.dispatch(setPages({ pages: pages.map(({ name, displayName }) => ({ name, displayName })) }));
                    if (!pageName) {
                        const page = pages[0].name;
                        const encodedPageName = slug(pages[0].displayName);
                        const encodedReportName = slug(reportName || this.reports[0]);
                        history.replaceState(
                            { report: reportName, page },
                            null,
                            `${location.origin}/${workspaceName}/${encodedReportName}/${encodedPageName}`
                        );
                    } else {
                        const page = this.pages.find(p => slug(p.displayName) === pageName).name;
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
