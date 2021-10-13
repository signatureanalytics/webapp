#!/usr/bin/env bash
export NODE_ENV=${NODE_ENV:-development}

if [[ "$CI" != "" ]]; then 
    export NODE_ENV=production
fi

npx snowpack build

if [[ "$CI" != "" ]]; then 
    mkdir _build
    mv build/{*.js,*.html,assets} _build
    rm -rf build
    mv _build build
fi
