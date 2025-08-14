# 🚀 Coolify Integration - Quick Setup

This repository is configured to automatically deploy to Coolify after successful Docker image builds.

## ⚡ Quick Start

### 1. Add GitHub Secrets

Go to `Settings → Secrets and variables → Actions` and add:

- `COOLIFY_TOKEN`: Your Coolify API token
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

### 2. Configure Coolify Applications

For each service, create a Coolify application:
- Set deployment type to "Docker Image"
- Configure image source from your registry
- Get the webhook URL from the application settings

### 3. Push to Deploy

Push code to the `testing-cicd` branch to trigger automatic builds and deployments.

## 🔧 How It Works

1. **Code Push** → GitHub Actions detects which services have changed
2. **Build Images** → Docker images built and pushed to registry (only for changed services)
3. **Trigger Deployment** → Coolify webhook called automatically (only for changed services)
4. **Deploy** → Coolify pulls and deploys only the new images

## 🎯 Change Detection

The system automatically detects which services need updates:

- **Service-specific changes**: Only modified services are built and deployed
- **Shared code changes**: All services are updated when shared utilities change
- **Manual override**: Force build all services when needed
- **Smart caching**: Efficient builds using Docker layer caching

## 📚 Documentation

- [Full Setup Guide](docs/coolify-integration.md)
- [Change Detection Details](docs/coolify-integration.md#change-detection-logic)

## 🧪 Testing

Test webhooks manually:

```bash
# Set your token
export COOLIFY_TOKEN=your_token_here

# Test a specific service
./scripts/test-coolify-webhooks.sh auth https://coolify.example.com/webhook/auth
```

## 🚨 Troubleshooting

- Check GitHub Actions logs for build status
- Verify webhook URLs and API token
- Test webhooks manually with the test script
- Check Coolify dashboard for deployment status

## 📝 Notes

- Deployments only trigger on pushes (not pull requests)
- Each service can be individually enabled/disabled
- Webhook URLs are stored as GitHub secrets for security
