#!/usr/bin/env bash
npx snowpack build
mkdir _build
mv build/{*.js,*.html,*.map,assets} _build
rm -rf build
mv _build build
