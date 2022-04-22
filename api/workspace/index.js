const fetch = require('node-fetch');
const config = require('./config.json');
const dotenv = require('dotenv').config();
const { load: parseYaml } = require('js-yaml');
const { promisify } = require('util');
const { readFile: rf } = require('fs');
const readFile = promisify(rf);
const TZOFFSETS = require('./mstz.js');

const referrerHeaderName = 'referer'; // [sic] see https://en.wikipedia.org/wiki/HTTP_referer#Etymology
const cookieHeaderName = 'cookie';
const clientPrincipalHeaderName = 'x-ms-client-principal';
const vary = [referrerHeaderName, clientPrincipalHeaderName, cookieHeaderName];
const urlEncodedContentType = 'application/x-www-form-urlencoded';
const jsonContentType = 'application/json';
const requestExpiresBeforeTokenExpiresMs = 10 * 60 * 1000; // expire request 10 minutes before token expires
const scope = encodeURIComponent(config.scope);
const clientId = process.env.WEBAPP_CLIENT_ID;
const clientSecret = process.env.WEBAPP_CLIENT_SECRET;
const getTokenUrl = `${config.apiUrl}GenerateToken`;
const oAuthUrl = `${config.authorityUrl}${config.tenantId}/oauth2/token?api-version=1.0`;
const oAuthBody = `grant_type=client_credentials&client_id=${clientId}&resource=${scope}&client_secret=${clientSecret}`;
const oAuthRequest = { method: 'POST', headers: { 'content-type': urlEncodedContentType }, body: oAuthBody };
let oAuthToken = {};

const checkResponse = response => {
    if (!response.ok) {
        const message = `Error requesting url ${response.url}: ${response.status} ${response.statusText}`;
        throw new Error(message);
    }
    return response;
};

const fetchOAuthToken = _ => fetch(oAuthUrl, oAuthRequest).then(response => checkResponse(response).json());

setInterval(async _ => (oAuthToken = await fetchOAuthToken()), 10 * 60 * 1000);

const timezoneNameFormatter = Intl.DateTimeFormat('en-US', { timeZone: 'US/Pacific', timeZoneName: 'long' });
const weekdayFormatter = Intl.DateTimeFormat('en-US', { timeZone: 'US/Pacific', weekday: 'long' });

const utcDate = (timezoneId, date, hours, minutes) => {
    const daylightOffset = timezoneNameFormatter.format(date).includes('Daylight') ? 1 : 0;
    const adjustedHours = hours - TZOFFSETS[timezoneId] - daylightOffset;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(Date.UTC(year, month, day, adjustedHours, minutes));
};

const getPendingUpdates = ({ days, times, localTimeZoneId, enabled }) => {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (enabled) {
        const dates = Array.from({ length: 7 }, (_, dayOffset) => {
            const dayOffsetMs = dayOffset * oneDayMs;
            return times.map(time => {
                const [hours, minutes] = time.split(':');
                return utcDate(localTimeZoneId, new Date(now.getTime() + dayOffsetMs), hours, minutes);
            });
        }).flat();
        return dates.filter(date => date > now && days.includes(weekdayFormatter.format(date))).slice(0, 4);
    }
};

const getWorkspace = async (context, workspaceSlug) => {
    const envWorkspaceYaml = process.env[`WORKSPACE_${workspaceSlug.toUpperCase()}`];
    const workspaceYaml = `workspace/workspaces/${workspaceSlug}.yaml`;
    try {
        if (envWorkspaceYaml) {
            return parseYaml(envWorkspaceYaml);
        }

        return await readFile(workspaceYaml, 'utf-8').then(parseYaml);
    } catch (error) {
        console.error(`Error loading ${workspaceYaml}: ${error}`);
        context.res = { status: 404, headers: { vary } };
    }
};

module.exports = async (context, req) => {
    // get OAuthToken if needed
    const oAuthTokenPromise =
        oAuthToken.expires_on * 1000 - Date.now() > oAuthToken.expires_in * 1000 * (5 / 6)
            ? Promise.resolve(oAuthToken)
            : fetchOAuthToken();

    // extract workspace name from referrer header
    const referrerHeader = req.headers[referrerHeaderName];
    const [, workspaceSlug, _reportSlug] = new URL(referrerHeader).pathname.split('/');
    if (!workspaceSlug) {
        context.res = { status: 404, headers: { vary } };
        return;
    }

    const workspace = await getWorkspace(context, workspaceSlug);

    if (context.res.status === 404) {
        return;
    }

    // extract user info from client principal header
    const clientPrincipalHeader = req.headers[clientPrincipalHeaderName];
    if (!clientPrincipalHeader) {
        context.res = {
            status: 401,
            headers: { vary, 'x-identity-provider': workspace.identity_provider },
        };
        return;
    }

    const userInfo = JSON.parse(Buffer.from(clientPrincipalHeader, 'base64').toString('ascii'));
    const reportRoles = workspace.reports;
    const users = workspace.users[userInfo.identityProvider] || {};
    const userRoles = users[userInfo.userDetails ? userInfo.userDetails.toLowerCase() : ''] || [];

    const userReportNames = Object.entries(reportRoles)
        .filter(([, roles]) => roles.some(role => userRoles.includes(role)))
        .map(([name]) => name);

    if (userReportNames.length === 0) {
        context.res = { status: 403, headers: { vary } };
        return;
    }

    oAuthToken = await oAuthTokenPromise;

    const pbiRestHeaders = {
        headers: {
            authorization: `Bearer ${oAuthToken.access_token}`,
            'content-type': jsonContentType,
        },
    };

    const getReportsUrl = `${config.apiUrl}groups/${workspace.id}/reports`;
    const getReportsPromise = fetch(getReportsUrl, pbiRestHeaders);
    const getReportsJson = await getReportsPromise.then(response => checkResponse(response).json());

    const reports = Object.fromEntries(
        userReportNames.map(name => {
            const report = getReportsJson.value.find(report => `${name} Report` === report.name);
            const { id, datasetId: dataset, embedUrl } = report;
            return [name, { id, dataset, embedUrl }];
        })
    );

    const getReportPagesPromises = Object.entries(reports).map(([reportName, { id }]) =>
        fetch(`${getReportsUrl}/${id}/pages`, pbiRestHeaders)
            .then(response => checkResponse(response).json())
            .then(json => [reportName, json])
    );

    const uniqueDatasetIds = [...new Set(Object.values(reports).map(({ dataset }) => dataset))];
    const getTokenBody = {
        datasets: uniqueDatasetIds.map(id => ({ id })),
        reports: Object.values(reports).map(({ id }) => ({ id })),
    };

    const getTokenPromise = fetch(getTokenUrl, {
        ...pbiRestHeaders,
        method: 'POST',
        body: JSON.stringify(getTokenBody),
    });

    `${config.apiUrl}groups/${workspace.id}/reports`;

    const getDatasetRefreshHistoryUrl = `${config.apiUrl}groups/${workspace.id}/datasets/${uniqueDatasetIds[0]}/refreshes?$top=4`;
    const getDatasetRefreshScheduleUrl = `${config.apiUrl}groups/${workspace.id}/datasets/${uniqueDatasetIds[0]}/refreshSchedule`;

    const getDatasetRefreshHistoryPromise = fetch(getDatasetRefreshHistoryUrl, pbiRestHeaders);
    const getDatasetRefreshSchedulePromise = fetch(getDatasetRefreshScheduleUrl, pbiRestHeaders);

    const getTokenJson = await getTokenPromise.then(response => checkResponse(response).json());

    const tokenExpiresMs = new Date(getTokenJson.expiration).getTime() - Date.now();
    const requestMaxAgeSeconds = Math.max(0, ~~((tokenExpiresMs - requestExpiresBeforeTokenExpiresMs) / 1000));

    for await (const [name, { value: pages }] of getReportPagesPromises) {
        reports[name].pages = pages
            .sort(({ order: a }, { order: b }) => a - b)
            .map(({ Name: id, displayName: name }) => ({ name, id }));
    }

    const getDatasetRefreshHistoryJson = await getDatasetRefreshHistoryPromise.then(response =>
        checkResponse(response).json()
    );

    const getDatasetRefreshScheduleJson = await getDatasetRefreshSchedulePromise.then(response =>
        checkResponse(response).json()
    );

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
            logo: workspace.logo,
            tokenId: getTokenJson.tokenId,
            token: getTokenJson.token,
            tokenExpires: getTokenJson.expiration,
            reports,
            updates: getDatasetRefreshHistoryJson.value
                .sort((a, b) => a.endTime.localeCompare(b.endTime))
                .map(update => ({
                    how: update.refreshType,
                    when: update.endTime,
                    status: update.status,
                })),
            pendingUpdates: getPendingUpdates(getDatasetRefreshScheduleJson),
        },
    };
};
