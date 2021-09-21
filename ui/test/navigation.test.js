const { test, expect } = require('@playwright/test');
const childProcess = require('child_process');
const StreamSnitch = require('stream-snitch');

const spawnWaitForOutput = (cmdline, regex) => {
    const snitch = new StreamSnitch(regex);
    const [cmd, ...args] = cmdline.split(' ');
    const proc = childProcess.spawn(cmd, args);
    proc.stdout.setEncoding('utf8');
    proc.stdout.pipe(snitch);
    return new Promise((resolve, reject) => {
        snitch.on('match', _ => resolve(proc));
        snitch.on('close', _ => reject(`Process '${cmdline}' ended without matching: ${regex}`));
    });
};

const procs = {};
test.beforeAll(async () => {
    procs.snowpack = await spawnWaitForOutput('npx snowpack dev', /Server started in \d+ms/);
    procs.swa = await spawnWaitForOutput('swa start http://localhost:8080 --api ../api', /emulator started/);
});

test.describe('Authorization API', () => {
    test('should return 401 for unauthorized user', async ({ page }) => {
        const responseListener = response => {
            if (response.url() === `http://localhost:4280/api/getEmbedToken`) {
                expect(response.status()).toEqual(401);
                page.off('response', responseListener);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/signatureanalytics');
    });

    test('should return 403 for unrecognized user', async ({ page }) => {
        await page.goto('http://localhost:4280/signatureanalytics');
        await page.waitForSelector('#userDetails');
        await page.waitForTimeout(500);
        await page.type('#userDetails', 'ray@waldin.net');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(403);
    });

    test('should return 404 for unrecognized workspace', async ({ page }) => {
        await page.goto('http://localhost:4280/foo/');
        await page.waitForSelector('#userDetails');
        await page.waitForTimeout(500);
        await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(404);
    });

    test('should return 200 for recognized user', async ({ page }) => {
        await page.goto('http://localhost:4280/signatureanalytics');
        await page.waitForSelector('#userDetails');
        await page.waitForTimeout(500);
        await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(200);
    });

    test('should return 200 for recognized user requesting disallowed report and redirect to first report/page', async ({
        page,
    }) => {
        await page.goto('http://localhost:4280/signatureanalytics/sales');
        await page.waitForSelector('#userDetails');
        await page.waitForTimeout(500);
        await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(200);
    });

    test('should return 200 for unrecognized report and then redirected to first report/page', async ({ page }) => {
        await page.goto('http://localhost:4280/signatureanalytics/foo');
        await page.waitForSelector('#userDetails');
        await page.waitForTimeout(500);
        await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(200);
    });
});

test.afterAll(() => {
    Object.values(procs).forEach(p => p.kill());
});
