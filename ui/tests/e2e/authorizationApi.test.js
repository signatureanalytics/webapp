const { test, expect } = require('@playwright/test');

const enterUsername = async (page, username) => {
    // This page is poorly implemented. It requires the username to be type()d and not fill()ed.
    // If this happens too soon after the selector appears the entered username is not captured
    // completely. // Give it time to settle before type()ing the username.
    await page.waitForSelector('#userDetails');
    await page.waitForTimeout(500);
    await page.type('#userDetails', username);
    await page.waitForSelector('#userRoles');
};

test.describe('Authorization API', () => {
    test('should return 401 for unauthorized user', async ({ page }) => {
        const responseListener = response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                expect(response.status()).toEqual(401);
                page.off('response', responseListener);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });

    test('should return 403 for unrecognized AAD user', async ({ page }) => {
        await page.goto('http://localhost:4280/.auth/login/aad');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytic.onmicrosoft.com');
        await page.click('#submit');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(403);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });

    test('should return 403 for unrecognized Google user', async ({ page }) => {
        await page.goto('http://localhost:4280/automatedtesting');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'ray@waldin.net');
        await page.click('#submit');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(403);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });

    test('should return 404 for unrecognized workspace', async ({ page }) => {
        await page.goto('http://localhost:4280/foo');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(404);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });

    test('should return 200 for recognized user', async ({ page }) => {
        await page.goto('http://localhost:4280/automatedtesting');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });

    test('should return 200 and redirect to first report for disallowed report', async ({ page }) => {
        await page.goto('http://localhost:4280/automatedtesting/sales');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });

    test('should return 200 and redirect to first report for unrecognized report', async ({ page }) => {
        await page.goto('http://localhost:4280/automatedtesting/foo');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });
});
