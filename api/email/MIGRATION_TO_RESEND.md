# Migration from SendGrid to Resend

This document outlines the complete migration of the email API from SendGrid to Resend.

## Overview

The email API has been successfully migrated from SendGrid to Resend, providing a more modern and developer-friendly email service.

## Changes Made

### 1. Package Dependencies

**Removed:**
- `@sendgrid/eventwebhook@8.0.0`

**Added:**
- `resend@^3.1.0`

### 2. Environment Variables

**Before (SendGrid):**
```bash
SENDGRID_API_KEY="example-sendgrid-api-key"
SENDGRID_WEBHOOK_KEY="example-sendgrid-webhook-key"
```

**After (Resend):**
```bash
RESEND_API_KEY="example-resend-api-key"
```

### 3. Code Changes

#### Environment Variables (`src/env-vars.ts`)
- Replaced `SENDGRID_API_KEY` with `RESEND_API_KEY`
- Removed `SENDGRID_WEBHOOK_KEY`

#### Email Sending Utility (`src/lib/utils.ts`)
- Replaced SendGrid REST API calls with Resend SDK
- Updated response handling to match expected interface
- Added proper error handling for Resend operations

#### Email Helper (`src/lib/helper.ts`)
- Updated function parameter from `SENDGRID_API_KEY` to `RESEND_API_KEY`

#### Email Routes (`src/routes/email/index.ts`)
- Updated to use `envVars.RESEND_API_KEY`
- Updated database field from `sgId` to `resendId`

#### Health Check Routes (`src/routes/healthcheck/index.ts`)
- Updated environment variable references

#### Webhook Routes (`src/routes/webhook/index.ts`)
- Replaced SendGrid webhook handling with Resend webhook structure
- Updated database field references
- Added Resend webhook signature verification utility

### 4. Database Schema Changes

#### New Migration Files Created:
- `db/api-migrations/006.do.email-resend-migration.sql`
- `db/api-migrations/006.undo.email-resend-migration.sql`

#### Schema Updates:
- `sg_id` → `resend_id`
- `sendgrid_data` → `resend_data`

### 5. Configuration Files

#### Root `.env.example`
- Updated email service environment variables

#### `docker-compose-prod.yml`
- Updated email service environment variables

#### `README.md`
- Updated email service reference from `sendgrid.com` to `resend.com`

### 6. New Utilities

#### Webhook Verification (`src/lib/webhook-verification.ts`)
- Created utility for verifying Resend webhook signatures using HMAC-SHA256

## Migration Steps

### 1. Update Environment Variables
```bash
# Remove old SendGrid variables
unset SENDGRID_API_KEY
unset SENDGRID_WEBHOOK_KEY

# Add new Resend variable
export RESEND_API_KEY="your-resend-api-key"
```

### 2. Install Dependencies
```bash
cd api/email
pnpm install
```

### 3. Run Database Migration
```bash
# Apply the migration
psql -h localhost -p 54321 -U postgres -d incmix -f db/api-migrations/006.do.email-resend-migration.sql
```

### 4. Update Configuration Files
- Copy `.env.example` to `.env` in the email API directory
- Update `RESEND_API_KEY` with your actual Resend API key

## Resend Setup

### 1. Create Resend Account
- Sign up at [resend.com](https://resend.com)

### 2. Get API Key
- Navigate to API Keys in your Resend dashboard
- Create a new API key
- Copy the key to your environment variables

### 3. Configure Domain (Optional)
- Add and verify your domain in Resend dashboard
- Update the `from` email address in your configuration

## Webhook Configuration

### 1. Set Up Webhook Endpoint
- Configure webhook URL in Resend dashboard: `https://your-domain.com/api/email/webhook`
- Copy the webhook secret to your environment variables

### 2. Webhook Events
Resend supports the following webhook events:
- `email.delivered` - Email successfully delivered
- `email.delivery_delayed` - Email delivery delayed
- `email.bounced` - Email bounced
- `email.complained` - Email marked as spam

## Testing

### 1. Test Email Sending
```bash
# Start the email API
cd api/email
pnpm dev

# Test with a sample request
curl -X POST http://localhost:8989/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "test@example.com",
    "body": {
      "template": "VerificationEmail",
      "payload": {
        "verificationLink": "https://example.com/verify"
      }
    },
    "requestedBy": "user-id"
  }'
```

### 2. Test Webhook (Optional)
- Use a tool like ngrok to expose your local webhook endpoint
- Configure the webhook URL in Resend dashboard
- Send a test email to trigger webhook events

## Rollback Plan

If you need to rollback to SendGrid:

### 1. Revert Database Schema
```bash
psql -h localhost -p 54321 -U postgres -d incmix -f db/api-migrations/006.undo.email-resend-migration.sql
```

### 2. Revert Code Changes
- Restore SendGrid dependencies in `package.json`
- Revert all code changes to use SendGrid
- Restore environment variables

### 3. Reinstall Dependencies
```bash
cd api/email
pnpm install
```

## Benefits of Resend

1. **Modern API**: Clean, RESTful API with excellent TypeScript support
2. **Better Deliverability**: Advanced email infrastructure and reputation management
3. **Developer Experience**: Better SDK, documentation, and developer tools
4. **Cost Effective**: Competitive pricing for high-volume email sending
5. **Webhook Support**: Real-time delivery status updates
6. **Analytics**: Built-in email analytics and tracking

## Support

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend Webhooks](https://resend.com/docs/webhooks)


