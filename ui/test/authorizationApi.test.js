const { test, expect } = require('@playwright/test');

const enterUsername = async (page, username) => {
    // This page is poorly implemented. It requires the username to be type()d and not fill()ed.
    // If this happens too soon after the selector appears the entered username is not captured
    // completely. // Give it time to settle before type()ing the username.
    await page.waitForSelector('#userDetails');
    await page.waitForTimeout(500);
    await page.type('#userDetails', username);
};

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
        await enterUsername(page, 'ray@waldin.net');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(403);
    });

    test('should return 404 for unrecognized workspace', async ({ page }) => {
        await page.goto('http://localhost:4280/foo/');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(404);
    });

    test('should return 200 for recognized user', async ({ page }) => {
        await page.goto('http://localhost:4280/signatureanalytics');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
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
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(200);
    });

    test('should return 200 for unrecognized report and then redirected to first report/page', async ({ page }) => {
        await page.goto('http://localhost:4280/signatureanalytics/foo');
        await page.waitForSelector('#userDetails');
        await enterUsername(page, 'rwaldin@signatureanalytics.com');
        await page.click('#submit');
        const apiResponse = await page.waitForResponse(response => {
            return response.url() === `http://localhost:4280/api/getEmbedToken`;
        });
        expect(apiResponse.status()).toEqual(200);
    });
});
