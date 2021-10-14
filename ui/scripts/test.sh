#!/usr/bin/env bash
export npx=$([ "$OS" == "Windows_NT" ] && echo "npx.cmd" || echo "npx")

echo "Running unit tests..."
$npx mocha $*

if [ "$?" != "0" ]; then exit $?; fi

echo "Running end to end tests..."
$npx playwright test $*
