const { test, expect } = require('@playwright/test');

const enterUsername = async (page, username) => {
    // This page is poorly implemented. It requires the username to be type()d and not fill()ed.
    // If this happens too soon after the selector appears the entered username is not captured
    // completely. // Give it time to settle before type()ing the username.
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
    test('should list all reports from API', async ({ page }) => {
        await login(page, 'rwaldin@signatureanalytics.com');
        const reports = [];
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/getEmbedToken`) {
                const json = await response.json();
                json.reports.forEach(r => reports.push(r));
                page.off('response', responseListener);
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

    test.skip('should list all pages of current report from API', () => {});
});
