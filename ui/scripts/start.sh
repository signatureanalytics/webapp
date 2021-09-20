#!/bin/sh
npx snowpack dev &
swa start http://localhost:8080 --api ../api &
