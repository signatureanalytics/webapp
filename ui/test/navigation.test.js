const childProcess = require('child_process');
const StreamSnitch = require('stream-snitch');

jest.setTimeout(30000);

const spawnWaitForOutput = (cmdline, regex) => {
    const [cmd, ...args] = cmdline.split(' ');
    const proc = childProcess.spawn(cmd, args);
    proc.stdout.setEncoding('utf8');
    const snitch = new StreamSnitch(regex);
    const result = new Promise((resolve, reject) => {
        snitch.on('match', _ => resolve(proc));
        snitch.on('close', _ => reject(`Process '${cmdline}' ended without matching: ${regex}`));
    });
    proc.stdout.pipe(snitch);
    return result;
};

describe('Authorization', () => {
    const procs = {};
    beforeAll(async () => {
        procs.snowpack = await spawnWaitForOutput('npx snowpack dev', /\[snowpack\] Ready/);
        procs.swa = await spawnWaitForOutput('swa start http://localhost:8080 --api ../api', /emulator started/);
    });

    describe('Covantage', () => {
        describe('API', () => {
            beforeEach(async () => {
                await page.close();
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
            });
            it('should return 403 for unrecognized user', async () => {
                await page.goto('http://localhost:4280/.auth/login/google?post_login_redirect_uri=/signatureanalytics');
                await page.type('#userDetails', 'ray@waldin.net');
                await page.click('#submit');
                const apiResponse = await page.waitForResponse(response => {
                    return response.url() === `http://localhost:4280/api/getEmbedToken`;
                });
                expect(apiResponse.status()).toBe(403);
            });

            it('should return 200 for recognized user', async () => {
                await page.goto('http://localhost:4280/signatureanalytics');
                await page.waitForNavigation();
                await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
                await page.click('#submit');
                const apiResponse = await page.waitForResponse(response => {
                    return response.url() === `http://localhost:4280/api/getEmbedToken`;
                });
                expect(apiResponse.status()).toBe(200);
            });

            it('should return 200 for recognized user requesting disallowed report and redirect to first report/page', async () => {
                await page.goto('http://localhost:4280/signatureanalytics/sales');
                await page.waitForNavigation();
                await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
                await page.click('#submit');
                const apiResponse = await page.waitForResponse(response => {
                    return response.url() === `http://localhost:4280/api/getEmbedToken`;
                });
                expect(apiResponse.status()).toBe(200);
                expect(page.url()).toBe('http://localhost:4280/signatureanalytics/sales');
                await page.waitForNavigation();
                expect(page.url()).toBe('http://localhost:4280/signatureanalytics/engagement/client-issues');
            });

            it('should return 404 for unrecognized workspace', async () => {
                await page.goto('http://localhost:4280/foo/');
                await page.waitForNavigation();
                await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
                await page.click('#submit');
                const apiResponse = await page.waitForResponse(response => {
                    return response.url() === `http://localhost:4280/api/getEmbedToken`;
                });
                expect(apiResponse.status()).toBe(404);
            });

            it('should return 200 for unrecognized report and then redirected to first report/page', async () => {
                await page.goto('http://localhost:4280/signatureanalytics/foo');
                await page.waitForNavigation();
                await page.type('#userDetails', 'rwaldin@signatureanalytics.com');
                await page.click('#submit');
                const apiResponse = await page.waitForResponse(response => {
                    return response.url() === `http://localhost:4280/api/getEmbedToken`;
                });
                expect(apiResponse.status()).toBe(200);
                expect(page.url()).toBe('http://localhost:4280/signatureanalytics/foo');
                await page.waitForNavigation();
                expect(page.url()).toBe('http://localhost:4280/signatureanalytics/engagement/client-issues');
            });
        });
    });

    afterAll(() => {
        Object.values(procs).forEach(p => p.kill());
    });
});
