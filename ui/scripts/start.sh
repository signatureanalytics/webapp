#!/usr/bin/env bash
export npx=$([ $OS == "Windows_NT" ] && echo "npx.cmd" || echo "npx")
./scripts/spawnWaitSpawn.js "$npx snowpack dev" 'Server started in \d+ms' "$npx swa start http://localhost:8080 --api ../api"
