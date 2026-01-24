# Slipplane Deployment Guide

This guide explains how to deploy the Goals App to Slipplane using GitHub Container Registry.

## Prerequisites

1. GitHub repository with the Goals App code
2. Slipplane account
3. PostgreSQL database (can be provisioned via Slipplane or external)

## Step 1: Enable GitHub Container Registry

The GitHub Actions workflow automatically builds and pushes images on every push to `main`.

### Make Package Public (Optional)

By default, GHCR packages are private. To make them accessible to Slipplane:

1. Go to your GitHub repo → Packages
2. Click on each package (api, web)
3. Package Settings → Change visibility to Public

Or, add Slipplane's registry credentials in Slipplane dashboard.

## Step 2: Image URLs

After the first successful build, your images will be available at:

```
ghcr.io/<your-username>/goals-app-api:latest
ghcr.io/<your-username>/goals-app-web:latest
```

The scheduler uses the same API image with different environment variables.

## Step 3: Create Services in Slipplane

### Service 1: PostgreSQL Database

- **Option A**: Use Slipplane's managed PostgreSQL
- **Option B**: Use external database (Neon, Supabase, Railway, etc.)

Note the connection string: `postgresql://user:password@host:5432/dbname`

### Service 2: API Service

| Setting      | Value                                          |
| ------------ | ---------------------------------------------- |
| Image        | `ghcr.io/<your-username>/goals-app-api:latest` |
| Port         | `3001`                                         |
| Health Check | `/api/health/live`                             |
| Replicas     | 1-2                                            |

**Environment Variables:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_HOST=<db-host>
DB_PORT=5432
API_PORT=3001
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-web-domain.com
ENABLE_SCHEDULER=false
RESEND_API_KEY=<optional>
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Goals App
ANTHROPIC_API_KEY=<optional-for-ai-features>
```

### Service 3: Scheduler Service

| Setting      | Value                                          |
| ------------ | ---------------------------------------------- |
| Image        | `ghcr.io/<your-username>/goals-app-api:latest` |
| Port         | `3001` (internal only)                         |
| Health Check | `/api/health/live`                             |
| Replicas     | **1** (important: only 1 replica)              |

**Environment Variables:**

Same as API, but with:

```env
ENABLE_SCHEDULER=true
```

### Service 4: Web Service

| Setting      | Value                                          |
| ------------ | ---------------------------------------------- |
| Image        | `ghcr.io/<your-username>/goals-app-web:latest` |
| Port         | `3000`                                         |
| Health Check | `/`                                            |
| Replicas     | 1-2                                            |

**Environment Variables:**

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Step 4: Configure Build Arguments

The web image needs `NEXT_PUBLIC_API_URL` at build time. You can either:

### Option A: Set in GitHub Actions

1. Go to your repo → Settings → Secrets and variables → Actions
2. Add a **Variable** (not secret): `NEXT_PUBLIC_API_URL` = `https://your-api-domain.com`

### Option B: Rebuild After Knowing API URL

1. Deploy API first, note the URL
2. Update GitHub Actions variable
3. Trigger rebuild: Push to main or use workflow_dispatch

## Step 5: Database Migrations

Migrations run automatically on API container start via the entrypoint script.

For manual migrations:

```bash
docker exec <api-container> npx prisma migrate deploy
```

## Step 6: Custom Domain Setup

1. In Slipplane, go to each service
2. Add custom domain
3. Configure DNS records as instructed
4. Enable HTTPS

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Web Service   │
                    │   (Next.js)     │
                    │   Port 3000     │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────┐
│                API Service                   │
│            (NestJS, Port 3001)               │
│         ENABLE_SCHEDULER=false               │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌───────────┐  ┌───────────┐  ┌───────────────┐
│ PostgreSQL│  │  Resend   │  │ Scheduler Svc │
│    DB     │  │  (Email)  │  │ ENABLE_SCHEDULER│
│           │  │           │  │     =true      │
└───────────┘  └───────────┘  └───────────────┘
```

## Troubleshooting

### Images not pulling

1. Ensure packages are public, or
2. Add registry credentials in Slipplane

### CORS errors

Update `CORS_ORIGIN` to match your web domain exactly (including https://).

For multiple origins, set `CORS_ALLOW_ALL=true` (not recommended for production).

### Database connection issues

1. Verify `DATABASE_URL` format
2. Check if database allows external connections
3. Verify network/firewall rules

### Health check failing

1. Wait for initial startup (up to 60 seconds)
2. Check logs for migration errors
3. Verify database connectivity

## Updating Deployments

When you push to `main`:

1. GitHub Actions builds new images
2. Images are tagged with `:latest` and `:sha-<commit>`
3. In Slipplane, either:
   - Enable auto-deploy on image update
   - Manually redeploy with latest image

## Secrets Management

**Required secrets:**

- `JWT_SECRET` - Generate with: `openssl rand -base64 64`
- `DATABASE_URL` - Your PostgreSQL connection string

**Optional secrets:**

- `RESEND_API_KEY` - For email functionality
- `ANTHROPIC_API_KEY` - For AI features

Store these securely in Slipplane's environment variables.
