#!/usr/bin/env bash
if [[ ! -d 'build' ]]; then
    npm run build
fi 
export DEBUG=pw:browser
scripts/spawnWaitSpawn.js 'swa start build --api ../api' 'emulator started' 'npx playwright test'
