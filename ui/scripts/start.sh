#!/usr/bin/env bash
if [ "$OS" == "Windows_NT" ]; then
    npx swa start http://localhost:8080 --api-location ../api --run '"npx.cmd snowpack dev"'
else
    npx swa start http://localhost:8080 --api-location ../api --run "npx snowpack dev"
fi