const { test, expect } = require('@playwright/test');
const fs = require('fs/promises');

const login = async (page, username) => {
    await page.goto('http://localhost:4280/.auth/login/google');
    // This page is poorly implemented. It requires the username to be type()d and not fill()ed.
    // If this happens too soon after the selector appears the entered username is not captured
    // completely. // Give it time to settle before type()ing the username.
    await page.waitForTimeout(250);
    await page.locator('#userDetails').type(username);
    await page.locator('#submit').click();
};

test.beforeEach(({ page }) => {
    page.on('console', msg => console.log(msg.text()));
});

test.describe('Navigation', () => {
    test('should list all reports from API', async ({ page }) => {
        await login(page, 'testuser@example.com');
        const reports = [];
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
                const json = await response.json();
                Object.keys(json.reports).forEach(r => reports.push(r));
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting', { waitUntil: 'load' });
        const reportNames = await page.locator('.report > .name');
        expect(await reportNames.count()).toEqual(reports.length);
        for (const reportName of await reportNames.elementHandles()) {
            const title = await reportName.innerText();
            expect(reports).toContain(title.replace(/ Report$/, ''));
        }
    });

    test('should list all pages of current report', async ({ page }) => {
        await login(page, 'testuser@example.com');
        await page.goto('http://localhost:4280/automatedtesting');
        const pages = await page.locator('.page.selected').evaluate(async _ => {
            const main = document.querySelector('sa-main');
            const report = main.shadowRoot.querySelector('sa-report').report;
            const pages = await report.getPages();
            return pages.map(({ name, displayName }) => ({ name, displayName }));
        });
        const pageNames = pages.map(p => p.displayName);
        for (const pageElement of await page.locator('.report.selected .page').elementHandles()) {
            const title = await pageElement.innerText();
            expect(pageNames).toContain(title);
        }
    });
});
