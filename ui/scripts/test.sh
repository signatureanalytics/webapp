#!/usr/bin/env bash
if [[ ! -d 'build' ]]; then
    npm run build
fi 
export npx=$([ "$OS" == "Windows_NT" ] && echo "npx.cmd" || echo "npx")
$npx playwright test $*
