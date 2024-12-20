#!/usr/bin/env node
import 'colors';
import { Command } from 'commander';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { diffLines } from 'diff';
import dotenv from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import { createServer } from 'http';
import { dump as unparseYaml, load as parseYaml } from 'js-yaml';
import fetch from 'node-fetch';
import open from 'open';
import { homedir } from 'os';
import path from 'path';
import { URLSearchParams } from 'url';
import { deflateSync, inflateSync } from 'zlib';
import { config } from './config.js';

dotenv.config();

const logIfNotRedir = process.stdout.isTTY ? console.log : _ => {};

const { apiVersion, subscription, resourceGroup, site, redirect, tenant, client } = config;
const secret = process.env.CLIENT_SECRET;
const oauthUrl = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/`);
const codeGrantUrl = new URL(`authorize?client_id=${client}&response_type=code&redirect_uri=${redirect}`, oauthUrl);
const managementUrl = new URL('https://management.azure.com/');
const siteManagementUrl = new URL(
    `subscriptions/${subscription}/resourceGroups/${resourceGroup}/providers/Microsoft.Web/staticSites/${site}/`,
    managementUrl
);
const accessTokenUrl = new URL('token', oauthUrl);
const accessTokenParams = {
    grant_type: 'authorization_code',
    client_id: client,
    client_secret: secret,
    redirect_uri: redirect,
    resource: managementUrl,
};

const accessTokenFile = path.join(homedir(), '.covantage');
const readAccessToken = async _ => {
    try {
        const yaml = await readFile(accessTokenFile, 'utf8');
        const token = parseYaml(yaml);
        token.accessToken = token.accessToken ? decrypt(token.accessToken, secret) : undefined;
        return token;
    } catch (error) {
        return {};
    }
};

const writeAccessToken = token => {
    const accessToken = token.accessToken ? encrypt(token.accessToken, secret) : undefined;
    const yaml = unparseYaml({ ...token, accessToken }, { lineWidth: -1 });
    return writeFile(accessTokenFile, yaml, { mode: 0o600 });
};

export const encrypt = (content, secret) => {
    const initVector = randomBytes(16);
    const cipher = createCipheriv('aes256', secret.slice(0, 32), initVector);
    const encrypted = cipher.update(content, 'utf8', 'hex') + cipher.final('hex');
    return deflateSync(initVector.toString('hex') + encrypted).toString('base64');
};

export const decrypt = (content, secret) => {
    const decompressed = inflateSync(Buffer.from(content, 'base64')).toString('utf8');
    const initVector = Buffer.from(decompressed.slice(0, 32), 'hex');
    const decipher = createDecipheriv('aes256', secret.slice(0, 32), initVector);
    return decipher.update(decompressed.slice(32), 'hex', 'utf8') + decipher.final('utf8');
};

const authenticate = async _ => {
    const token = await readAccessToken();
    if (token.accessToken && token.accessTokenExpires && Date.now() < new Date(token.accessTokenExpires)) {
        return Promise.resolve(token.accessToken);
    }

    return new Promise((resolve, reject) => {
        const server = createServer(async (req, res) => {
            const url = new URL(req.url, redirect);
            if (url.pathname !== '/') {
                res.end();
                return;
            }
            server.close();
            const code = url.searchParams.get('code');
            const accessTokenResponse = await fetch(accessTokenUrl, {
                method: 'POST',
                body: new URLSearchParams({ ...accessTokenParams, code }),
            });
            if (!accessTokenResponse.ok) {
                const errorMsg = `Unexpected access token response: ${accessTokenResponse.status} ${accessTokenResponse.statusText}`;
                reject(new Error(errorMsg));
                res.end(errorMsg);
                return;
            }
            const accessTokenJson = await accessTokenResponse.json();
            token.accessToken = accessTokenJson.access_token;
            token.accessTokenExpires = new Date(Date.now() + accessTokenJson.expires_in * 1000);
            await writeAccessToken(token);
            resolve(token.accessToken);
            res.end('You are logged in. Close this window and return to the CoVantage CLI.');
        }).listen(33333);
        server.keepAliveTimeout = 1;
        open(codeGrantUrl.toString());
    });
};

const buildForBranch = async branch => {
    if (!branch) {
        return 'default';
    }
    const branchMap = await getBranchMap();
    const build = branchMap[branch]?.build;
    if (!build) {
        throw new Error(`invalid branch name: ${branch}`);
    }
    return build;
};

const getBranchMap = async _ => {
    const url = new URL(`builds?${apiVersion}`, siteManagementUrl);
    const accessToken = await authenticate();
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) {
        throw new Error(`Error requesting branch info: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    return Object.fromEntries(
        json.value.map(({ properties }) => [
            properties.sourceBranch,
            { build: properties.buildId, hostname: properties.hostname },
        ])
    );
};

const getWorkspaceSetting = ({ properties }, slug) =>
    properties[Object.keys(properties).find(key => key.toLowerCase() === `workspace_${slug}`)];

const getAppSettings = async branch => {
    const build = await buildForBranch(branch);
    const url = new URL(`builds/${build}/listFunctionAppSettings?${apiVersion}`, siteManagementUrl);
    const accessToken = await authenticate();
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
    return response.json();
};

const setAppSettings = async (branch, settings) => {
    const build = await buildForBranch(branch);
    const url = new URL(`builds/${build}/config/appsettings?${apiVersion}`, siteManagementUrl);
    const accessToken = await authenticate();
    return fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ properties: settings.properties }),
    });
};

const program = new Command('covantage.js').option('-v, --verbose', 'show stack trace on error');

program.showSuggestionAfterError(true);
program.showHelpAfterError(true);

program
    .command('login')
    .description('log in to Azure hosting environment')
    .action(async _ => {
        await authenticate();
        logIfNotRedir('logged in');
    });

program
    .command('logout')
    .description('log out of Azure hosting environment')
    .action(async _ => {
        const config = await readAccessToken();
        delete config.accessToken;
        delete config.accessTokenExpires;
        await writeAccessToken(config);
        logIfNotRedir('logged out');
    });

program
    .command('branches')
    .alias('b')
    .description('list branches and their corresponding staging environments')
    .action(async _ => {
        const branchMap = await getBranchMap();
        const branches = Object.entries(branchMap).map(([branch, { hostname }]) => `${branch}: ${hostname}`);
        logIfNotRedir();
        logIfNotRedir('branch: staging environment');
        logIfNotRedir('---------------------------');
        console.log(branches.sort().join('\n'));
        logIfNotRedir();
    });

program
    .command('workspaces')
    .alias('w')
    .argument('[branch]', 'name of branch', 'main')
    .description('list workspaces')
    .action(async branchName => {
        const settings = await getAppSettings(branchName);
        const workspaces = Object.keys(settings.properties)
            .map(key => key.toLowerCase().match(/^workspace_(.*)$/)?.[1])
            .filter(Boolean);

        logIfNotRedir();
        logIfNotRedir(`workspaces on "${branchName}" branch`);
        logIfNotRedir('-'.repeat(23 + branchName.length));
        console.log(workspaces.sort().join('\n'));
        logIfNotRedir();
    });

program
    .command('show')
    .alias('s')
    .argument('<workspace>', 'name of workspace to show')
    .argument('[branch]', 'name of branch', 'main')
    .description('show contents of specified workspace')
    .action(async (workspaceSlug, branchName) => {
        const settings = await getAppSettings(branchName);
        const setting = await getWorkspaceSetting(settings, workspaceSlug);
        const yaml = parseYaml(setting);

        logIfNotRedir();
        logIfNotRedir(`workspace "${workspaceSlug}" on "${branchName}" branch`);
        logIfNotRedir('-'.repeat(25 + branchName.length + workspaceSlug.length));
        console.log(unparseYaml(yaml, { flowLevel: 3 }));
        logIfNotRedir();
    });

program
    .command('create')
    .alias('c')
    .argument('<workspace>', 'name of workspace to create')
    .argument('<filename>', 'name of file to upload for new workspace')
    .argument('[branch]', 'name of branch', 'main')
    .description('create workspace by uploading file')
    .action(async (workspaceSlug, filename, branchName) => {
        const settings = await getAppSettings(branchName);
        const workspaceEnv = `WORKSPACE_${workspaceSlug.toUpperCase()}`;
        if (workspaceEnv in settings.properties) {
            throw new Error(`workspace "${workspaceSlug}" already exists.`);
        }
        settings.properties[workspaceEnv] = unparseYaml(parseYaml(await readFile(filename)), {
            flowLevel: 0,
        });
        const response = await setAppSettings(branchName, settings);
        if (response.ok) {
            logIfNotRedir(`workspace "${workspaceSlug}" created`);
        } else {
            throw new Error(`workspace creation failed: ${response.status} ${response.statusCode}`);
        }
    });

program
    .command('update')
    .alias('u')
    .argument('<workspace>', 'name of workspace to update')
    .argument('<filename>', 'name of file with updated workspace')
    .argument('[branch]', 'name of branch', 'main')
    .description('update workspace with contents of file')
    .action(async (workspaceSlug, filename, branchName) => {
        const settings = await getAppSettings(branchName);
        const workspaceEnv = `WORKSPACE_${workspaceSlug.toUpperCase()}`;
        if (!(workspaceEnv in settings.properties)) {
            throw new Error(`workspace "${workspaceSlug}" does not exist.`);
        }
        settings.properties[workspaceEnv] = unparseYaml(parseYaml(await readFile(filename)), {
            flowLevel: 0,
        });
        const response = await setAppSettings(branchName, settings);
        if (response.ok) {
            logIfNotRedir(`workspace "${workspaceSlug}" updated`);
        } else {
            throw new Error(`workspace update failed: ${response.status} ${response.statusCode}`);
        }
    });

program
    .command('diff')
    .alias('d')
    .argument('<workspace>', 'name of workspace to diff')
    .argument('<filename>', 'name of file to diff')
    .argument('[branch]', 'name of branch', 'main')
    .description('diff workspace with contents of file')
    .action(async (workspaceSlug, filename, branchName) => {
        const settings = await getAppSettings(branchName);
        const workspaceEnv = `WORKSPACE_${workspaceSlug.toUpperCase()}`;
        if (!(workspaceEnv in settings.properties)) {
            throw new Error(`workspace "${workspaceSlug}" does not exist.`);
        }
        const workspace = unparseYaml(parseYaml(settings.properties[workspaceEnv]), {
            flowLevel: 3,
        });
        const fileWorkspace = unparseYaml(parseYaml(await readFile(filename)), { flowLevel: 3 });

        const diff = diffLines(workspace, fileWorkspace);

        if (diff.find(part => part.added || part.removed)) {
            diff.forEach(part => {
                // green for additions, red for deletions, white for common parts
                const color = part.added ? 'green' : part.removed ? 'red' : 'white';
                process.stdout.write((part.removed ? '\u001b[9m' : '') + part.value[color] + '\u001b[0m');
            });
        } else {
            logIfNotRedir('No differences');
        }
    });

process.on('unhandledRejection', error => {
    console.error('error:', error.message);
    if (program.opts().verbose) {
        console.error(error.stack.split('\n').slice(1).join('\n'));
    }
    console.error();
});

program.parseAsync(process.argv);
