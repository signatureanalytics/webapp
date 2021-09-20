module.exports = {
    launch: {
        // dumpio: true,
        headless: process.env.HEADLESS !== 'false',
        // devtools: true,
        slowMo: process.env.SLOMO || false,
    },
    browserContext: 'incognito',
};
