// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

const minifyHTML = require('rollup-plugin-minify-html-literals').default;
const terser = require('rollup-plugin-terser').terser;
const replace = require('@rollup/plugin-replace');

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        src: '/',
    },
    optimize: {
        treeshake: true,
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
                                passes: 1,
                            },
                        })
                    );

                    config.outputOptions.sourcemap = process.env.NODE_ENV !== 'production';

                    return config;
                },
            },
        ],
    ],
    packageOptions: {
        knownEntrypoints: ['lit-html', 'lit-html/directive.js', 'lit-html/directives/class-map.js'],
    },
    devOptions: {
        open: 'none',
        output: 'stream',
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
