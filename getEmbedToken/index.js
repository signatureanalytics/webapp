const path = require('path');
const embedToken = require('./embedConfigService.js');
const utils = require('./utils.js');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    const { workspace, report } = req.query;

    // Validate whether all the required configurations are provided in config.json
    configCheckResult = utils.validateConfig();
    if (configCheckResult || !workspace || !report) {
        context.res = {
            status: 400,
            body: {
                error: configCheckResult || `Request missing ${!workspace ? 'Workspace' : 'Report'} ID`,
                requestHeaders: req.headers,
                query: req.query,
            },
        };
        return;
    }

    // Get the details like Embed URL, Access token and Expiry
    let result = await embedToken.getEmbedInfo(workspace, report);
    result.requestHeaders = req.headers;
    result.query = req.query;
    context.res = {
        status: result.status,
        // status: 200, /* Defaults to 200 */
        body: result,
    };
};
