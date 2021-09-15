const embedToken = require('./embedConfigService.js');
const utils = require('./utils.js');
const workspaces = require('./workspaces.js');

const referrerRegex = `^.*//[^/?]+/(?<workspaceName>[^/?]+)(?:/(?<reportName>[^/?]+))?`;
const referrerHeaderName = 'referer'; // [sic] see https://en.wikipedia.org/wiki/HTTP_referer#Etymology
const clientPrincipalHeaderName = 'x-ms-client-principal';
const varyHeaders = { vary: [referrerHeaderName, clientPrincipalHeaderName] };

const decodeBase64 = base64 => Buffer.from(base64, 'base64').toString('ascii');
const addVaryHeaders = response => ({ ...response, headers: { ...response.headers, ...varyHeaders } });

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // extract workspace name and optional report name from referrer header
    const referrerHeader = req.headers[referrerHeaderName];
    const referrerMatch = referrerHeader.match(referrerRegex);
    if (!referrerMatch) {
        context.res = addVaryHeaders({ status: 404 });
        return;
    }
    const { workspaceName, reportName } = referrerMatch.groups;

    // extract user info from client principal header
    const clientPrincipalHeader = req.headers[clientPrincipalHeaderName];
    if (!clientPrincipalHeader) {
        context.res = addVaryHeaders({ status: 401 });
        return;
    }
    const userInfo = JSON.parse(decodeBase64(clientPrincipalHeader));

    // Validate whether all the required configurations are provided in config.json and referrer header
    configCheckResult = utils.validateConfig();
    if (configCheckResult || !workspaceName) {
        const error = configCheckResult || `Referer request header is missing workspace name: ${referrerHeader}`;
        context.res = addVaryHeaders({
            status: 400,
            body: {
                error,
                requestHeaders: req.headers,
                userInfo,
                query: req.query,
            },
        });
        return;
    }

    const workspace = workspaces[workspaceName];
    const users = workspace ? workspace.users[userInfo.identityProvider] : undefined;
    const user = users ? users[userInfo.userDetails] : undefined;
    const userReports = Object.keys(workspace ? workspace.reports : {}).filter(
        reportName => user && user.includes(reportName)
    );
    const report = workspace ? (reportName ? workspace.reports[reportName] : userReports[0]) : undefined;

    if (!workspace || (reportName && !report)) {
        context.res = addVaryHeaders({ status: 404 });
        return;
    }

    if (!user || (reportName && !user.includes(reportName))) {
        context.res = addVaryHeaders({ status: 403 });
        return;
    }

    // Get the details like Embed URL, Access token and Expiry
    const embedInfo = reportName ? await embedToken.getEmbedInfo(workspace.id, report.id) : {};
    context.res = addVaryHeaders({
        status: embedInfo.status,
        body: {
            ...embedInfo,
            requestHeaders: req.headers,
            query: req.query,
            userInfo: userInfo,
            reports: userReports,
        },
    });
};