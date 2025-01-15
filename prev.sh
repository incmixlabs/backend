#!/bin/bash
set -e
# Install Sentry cli
curl -sL https://sentry.io/get-cli/ | sh
# Set release version
RELEASE_VERSION=$(sentry-cli releases propose-version)

# Backend Auth
echo "Uploading Auth"
cd ./api/auth
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/auth' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend Users
echo "Uploading Users"
cd ./api/users-api
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/users-api' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend Org
echo "Uploading Org"
cd ./api/org-api
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/org-api' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend Intl
echo "Uploading Intl"
cd ./api/intl-api
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/intl-api' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend Todo
echo "Uploading Todo"
cd ./api/tasks-api
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/tasks-api' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend Files
echo "Uploading Files"
cd ./api/files-api
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/files-api' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend Email
echo "Uploading Email"
cd ./api/email
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/email' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend Location API
echo "Uploading Location API"
cd ./api/location-api
pnpm run build --env prev
sentry-cli releases new $RELEASE_VERSION
sentry-cli sourcemaps inject ./dist
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/location-api' --validate
sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy --env prev
cd ../..

# Backend bff-web
echo "Uploading bff-web"
cd ./api/bff-web
pnpm run deploy --env prev
cd ../..

# Notify Sentry of new deployment
sentry-cli releases deploys $RELEASE_VERSION new -e production
