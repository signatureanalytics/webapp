// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------
const adal = require('adal-node');
const config = require('./config.json');

const getAccessToken = async function () {
    // Use ADAL.js for authentication
    let AuthenticationContext = adal.AuthenticationContext;
    let authorityUrl = config.authorityUri;

    // Check for the MasterUser Authentication
    if (config.authenticationMode.toLowerCase() === 'masteruser') {
        let context = new AuthenticationContext(authorityUrl);

        return new Promise((resolve, reject) => {
            context.acquireTokenWithUsernamePassword(
                config.scope,
                config.pbiUsername,
                config.pbiPassword,
                config.clientId,
                function (err, tokenResponse) {
                    // Function returns error object in tokenResponse
                    // Invalid Username will return empty tokenResponse, thus err is used
                    if (err) {
                        reject(tokenResponse == null ? err : tokenResponse);
                    }
                    resolve(tokenResponse);
                }
            );
        });

        // Service Principal auth is the recommended by Microsoft to achieve App Owns Data Power BI embedding
    } else if (config.authenticationMode.toLowerCase() === 'serviceprincipal') {
        authorityUrl = authorityUrl.replace('common', config.tenantId);
        let context = new AuthenticationContext(authorityUrl);

        return new Promise((resolve, reject) => {
            context.acquireTokenWithClientCredentials(
                config.scope,
                config.clientId,
                config.clientSecret,
                function (err, tokenResponse) {
                    // Function returns error object in tokenResponse
                    // Invalid Username will return empty tokenResponse, thus err is used
                    if (err) {
                        reject(tokenResponse == null ? err : tokenResponse);
                    }
                    resolve(tokenResponse);
                }
            );
        });
    }
};

module.exports.getAccessToken = getAccessToken;