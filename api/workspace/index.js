const fetch = require('node-fetch');
const config = require('./config.json');
const dotenv = require('dotenv');
const { load: parseYaml } = require('js-yaml');
const { promisify } = require('util');
const { readFile: rf } = require('fs');
const readFile = promisify(rf);
const TZOFFSETS = require('./mstz.js');
const { brotliDecompressSync } = require('zlib');

dotenv.config();

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

const timezoneNameFormatter = Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'long' });
const weekdayFormatter = Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long' });

const utcDate = (timezoneId, date, hours, minutes) => {
    const daylightOffset = timezoneNameFormatter.format(date).includes('Daylight') ? 1 : 0;
    const adjustedHours = hours - TZOFFSETS[timezoneId] - daylightOffset;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(Date.UTC(year, month, day, adjustedHours, minutes));
};

const oneDayMs = 24 * 60 * 60 * 1000;

const getPendingUpdates = ({ days, times, localTimeZoneId, enabled }) => {
    const now = new Date();
    return Array.from({ length: enabled ? 28 : 0 })
        .flatMap((_, dayOffset) =>
            times.map(time => utcDate(localTimeZoneId, new Date(now.getTime() + dayOffset * oneDayMs), ...time.split(':')))
        )
        .filter(date => date > now && days.includes(weekdayFormatter.format(date)))
        .slice(0, 4);
};

const getWorkspace = async (context, workspaceSlug) => {
    const envWorkspaceYaml = process.env[`WORKSPACE_${workspaceSlug.toUpperCase()}`];
    const envCompressedWorkspaceYaml = process.env[`WS_${workspaceSlug.toUpperCase()}`];
    const workspaceYaml = `workspace/workspaces/${workspaceSlug}.yaml`;
    try {
        if (envCompressedWorkspaceYaml) {
            return parseYaml(brotliDecompressSync(Buffer.from(envCompressedWorkspaceYaml, 'base64')));
        }
        if (envWorkspaceYaml) {
            return parseYaml(envWorkspaceYaml);
        }

        return await readFile(workspaceYaml, 'utf-8').then(parseYaml);
    } catch (error) {
        console.error(`Error loading ${workspaceYaml}: ${error}`);
        context.res = { status: 404, headers: { vary }, body: `Error loading ${workspaceYaml}: ${error}` };
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

    const reportRoles = {};
    const reportSlicers = {};
    const reportFilters = {};
    for (const [report, fields] of Object.entries(workspace.reports)) {
        reportRoles[report] = Array.isArray(fields) ? fields : fields.roles;
        reportSlicers[report] = fields.slicers;
        reportFilters[report] = fields.filters;
    }

    const usersRecords = workspace.users[userInfo.identityProvider] || {};
    const users = Object.fromEntries(
        Object.entries(usersRecords).map(([userId, roles]) => {
            // userId can be either "rwaldin@signatureanalytics.com" or "Ray Waldin <rwaldin@signatureanalytics.com>"
            const { email, name } = userId.match(/^(?:(?<name>[^<]+) <)?(?<email>[^@]+@[^>]+)/)?.groups;
            return [email, { name, roles }];
        })
    );

    const email = userInfo.userDetails?.toLowerCase();
    const user = { ...users[email], email };

    const userReportNames = Object.entries(reportRoles)
        .filter(([, roles]) => roles.some(role => user.roles?.includes(role)))
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
            const slicers = reportSlicers[name];
            const filters = reportFilters[name];
            return [name, { id, dataset, embedUrl, slicers, filters }];
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

    const refreshHistoryByDataset = {};
    const refreshScheduleByDataset = {};
    const getDatasetRefreshBaseUrl = `${config.apiUrl}groups/${workspace.id}/datasets`;

    const getDatasetRefreshPromise = Promise.all(
        uniqueDatasetIds.flatMap(datasetId => [
            fetch(`${getDatasetRefreshBaseUrl}/${datasetId}/refreshes?$top=4`, pbiRestHeaders)
                .then(response => checkResponse(response).json())
                .then(json => (refreshHistoryByDataset[datasetId] = json)),
            fetch(`${getDatasetRefreshBaseUrl}/${datasetId}/refreshSchedule`, pbiRestHeaders)
                .then(response => checkResponse(response).json())
                .then(json => (refreshScheduleByDataset[datasetId] = json)),
        ])
    );

    const getTokenJson = await getTokenPromise.then(response => checkResponse(response).json());

    const tokenExpiresMs = new Date(getTokenJson.expiration).getTime() - Date.now();
    const requestMaxAgeSeconds = Math.max(0, ~~((tokenExpiresMs - requestExpiresBeforeTokenExpiresMs) / 1000));

    for await (const [name, { value: pages }] of getReportPagesPromises) {
        reports[name].pages = pages
            .sort(({ order: a }, { order: b }) => a - b)
            .map(page => ({ name: page.displayName, id: page.Name || page.name }));
    }

    await getDatasetRefreshPromise;

    const updates = Object.fromEntries(
        Object.entries(refreshHistoryByDataset).map(([id, { value }]) => [
            id,
            value
                .sort((a, b) => a.endTime.localeCompare(b.endTime))
                .map(update => ({
                    how: update.refreshType,
                    when: update.endTime,
                    status: update.status,
                    serviceExceptionJson: update.serviceExceptionJson,
                })),
        ])
    );

    const pendingUpdates = Object.fromEntries(Object.entries(refreshScheduleByDataset).map(([id, json]) => [id, getPendingUpdates(json)]));

    // render value templates for filters and slicers
    const filterSlicerValues = {
        'user.name': user.name,
        'user.email': user.email,
    };

    for (const filterOrSlicer of [...Object.values(reportSlicers), ...Object.values(reportFilters)]) {
        for (const [, table] of Object.entries(filterOrSlicer ?? {})) {
            for (const [column, valueTemplate] of Object.entries(table ?? {})) {
                table[column] = filterSlicerValues[valueTemplate];
            }
        }
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
            logo: workspace.logo,
            tokenId: getTokenJson.tokenId,
            token: getTokenJson.token,
            tokenExpires: getTokenJson.expiration,
            reports,
            updates,
            pendingUpdates,
        },
    };
};
