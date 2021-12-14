const { test, expect } = require('@playwright/test');

const login = async (page, provider, username) => {
    await page.goto(`http://localhost:4280/.auth/login/${provider}`);
    // This page is poorly implemented. It requires the username to be type()d and not fill()ed.
    // If this happens too soon after the selector appears the entered username is not captured
    // completely.
    //
    // Give it time to settle before type()ing the username.
    await page.waitForTimeout(250);
    await page.locator('#userDetails').type(username);
    await page.locator('#submit').click();
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
        await login(page, 'aad', 'aaduser@example.com');
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
        await login(page, 'google', 'unrecognizeduser@example.com');
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
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(404);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/foo');
    });

    test('should return 200 for recognized user', async ({ page }) => {
        await login(page, 'google', 'testuser@example.com');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting');
    });

    test('should return 200 for recognized user with different case in email address', async ({ page }) => {
        await login(page, 'google', 'TESTuser@example.com');
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
        await login(page, 'google', 'testuser@example.com');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting/sales');
    });

    test('should return 200 and redirect to first report for unrecognized report', async ({ page }) => {
        await login(page, 'google', 'testuser@example.com');
        const responseListener = async response => {
            if (response.url() === `http://localhost:4280/api/workspace`) {
                page.off('response', responseListener);
                expect(await response.status()).toEqual(200);
            }
        };
        page.on('response', responseListener);
        await page.goto('http://localhost:4280/automatedtesting/foo');
    });
});
