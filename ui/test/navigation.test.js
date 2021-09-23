const { test, expect } = require('@playwright/test');
const fs = require('fs/promises');

const enterUsername = async (page, username) => {
    // This page is poorly implemented. It requires the username to be type()d and not fill()ed.
    // If this happens too soon after the selector appears the entered username is not captured
    // completely. // Give it time to settle before type()ing the username.
    page.on('console', msg => console.log(msg.text()));
    await page.waitForSelector('#userDetails');
    await page.waitForTimeout(500);
    await page.type('#userDetails', username);
};

const login = async (page, username) => {
    await page.goto('http://localhost:4280/.auth/login/google');
    await enterUsername(page, username);
    await page.click('#submit');
};

test.describe('Navigation', () => {
    test('should open specified report page', async ({ page }) => {
        try {
            await fs.mkdir('test-results');
        } catch (e) {}
        page.on('request', async request => {
            const headers = await request.allHeaders();
            await fs.appendFile(
                'test-results/http.log',
                `${request.url()} ${Object.entries(headers).map(([key, val]) => `\n${key}: ${val}`)}\n`
            );
        });
        page.on('response', async response => {
            const headers = await response.allHeaders();
            await fs.appendFile(
                'test-results/http.log',
                `${response.status()} ${response.url()}  ${Object.entries(headers).map(
                    ([key, val]) => `\n${key}: ${val}`
                )}\n`
            );
        });
        page.on('requestfailed', async request => {
            await fs.appendFile(
                'test-results/http.log',
                `REQUEST FAILURE: ${request.url()} ${request.failure().errorText}`
            );
        });
        await login(page, 'rwaldin@signatureanalytics.com');
        await page.goto('http://localhost:4280/signatureanalytics/market/revenue-kpis');
        await page.waitForSelector('.page');
        await page.screenshot({ path: 'test-results/testScreenshot.png' });
    });
    test('should list all reports from API', async ({ page }) => {
        await login(page, 'rwaldin@signatureanalytics.com');
        const reports = [];
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/getEmbedToken`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
                const json = await response.json();
                json.reports.forEach(r => reports.push(r));
            }
        };
        await page.goto('http://localhost:4280/signatureanalytics');
        page.on('response', responseListener);
        await page.waitForSelector('.report');
        const reportElements = await page.$$('.report');
        expect(reportElements).toHaveLength(reports.length);
        for (const reportElement of reportElements) {
            const title = await reportElement.innerText();
            expect(reports).toContain(title.replace(/ Report$/, ''));
        }
    });

    test('should list all pages of current report', async ({ page }) => {
        await login(page, 'rwaldin@signatureanalytics.com');
        await page.goto('http://localhost:4280/signatureanalytics');
        await page.waitForSelector('.report');
        await page.waitForSelector('.page');
        const pages = await page.evaluate(async _ => {
            const main = document.querySelector('sa-main');
            const report = main.shadowRoot.querySelector('sa-report').report;
            const pages = await report.getPages();
            return pages.map(({ name, displayName }) => ({ name, displayName }));
        });
        const pageElements = await page.$$('.page');
        for (const pageElement of pageElements) {
            const title = await pageElement.innerText();
            expect(pages.map(p => p.displayName)).toContain(title);
        }
    });
});
