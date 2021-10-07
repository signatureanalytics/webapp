#!/usr/bin/env bash
if [[ ! -d 'build' ]]; then
    npm run build
fi 
export npx=$([ "$OS" == "Windows_NT" ] && echo "npx.cmd" || echo "npx")
scripts/spawnWaitSpawn.js "$npx swa start build --api ../api" "emulator started" "$npx playwright test $*"
