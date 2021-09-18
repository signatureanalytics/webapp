const embedToken = require('./embedConfigService.js');
const utils = require('./utils.js');
const workspaces = require('./workspaces.js');
const slug = require('./slug.js');

const referrerHeaderName = 'referer'; // [sic] see https://en.wikipedia.org/wiki/HTTP_referer#Etymology
const cookieHeaderName = 'cookie';
const clientPrincipalHeaderName = 'x-ms-client-principal';
const varyHeaders = { vary: [referrerHeaderName, clientPrincipalHeaderName, cookieHeaderName] };
const requestExpiresBeforeTokenExpiresMs = 10 * 60 * 1000; // expire request 10 minutes before token expires

const decodeBase64 = base64 => Buffer.from(base64, 'base64').toString('ascii');
const addHeaders = response => ({
    ...response,
    headers: { ...response.headers, ...varyHeaders },
});

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // extract workspace name and optional report name from referrer header
    const referrerHeader = req.headers[referrerHeaderName];
    const [, workspaceSlug, reportSlug] = new URL(referrerHeader).pathname.split('/');
    if (!workspaceSlug) {
        context.res = addHeaders({ status: 404 });
        return;
    }
    // extract user info from client principal header
    const clientPrincipalHeader = req.headers[clientPrincipalHeaderName];
    if (!clientPrincipalHeader) {
        context.res = addHeaders({ status: 401 });
        return;
    }
    const userInfo = JSON.parse(decodeBase64(clientPrincipalHeader));

    // Validate whether all the required configurations are provided in config.json and referrer header
    configCheckResult = utils.validateConfig();
    if (configCheckResult || !workspaceSlug) {
        const error = configCheckResult || `Referer request header is missing workspace name: ${referrerHeader}`;
        context.res = addHeaders({
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

    const workspace = workspaces[workspaceSlug];
    const users = workspace ? workspace.users[userInfo.identityProvider] : undefined;
    const user = users ? users[userInfo.userDetails] : undefined;
    const userReports = Object.keys(workspace ? workspace.reports : {}).filter(
        reportName => user && user.includes(reportName)
    );

    const reportName = userReports.find(r => slug(r) === reportSlug) || userReports[0];
    const report = workspace
        ? reportName
            ? workspace.reports[reportName]
            : workspace.reports[userReports[0]]
        : undefined;

    if (!workspace || (reportName && !report)) {
        context.res = addHeaders({ status: 404 });
        return;
    }

    if (!user || (reportName && !user.includes(reportName))) {
        console.log(user, userInfo);
        context.res = addHeaders({ status: 403 });
        return;
    }

    // Get the details like Embed URL, Access token and Expiry
    const embedInfo = await embedToken.getEmbedInfo(workspace.id, report.id);
    const status = embedInfo.status;
    const tokenExpiresMs = embedInfo.expiry ? new Date(embedInfo.expiry).getTime() : Date.now();
    const requestMaxAgeSeconds = ~~((tokenExpiresMs - Date.now() - requestExpiresBeforeTokenExpiresMs) / 1000);

    context.res = addHeaders({
        status,
        headers: {
            'cache-control': `max-age=${requestMaxAgeSeconds}`,
        },
        body: {
            report: { name: reportName, ...embedInfo },
            requestHeaders: req.headers,
            query: req.query,
            userInfo: userInfo,
            reports: userReports,
        },
    });
};
