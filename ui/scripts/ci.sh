#!/usr/bin/bash
set -e
echo 104.42.113.248 app.powerbi.com | sudo tee -a /etc/hosts

cd api
npm ci
cp testing.env .env

cd ..
cd ui
npm ci
npm run build
npx playwright install
npm test -- --workers=1 --retries=2

cd ..
rm api/.env
