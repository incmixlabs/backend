#!/bin/bash
set -e

# Sentry disabled

# Install Sentry Cli
# curl -sL https://sentry.io/get-cli/ | sh

# Set release version
# RELEASE_VERSION=$(sentry-cli releases propose-version)

pnpm run build

# Backend Auth
echo "Uploading Auth"
cd ./api/auth
# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/auth' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend Users
echo "Uploading Users"
cd ./api/users-api
# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/users-api' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend Org
echo "Uploading Org"
cd ./api/org-api
# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/org-api' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend Intl
echo "Uploading Intl"
cd ./api/intl-api
# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/intl-api' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend Todo
echo "Uploading Todo"
cd ./api/tasks-api

# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/tasks-api' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend Files
echo "Uploading Files"
cd ./api/files-api

# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/files-api' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend Email
echo "Uploading Email"
cd ./api/email

# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/email' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend Location API
echo "Uploading Location API"
cd ./api/location-api
pnpm run build
# sentry-cli releases new $RELEASE_VERSION
# sentry-cli sourcemaps inject ./dist
# sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/location-api' --validate
# sentry-cli releases finalize $RELEASE_VERSION
pnpm run deploy
cd ../..

# Backend bff-web
echo "Uploading bff-web"
cd ./api/bff-web
pnpm run deploy
cd ../..

# Notify Sentry of new deployment
# sentry-cli releases deploys $RELEASE_VERSION new -e production
