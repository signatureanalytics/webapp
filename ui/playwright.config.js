const config = {
    use: {
        launchOptions: {
            headless: process.env.HEADLESS !== 'false',
        },
    },
    retries: 3,
};

module.exports = config;
