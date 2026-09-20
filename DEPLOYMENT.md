# RepairX Deployment Guide

## 1. Prerequisites

- Node.js 20+
- MongoDB Atlas or self-managed MongoDB
- A configured deployment environment for staging and production
- An external secret store for server-side credentials
- A reverse proxy or platform-level TLS termination if required

## 2. Environment configuration

Create environment variables from [.env.example](.env.example) and never commit secret values to the repo.

Key provider variables:

- PAYMENT_PROVIDER, PAYMENT_API_KEY, PAYMENT_WEBHOOK_SECRET
- EMAIL_PROVIDER, EMAIL_API_KEY
- SMS_PROVIDER, SMS_API_KEY
- WHATSAPP_PROVIDER, WHATSAPP_API_KEY
- STORAGE_PROVIDER, STORAGE_BUCKET
- LOGISTICS_PROVIDER, LOGISTICS_API_KEY
- AI_PROVIDER, AI_API_KEY
- SERPAPI_API_KEY
- MONGODB_URI
- JWT_SECRET / SESSION_SECRET
- APP_ENV, APP_NAME, APP_URL / NEXT_PUBLIC_APP_URL

### Mandatory vs optional

Mandatory for core product operation:

- MONGODB_URI
- JWT_SECRET / SESSION_SECRET
- APP_ENV / APP_NAME

Optional but feature-specific:

- PAYMENT_PROVIDER for checkout and payment confirmation
- AI_PROVIDER for LLM-based investigations
- SERPAPI_API_KEY for live discovery and external intelligence
- EMAIL_PROVIDER for transactional email
- STORAGE_PROVIDER for file upload and evidence storage
- LOGISTICS_PROVIDER for real pickup/delivery workflow
- SMS_PROVIDER / WHATSAPP_PROVIDER for messaging

### Staging / sandbox guidance

- Use official sandbox credentials in staging for payment and logistics when available.
- Do not mix production and sandbox credentials in the same environment.
- Keep production secrets in a server-only secret store.

## 3. Provider health and readiness

The application reports provider status through /api/health and /api/ready without exposing secrets.

Status is one of:

- CONFIGURED
- NOT_CONFIGURED
- DEGRADED

Production deployment should treat provider degradation as a feature risk, not a silent success.

## 3. Build and start

```bash
npm install
npm run build
npm run start
```

For local development:

```bash
npm run dev
```

## 4. Health and readiness checks

- GET /api/health
- GET /api/ready

These endpoints report application liveness and dependency readiness without exposing secrets.

## 5. Database readiness

- MongoDB must be reachable from the application runtime
- Connection settings must be configured in the environment
- Database must support indexes for query-heavy entity lookups
- Backups must be enabled by the infrastructure provider

## 6. Backup checklist

Internal operational state:

- DATABASE_BACKUP_CONFIGURED
- DATABASE_RESTORE_TESTED
- DATABASE_ACCESS_RESTRICTED

If any of these are not true, the deployment must be marked PARTIAL or NOT_READY.

## 7. Rollback procedure

1. Keep the last known-good build artifact
2. Restore the previous environment variables from the deployment platform
3. Roll back the application version
4. Validate /health and /ready
5. Validate customer routes and authentication
6. Inspect MongoDB connectivity and recent audit logs

## 8. Incident procedure

- Confirm whether the issue is app-level, dependency-level, or database-level
- Check /health and /ready
- Check MongoDB connectivity and recent API errors
- Review requestId values in logs
- Disable or pause external integrations when the app cannot safely proceed
- Notify the pilot operator and preserve evidence before making changes

## 9. Production notes

- Keep production secrets server-only
- Do not expose private data in client bundles
- Keep the app in pilot-mode access control until the operator approves broader rollout
- Treat AI and SerpAPI as degraded dependencies, not core truth layers
