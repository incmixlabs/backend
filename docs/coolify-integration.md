# Coolify Integration with GitHub Actions

This document explains how to set up automatic Coolify deployments triggered by GitHub Actions after successful Docker image builds.

## Overview

The integration automatically triggers Coolify deployments when:
1. Code is pushed to the `testing-cicd` branch
2. Docker images are successfully built and pushed to the registry
3. The service has Coolify deployment enabled

## Prerequisites

1. **Coolify Instance**: A running Coolify instance with your applications configured
2. **GitHub Repository**: Access to this repository with admin permissions
3. **Docker Registry**: Access to push images to your registry

## Setup Steps

### 1. Configure Coolify Applications

For each service you want to deploy, create an application in Coolify:

1. Go to your Coolify dashboard
2. Create a new application for each service (auth, users-api, etc.)
3. Set the deployment type to "Docker Image"
4. Configure the image source to use your registry
5. Set up the webhook endpoint for each application

### 2. Get Coolify Webhook URLs

For each service in Coolify:

1. Go to the application settings
2. Navigate to the "Webhook" section
3. Copy the webhook URL
4. Note the webhook URL for each service

### 3. Create Coolify API Token

1. In Coolify, go to Settings → API
2. Generate a new API token
3. Copy the token (you'll need this for GitHub secrets)

### 4. Configure GitHub Secrets

Add the following secrets to your GitHub repository (`Settings → Secrets and variables → Actions`):

#### Required Secrets

- `COOLIFY_TOKEN`: Your Coolify API token

#### Service-Specific Webhook Secrets

For each service, add a webhook secret:

- `COOLIFY_AUTH_WEBHOOK`: Webhook URL for auth service
- `COOLIFY_USERS_API_WEBHOOK`: Webhook URL for users-api service
- `COOLIFY_PROJECTS_API_WEBHOOK`: Webhook URL for projects-api service
- `COOLIFY_TASKS_API_WEBHOOK`: Webhook URL for tasks-api service
- `COOLIFY_COMMENTS_API_WEBHOOK`: Webhook URL for comments-api service
- `COOLIFY_FILES_API_WEBHOOK`: Webhook URL for files-api service
- `COOLIFY_GENAI_API_WEBHOOK`: Webhook URL for genai-api service
- `COOLIFY_INTL_API_WEBHOOK`: Webhook URL for intl-api service
- `COOLIFY_LOCATION_API_WEBHOOK`: Webhook URL for location-api service
- `COOLIFY_ORG_API_WEBHOOK`: Webhook URL for org-api service
- `COOLIFY_PERMISSIONS_API_WEBHOOK`: Webhook URL for permissions-api service
- `COOLIFY_RXDB_API_WEBHOOK`: Webhook URL for rxdb-api service
- `COOLIFY_BFF_WEB_WEBHOOK`: Webhook URL for bff-web service
- `COOLIFY_EMAIL_WEBHOOK`: Webhook URL for email service
- `COOLIFY_DB_WEBHOOK`: Webhook URL for db service

### 5. Service Configuration

The services are configured in `.github/actions/service-config/services.json`. Each service has a `coolify` section:

```json
{
  "name": "auth",
  "dockerfile": "api/auth/Dockerfile",
  "context": ".",
  "image_name": "auth-service",
  "coolify": {
    "enabled": true,
    "webhook_url": "${{ secrets.COOLIFY_AUTH_WEBHOOK }}"
  }
}
```

To disable Coolify deployment for a service, set `"enabled": false`.

## How It Works

### 1. Change Detection
- The workflow detects which services have changed by analyzing git diffs
- Only services with modifications are selected for building and deployment
- Changes in shared code trigger builds for all services (dependency management)
- Manual workflow dispatch can force build all services if needed

### 2. Docker Build & Push
- Builds Docker images only for changed services
- Pushes images to your registry with appropriate tags
- Uses efficient caching to speed up builds

### 3. Coolify Deployment Trigger
- After successful image push, triggers Coolify deployment
- **Only changed services are deployed to Coolify**
- Uses the service-specific webhook URL
- Authenticates with the Coolify API token
- Sends a GET request to trigger deployment

### 4. Deployment Flow
```
Code Push → Detect Changes → Build Only Changed Services → Push to Registry → Deploy Only Changed Services to Coolify
```

## Change Detection Logic

The workflow uses intelligent change detection to determine which services need to be built and deployed:

### Automatic Detection (Push Events)
- **Service-specific changes**: Only services with code changes are built
  - Changes in `api/auth/` → Build only `auth` service
  - Changes in `api/users-api/` → Build only `users-api` service
  - Changes in `db/` → Build only `db` service

- **Shared code changes**: Changes in `shared/` directory trigger builds for all services
  - This ensures all services get updated dependencies and shared utilities

- **No changes**: If no relevant files changed, no services are built

### Manual Override (Workflow Dispatch)
- **Force build all**: Can manually trigger builds for all services
- **Target branch**: Specify which branch to compare against for change detection

### Change Detection Examples

```bash
# Only auth service changed
git diff HEAD~1 HEAD --name-only
# Output: api/auth/src/index.ts
# Result: Only auth service built and deployed

# Multiple services changed
git diff HEAD~1 HEAD --name-only
# Output: api/auth/src/index.ts api/users-api/src/index.ts
# Result: Both auth and users-api services built and deployed

# Shared code changed
git diff HEAD~1 HEAD --name-only
# Output: shared/utils/helper.ts
# Result: All services built and deployed (dependency management)

# No relevant changes
git diff HEAD~1 HEAD --name-only
# Output: README.md docs/example.md
# Result: No services built or deployed
```

## Workflow Triggers

The workflow runs on:
- **Push to `testing-cicd` branch**: Automatic build and deploy
- **Manual workflow dispatch**: Force build all services

## Monitoring

### GitHub Actions
- Check the Actions tab for build and deployment status
- View logs for each step in the workflow

### Coolify Dashboard
- Monitor deployment progress in your Coolify dashboard
- Check application logs and status

## Troubleshooting

### Common Issues

1. **Webhook Authentication Failed**
   - Verify `COOLIFY_TOKEN` secret is correct
   - Check token permissions in Coolify

2. **Webhook URL Not Found**
   - Verify webhook URLs are correct for each service
   - Check if applications exist in Coolify

3. **Deployment Not Triggered**
   - Ensure service has `"enabled": true` in configuration
   - Check if image was successfully pushed
   - Verify webhook endpoint is accessible

### Debug Steps

1. Check GitHub Actions logs for error messages
2. Verify secrets are properly configured
3. Test webhook URLs manually with curl
4. Check Coolify application logs

## Manual Testing

Test the webhook manually:

```bash
curl --request GET "YOUR_WEBHOOK_URL" \
  --header "Authorization: Bearer YOUR_COOLIFY_TOKEN" \
  --header "Content-Type: application/json"
```

## Security Considerations

1. **API Token**: Keep your Coolify API token secure
2. **Webhook URLs**: Don't expose webhook URLs in public repositories
3. **Access Control**: Limit who can trigger deployments
4. **Audit Logs**: Monitor deployment activities

## Customization

### Modify Deployment Conditions
Edit the workflow to change when deployments are triggered:

```yaml
- name: Trigger Coolify deployment
  if: ${{ github.event_name != 'pull_request' && fromJSON(steps.service-config.outputs.config).coolify.enabled == true }}
```

### Add Deployment Notifications
Extend the workflow to send notifications to Slack, Discord, or other platforms.

### Conditional Deployments
Add logic to only deploy on specific conditions (e.g., production tags, specific branches).

## Support

For issues with:
- **GitHub Actions**: Check workflow logs and GitHub documentation
- **Coolify**: Refer to Coolify documentation and support channels
- **Integration**: Review this documentation and configuration files
