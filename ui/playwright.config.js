const config = {
    use: {
        launchOptions: {
            headless: process.env.HEADLESS !== 'false',
        },
    },
};

module.exports = config;
