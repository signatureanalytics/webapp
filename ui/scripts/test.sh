#!/usr/bin/env bash
if [[ ! -d 'build' ]]; then
    npm run build
fi 
scripts/spawnWaitSpawn.js "swa start build --api ../api" "emulator started" "npx playwright test $*"
