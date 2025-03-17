#!/bin/bash
set -e

# Run all deployments in parallel and capture their output
fly deploy --config fly.incmix-auth.toml 2>&1 | sed 's/^/[auth] /' &
fly deploy --config fly.incmix-bff-web.toml 2>&1 | sed 's/^/[bff-web] /' &
fly deploy --config fly.incmix-intl.toml 2>&1 | sed 's/^/[intl] /' &
fly deploy --config fly.incmix-email.toml 2>&1 | sed 's/^/[email] /' &
fly deploy --config fly.incmix-files.toml 2>&1 | sed 's/^/[files] /' &
fly deploy --config fly.incmix-location.toml 2>&1 | sed 's/^/[location] /' &
fly deploy --config fly.incmix-org.toml 2>&1 | sed 's/^/[org] /' &
fly deploy --config fly.incmix-tasks.toml 2>&1 | sed 's/^/[tasks] /' &
fly deploy --config fly.incmix-users.toml 2>&1 | sed 's/^/[users] /' &

# Wait for all background processes to complete
wait

# fly secrets import -a auth-incmix-api < ./api/auth/.env --stage
# fly secrets import -a email-incmix-api < ./api/email/.env --stage
# fly secrets import -a files-incmix-api < ./api/files-api/.env --stage
# fly secrets import -a location-incmix-api < ./api/location-api/.env --stage

# fly postgres attach --app auth-incmix-api incmix-auth-db
# fly postgres attach --app intl-incmix-api incmix-intl-db
# fly postgres attach --app email-incmix-api incmix-email-db
# fly postgres attach --app org-incmix-api incmix-org-db
# fly postgres attach --app tasks-incmix-api incmix-tasks-db
# fly postgres attach --app users-incmix-api incmix-users-db


# # Sentry Diabled

# # Install Sentry cli
# # curl -sL https://sentry.io/get-cli/ | sh
# # # Set release version
# # RELEASE_VERSION=$(sentry-cli releases propose-version)

# # Backend Auth
# echo "Uploading Auth"
# cd ./api/auth
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/auth' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend Users
# echo "Uploading Users"
# cd ./api/users-api
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/users-api' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend Org
# echo "Uploading Org"
# cd ./api/org-api
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/org-api' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend Intl
# echo "Uploading Intl"
# cd ./api/intl-api
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/intl-api' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend Todo
# echo "Uploading Todo"
# cd ./api/tasks-api
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/tasks-api' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend Files
# echo "Uploading Files"
# cd ./api/files-api
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/files-api' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend Email
# echo "Uploading Email"
# cd ./api/email
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/email' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend Location API
# echo "Uploading Location API"
# cd ./api/location-api
# pnpm run build --env prev
# # sentry-cli releases new $RELEASE_VERSION
# # sentry-cli sourcemaps inject ./dist
# # sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist --url-prefix '~/dist/location-api' --validate
# # sentry-cli releases finalize $RELEASE_VERSION
# pnpm run deploy --env prev
# cd ../..

# # Backend bff-web
# echo "Uploading bff-web"
# cd ./api/bff-web
# pnpm run deploy --env prev
# cd ../..

# # Notify Sentry of new deployment
# # sentry-cli releases deploys $RELEASE_VERSION new -e production
