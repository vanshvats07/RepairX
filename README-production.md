# RepairX Production Deployment Guide

## 1. Required environment variables

Copy `.env.example` or `.env.local.example` to a local environment file and fill in the required values before running the app.

Required values for production:

- `MONGODB_URI`
- `JWT_SECRET`
- `AI_API_KEY` if AI features are enabled
- `SERPAPI_API_KEY` if live search is enabled
- `NEXT_PUBLIC_APP_URL`
- `APP_ENV=production`

Do not expose any sensitive values through a `NEXT_PUBLIC_` variable. Keep database URLs, JWT secrets, search keys, and AI credentials server-only.

## 2. Local setup

1. Install dependencies: `npm install`
2. Copy `.env.local.example` to `.env.local`
3. Fill in the required values
4. Start MongoDB locally or connect to MongoDB Atlas
5. Run: `npm run dev`

## 3. Production build

```bash
npm run build
npm run start
```

## 4. Health checks

- `GET /api/health` returns application status
- `GET /api/health/ready` should be added in production environments if a deeper readiness check is needed

## 5. Secret management

- Store secrets in the deployment platform environment store
- Never commit `.env*` files
- Rotate any compromised secret immediately

## 6. Backup and recovery

Use your MongoDB deployment provider’s backup feature. For production-critical data, keep automated backups and a tested restore procedure.

## 7. Rollback notes

- Keep the previous production build artifact available
- Keep the last known-good environment configuration file
- Validate MongoDB connectivity before switching traffic

## 8. Common failure modes

- Missing `MONGODB_URI` → app falls back to degraded mode
- Missing `JWT_SECRET` → authentication fails
- Missing `SERPAPI_API_KEY` → live search becomes unavailable but the app should still function in degraded mode
- Invalid environment values → fail fast in production
