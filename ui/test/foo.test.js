const { test, expect } = require('@playwright/test');

test('my test', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);

  // Expect an attribute "to be strictly equal" to the value.
  await expect(page.locator('text=Get Started').first()).toHaveAttribute('href', '/docs/intro');

  // Expect an element "to be visible".
  await expect(page.locator('text=Learn more').first()).toBeVisible();

  await page.click('text=Get Started');
  // Expect some text to be visible on the page.
  await expect(page.locator('text=System requirements').first()).toBeVisible();

  // Compare screenshot with a stored reference.
  expect(await page.screenshot()).toMatchSnapshot('get-started.png');
});

test('my test 2', async ({ page }) => {
    await page.goto('https://signatureanalytics.com/');
  
    // Expect an attribute "to be strictly equal" to the value.
    await expect(page.locator('#top-menu [href="/our-approach/"]')).toContainText("Solutions");
  
  });

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
    test('should list all reports from API', async ({ page }) => {
        await login(page, 'rwaldin@signatureanalytics.com');
        const reports = [];
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/getWorkspaceToken`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
                const json = await response.json();
                Object.keys(json.reports).forEach(r => reports.push(r));
            }
        };
        await page.goto('http://localhost:4280/signatureanalytics');
        page.on('response', responseListener);
        await page.waitForSelector('.report');
        const reportElements = await page.$$('.report > .name');
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
        await page.waitForTimeout(4000);
        const pages = await page.evaluate(async _ => {
            const main = document.querySelector('sa-main');
            const report = main.shadowRoot.querySelector('sa-report').report;
            const pages = await report.getPages();
            return pages.map(({ name, displayName }) => ({ name, displayName }));
        });
        const pageElements = await page.$$('.report.selected .page');
        for (const pageElement of pageElements) {
            const title = await pageElement.innerText();
            expect(pages.map(p => p.displayName)).toContain(title);
        }
    });

    test.skip('should list all pages of all reports', async ({ page }) => {

    });

    test.skip('should load first page when report is selected', async ({ page }) => {

    });
    
});