// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
const minifyHTML = require('rollup-plugin-minify-html-literals').default;
const terser = require('rollup-plugin-terser').terser;

module.exports = {
    mount: {
        src: '/',
    },
    plugins: [
        [
            'snowpack-plugin-rollup-bundle',
            {
                emitHtmlFiles: true,
                preserveSourceFiles: false,

                // equivalent to inputOptions.input from Rollup
                entrypoints: ['build/dashboard.js', 'build/userinfo.js'],
                extendConfig: config => {
                    config.inputOptions.plugins.push(
                        minifyHTML({
                            options: {
                                minifyOptions: {
                                    conservativeCollapse: true,
                                    minifyCSS: {
                                        level: {
                                            1: {
                                                tidySelectors: false,
                                            },
                                        },
                                    },
                                },
                            },
                        })
                    );
                    config.inputOptions.plugins.push(
                        terser({
                            compress: {
                                passes: 2,
                            },
                        })
                    );
                    return config;
                },
            },
        ],
    ],
    packageOptions: {
        /* ... */
    },
    devOptions: {
        open: 'none',
    },
    buildOptions: {
        out: 'build',
    },
    routes: [
        {
            match: 'routes',
            src: '/',
            dest: 'index.html',
        },
        {
            match: 'routes',
            src: `^/(?!api)(?!\.auth)(?!node_modules)(?!assets).+`,
            dest: 'dashboard.html',
        },
    ],
};
