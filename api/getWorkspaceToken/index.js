const fetch = require('node-fetch');
const config = require('./config.json');
const workspaces = require('./workspaces.js');

const referrerHeaderName = 'referer'; // [sic] see https://en.wikipedia.org/wiki/HTTP_referer#Etymology
const cookieHeaderName = 'cookie';
const clientPrincipalHeaderName = 'x-ms-client-principal';
const vary = [referrerHeaderName, clientPrincipalHeaderName, cookieHeaderName];
const urlEncodedContentType = 'application/x-www-form-urlencoded';
const jsonContentType = 'application/json';
const requestExpiresBeforeTokenExpiresMs = 10 * 60 * 1000; // expire request 10 minutes before token expires
const clientId = encodeURIComponent(config.clientId);
const scope = encodeURIComponent(config.scope);
const clientSecret = encodeURIComponent(config.clientSecret);
const getTokenUrl = `${config.apiUrl}v1.0/myorg/GenerateToken`;
const oAuthUrl = new URL(`/${config.tenantId}/oauth2/token?api-version=1.0`, new URL(config.authorityUri));
const oAuthBody = `grant_type=client_credentials&client_id=${clientId}&resource=${scope}&client_secret=${clientSecret}`;
const oAuthRequest = { method: 'POST', headers: { 'content-type': urlEncodedContentType }, body: oAuthBody };
let oAuthToken = {};

const checkResponse = async response => {
    if (!response.ok) {
        const message = `Error requesting url ${response.url}: ${response.status} ${response.statusText}`;
        throw new Error(message);
    }
    return response;
};

const fetchOAuthToken = _ =>
    fetch(oAuthUrl, oAuthRequest)
        .then(checkResponse)
        .then(response => response.json());

setInterval(async _ => (oAuthToken = await fetchOAuthToken()), 10 * 60 * 1000);

module.exports = async (context, req) => {
    // get OAuthToken if needed
    const oAuthTokenPromise =
        oAuthToken.expires_on * 1000 - Date.now() > oAuthToken.expires_in * 1000 * (5 / 6)
            ? Promise.resolve(oAuthToken)
            : fetchOAuthToken();

    // extract user info from client principal header
    const clientPrincipalHeader = req.headers[clientPrincipalHeaderName];
    if (!clientPrincipalHeader) {
        context.res = { status: 401, headers: { vary } };
        return;
    }

    // extract workspace name from referrer header
    const referrerHeader = req.headers[referrerHeaderName];
    const [, workspaceSlug, reportSlug] = new URL(referrerHeader).pathname.split('/');
    if (!workspaceSlug || !workspaces[workspaceSlug]) {
        context.res = { status: 404, headers: { vary } };
        return;
    }
    const workspace = workspaces[workspaceSlug];

    const userInfo = JSON.parse(Buffer.from(clientPrincipalHeader, 'base64').toString('ascii'));
    const users = workspace.users[userInfo.identityProvider] || {};
    const user = users[userInfo.userDetails];

    if (!user || user.length === 0) {
        context.res = { status: 403, headers: { vary } };
        return;
    }

    oAuthToken = await oAuthTokenPromise;

    const pbiRestHeaders = {
        authorization: `Bearer ${oAuthToken.access_token}`,
        'content-type': jsonContentType,
    };

    const getReportsUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspace.id}/reports`;
    const getReportsPromise = fetch(getReportsUrl, { headers: pbiRestHeaders });
    const getReportsJson = await getReportsPromise.then(checkResponse).then(response => response.json());

    const allReports = getReportsJson.value.map(report => {
        const { id, datasetId: dataset, embedUrl } = report;
        return [report.name.replace(/ Report$/, ''), { id, dataset, embedUrl }];
    });
    const allReportsObj = Object.fromEntries(allReports);
    const reportsObj = Object.fromEntries(
        user.map(reportName => {
            const { id, embedUrl } = allReportsObj[reportName];
            return [reportName, { id, embedUrl }];
        })
    );

    const getReportPagesPromises = allReports.map(([reportName, report]) => {
        const getPagesUrl = `https://api.powerbi.com/v1.0/myorg/groups/${workspace.id}/reports/${report.id}/pages`;
        return new Promise((resolve, reject) =>
            fetch(getPagesUrl, { headers: pbiRestHeaders })
                .then(checkResponse)
                .then(response => response.json())
                .then(json => resolve([reportName, json]))
                .catch(reject)
        );
    });

    const uniqueDatasetIds = [...new Set(user.map(reportName => allReportsObj[reportName].dataset))];
    const getTokenBody = {
        datasets: uniqueDatasetIds.map(datasetId => ({ id: datasetId })),
        reports: Object.values(reportsObj).map(({ id }) => ({ id })),
    };

    const getTokenPromise = fetch(getTokenUrl, {
        method: 'POST',
        headers: pbiRestHeaders,
        body: JSON.stringify(getTokenBody),
    });

    const getTokenJson = await getTokenPromise.then(checkResponse).then(response => response.json());

    const tokenExpiresMs = new Date(getTokenJson.expiration).getTime() - Date.now();
    const requestMaxAgeSeconds = Math.max(0, ~~((tokenExpiresMs - requestExpiresBeforeTokenExpiresMs) / 1000));

    for await (const [name, { value: pages }] of getReportPagesPromises) {
        reportsObj[name].pages = pages
            .sort(({ order: a }, { order: b }) => a - b)
            .map(({ Name: id, displayName: name }) => ({ name, id }));
    }

    context.res = {
        status: getTokenJson.status,
        headers: {
            'content-type': jsonContentType,
            'cache-control': `max-age=${requestMaxAgeSeconds}`,
            vary,
        },
        body: {
            name: workspace.name,
            id: workspace.id,
            tokenId: getTokenJson.tokenId,
            token: getTokenJson.token,
            tokenExpires: getTokenJson.expiration,
            reports: reportsObj,
            env: process.env,
        },
    };
};
