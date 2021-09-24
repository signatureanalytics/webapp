const config = {
    use: {
        screenshot: 'only-on-failure',
        launchOptions: {
            headless: process.env.HEADLESS !== 'false',
        },
    },
};

module.exports = config;
