const fetch = require('node-fetch');
const config = require('./config.json');
const workspaces = require('./workspaces.js');

const referrerHeaderName = 'referer'; // [sic] see https://en.wikipedia.org/wiki/HTTP_referer#Etymology
const cookieHeaderName = 'cookie';
const clientPrincipalHeaderName = 'x-ms-client-principal';
const vary = [referrerHeaderName, clientPrincipalHeaderName, cookieHeaderName];
const requestExpiresBeforeTokenExpiresMs = 10 * 60 * 1000; // expire request 10 minutes before token expires
const oAuthUrl = new URL(`/${config.tenantId}/oauth2/token?api-version=1.0`, new URL(config.authorityUri));
const clientId = encodeURIComponent(config.clientId);
const scope = encodeURIComponent(config.scope);
const clientSecret = encodeURIComponent(config.clientSecret);
const oAuthBody = `grant_type=client_credentials&client_id=${clientId}&resource=${scope}&client_secret=${clientSecret}`;
const getTokenUrl = `${config.apiUrl}v1.0/myorg/GenerateToken`;

const checkResponse = async response => {
    if (!response.ok) {
        const message = `Error requesting url ${response.url}: ${response.status} ${response.statusText}`;
        throw new Error(message);
    }
    return response;
};

module.exports = async (context, req) => {
    const oAuthPromise = fetch(oAuthUrl, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json, text/plain, */*',
        },
        body: oAuthBody,
    });

    // extract workspace name from referrer header
    const referrerHeader = req.headers[referrerHeaderName];
    const [, workspaceSlug] = new URL(referrerHeader).pathname.split('/');
    if (!workspaceSlug) {
        context.res = { status: 404, headers: { vary } };
        return;
    }

    // extract user info from client principal header
    const clientPrincipalHeader = req.headers[clientPrincipalHeaderName];
    if (!clientPrincipalHeader) {
        context.res = { status: 401, headers: { vary } };
        return;
    }

    const workspace = workspaces[workspaceSlug];
    if (!workspace) {
        context.res = { status: 404, headers: { vary } };
        return;
    }

    const userInfo = JSON.parse(Buffer.from(clientPrincipalHeader, 'base64').toString('ascii'));
    const users = workspace.users[userInfo.identityProvider] || {};
    const user = (users[userInfo.userDetails] || []).filter(reportName =>
        Object.keys(workspace.reports).includes(reportName)
    );

    if (!user || user.length === 0) {
        context.res = { status: 403, headers: { vary } };
        return;
    }

    const reportsObj = Object.fromEntries(user.map(reportName => [reportName, workspace.reports[reportName].id]));
    const uniqueDatasetIds = [...new Set(user.map(reportName => workspace.reports[reportName].dataset))];
    const getTokenBody = {
        datasets: uniqueDatasetIds.map(datasetId => ({ id: datasetId })),
        reports: Object.values(reportsObj).map(reportId => ({ id: reportId })),
    };

    const oAuthJson = await oAuthPromise.then(checkResponse).then(res => res.json());

    const getTokenPromise = fetch(getTokenUrl, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${oAuthJson.access_token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify(getTokenBody),
    });

    const getTokenJson = await getTokenPromise.then(checkResponse).then(res => res.json());
    const tokenExpiresMs = new Date(getTokenJson.expiration).getTime() - Date.now();
    const requestMaxAgeSeconds = Math.max(0, ~~((tokenExpiresMs - requestExpiresBeforeTokenExpiresMs) / 1000));

    context.res = {
        status: getTokenJson.status,
        headers: {
            'content-type': 'application/json',
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
