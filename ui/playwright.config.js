const config = {
    use: {
        launchOptions: {
            headless: process.env.HEADLESS !== 'false',
        },
    },
    retries: 2,
    workers: 1,
};

module.exports = config;
