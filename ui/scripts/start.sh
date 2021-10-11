#!/usr/bin/env bash
export npx=$([ "$OS" == "Windows_NT" ] && echo "npx.cmd" || echo "npx")
$npx swa start http://localhost:8080 --api-location ../api --run "$npx snowpack dev"
