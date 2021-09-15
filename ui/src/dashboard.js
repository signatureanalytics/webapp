import { LitElement, html } from 'lit';
import { createStore } from 'redux';
import * as pbi from 'powerbi-client';
const models = pbi.models;
const reportContainer = document.getElementById('reportContainer');
console.log(createStore);
(async _ => {
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
                        reportContainer.innerHTML = `<p class="error">${json.error}</p>`;
                        return json;
                }
            } else {
                return response.json();
            }
        });

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
                    // panes: {
                    //     pageNavigation: {
                    //         visible: tr,
                    //     },
                    // },
                },
            };

            // Use the token expiry to regenerate Embed token for seamless end user experience
            // Refer https://aka.ms/RefreshEmbedToken
            // tokenExpiry = embedData.expiry;
            // Initialize iframe for embedding report
            powerbi.bootstrap(reportContainer, { type: 'report' });

            // Embed Power BI report when Access token and Embed URL are available
            let report = powerbi.embed(reportContainer, reportLoadConfig);

            // Clear any other loaded handler events
            report.off('loaded');

            report.on('loaded', async _ => {
                console.log('Report load successful');
                const pages = await report.getPages();
                await report.setPage(pages[0].name);
            });

            // Clear any other rendered handler events
            report.off('rendered');

            // Triggers when a report is successfully embedded in UI
            report.on('rendered', function () {
                console.log('Report render successful');
            });

            // Clear any other error handler events
            report.off('error');

            // Handle embed errors
            report.on('error', function (event) {
                let errorMsg = event.detail;
                console.error(errorMsg);
                return;
            });
        } else {
            const reportLinks = response.reports.map(
                reportName => `<li><a href="${location}/${reportName}">${reportName} report</a></li>`
            );
            document.getElementById('reportContainer').innerHTML = `
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
})();
