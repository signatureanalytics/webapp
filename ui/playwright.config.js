const config = {
    testDir: 'tests/e2e',
    outputDir: 'test-results/playwright',
    use: {
        screenshot: 'only-on-failure',
        launchOptions: {
            headless: process.env.HEADLESS !== 'false',
        },
    },
    webServer: {
        command: process.env.CI ? 'npx swa start build --api-location ../api' : 'npm start',
        port: 4280,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
    },
};

module.exports = config;
