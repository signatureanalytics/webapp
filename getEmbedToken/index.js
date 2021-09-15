const path = require('path');
const embedToken = require('./embedConfigService.js');
const utils = require('./utils.js');
const workspaces = require('./workspaces.js');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const encodedClientPrincipal = req.headers['x-ms-client-principal'];
    const refererMatch = req.headers.referer.match(`^.*//[^/?]+/(?<workspaceName>[^/?]+)/(?<reportName>[^/?]+)`);
    if (!refererMatch || !encodedClientPrincipal) {
        context.res = { status: 403 };
        return;
    }
    const userInfo = JSON.parse(decodeBase64(encodedClientPrincipal));
    const { workspaceName, reportName } = refererMatch.groups;

    // Validate whether all the required configurations are provided in config.json
    configCheckResult = utils.validateConfig();
    if (configCheckResult || !workspaceName || !reportName) {
        context.res = {
            status: 400,
            body: {
                error: configCheckResult || `Request missing ${!workspace ? 'Workspace' : 'Report'} ID`,
                requestHeaders: req.headers,
                userInfo,
                query: req.query,
            },
        };
        return;
    }
    const workspace = workspaces[workspaceName];
    const report = workspace.dashboards[reportName];
    const user = workspace.users[userInfo.userDetails];
    if (!user) {
        context.res = { status: 401 };
        return;
    }

    if (!workspace || !report || !user.includes(reportName)) {
        context.res = { status: 403 };
        return;
    }

    // Get the details like Embed URL, Access token and Expiry
    let result = await embedToken.getEmbedInfo(workspace.id, report.id);
    result.requestHeaders = req.headers;
    result.query = req.query;
    result.userInfo = userInfo;
    context.res = {
        status: result.status,
        // status: 200, /* Defaults to 200 */
        body: result,
    };
};

const decodeBase64 = base64 => Buffer.from(base64, 'base64').toString('ascii');
