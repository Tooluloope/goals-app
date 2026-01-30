# Environment Variables Structure

This document describes the environment variable organization for the Alignia monorepo.

## Overview

Environment variables are organized by app, with each service having its own `.env` file:

```
.
├── .env                          # Shared config (database only)
├── .env.example                  # Template for shared config
├── .env.prod.example             # Production template for shared config
├── apps/
│   ├── api/
│   │   ├── .env                  # API environment variables (gitignored)
│   │   ├── .env.example          # API template for development
│   │   └── .env.prod.example     # API template for production
│   ├── web/
│   │   ├── .env                  # Web app environment variables (gitignored)
│   │   ├── .env.example          # Web app template for development
│   │   └── .env.prod.example     # Web app template for production
│   └── marketing/
│       ├── .env                  # Marketing site environment variables (gitignored)
│       ├── .env.example          # Marketing template for development
│       └── .env.prod.example     # Marketing template for production
└── ENV_MIGRATION_GUIDE.md        # Migration guide from old structure
```

## Configuration Files

### Root Level

#### `.env` (gitignored)

Contains shared database configuration used by all services:

- `DATABASE_URL` - PostgreSQL connection string
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` - Database credentials

#### `.env.example`

Template for local development setup with instructions.

#### `.env.prod.example`

Template for production deployment with shared database credentials.

### API Service (`apps/api/`)

#### `.env` (gitignored)

Backend API configuration:

- **Database**: DATABASE_URL
- **Server**: API_PORT, NODE_ENV, CORS_ORIGIN, CORS_ALLOW_ALL
- **Authentication**: JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, NEXTAUTH_SECRET
- **Email**: RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME, APP_LOGO_URL
- **AI**: ANTHROPIC_API_KEY, ANTHROPIC_MODEL, AI_MAX_TOKENS
- **Stripe**: STRIPE*SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE*\*\_PRICE_ID, TRIAL_PERIOD_DAYS
- **Scheduler**: ENABLE_SCHEDULER
- **App URLs**: NEXT_PUBLIC_APP_URL (for email links)

### Web App (`apps/web/`)

#### `.env` (gitignored)

Frontend web application configuration:

- **API**: NEXT_PUBLIC_API_URL
- **App URLs**: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_MARKETING_URL
- **Authentication**: NEXTAUTH_SECRET, NEXTAUTH_URL
- **Stripe**: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

### Marketing Site (`apps/marketing/`)

#### `.env` (gitignored)

Marketing website configuration:

- **App URLs**: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL

## Quick Start

### Local Development

1. Copy all example files:

   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   cp apps/marketing/.env.example apps/marketing/.env
   ```

2. Configure each file with your local values

3. Start services:
   ```bash
   docker compose up -d postgres  # Start database
   pnpm dev                       # Start all apps
   ```

### Production Deployment

1. Copy production templates:

   ```bash
   cp apps/api/.env.prod.example apps/api/.env
   cp apps/web/.env.prod.example apps/web/.env
   cp apps/marketing/.env.prod.example apps/marketing/.env
   ```

2. Fill in production values (see templates for required variables)

3. Deploy with Docker Compose:
   ```bash
   docker compose -f docker-compose.prod.yml up --build
   ```

Or set environment variables directly in your deployment platform (Slipplane, Railway, Render, etc.)

## Docker Compose Integration

Both `docker-compose.yml` and `docker-compose.prod.yml` use `env_file` directives to load app-specific variables:

```yaml
services:
  api:
    env_file:
      - apps/api/.env
    environment:
      # Docker-specific overrides (e.g., DATABASE_URL with container hostname)
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/goals_db

  web:
    env_file:
      - apps/web/.env
    environment:
      # Docker-specific overrides
      NEXT_PUBLIC_API_URL: http://api:3001

  marketing:
    env_file:
      - apps/marketing/.env
```

## CI/CD Integration

### GitHub Actions

The CI workflow uses a minimal DATABASE_URL for Prisma client generation:

```yaml
- name: Generate Prisma Client
  env:
    DATABASE_URL: 'postgresql://user:password@localhost:5432/db'
```

### Docker Builds

Build args are passed for Next.js public variables:

```yaml
build:
  args:
    NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }}
    NEXT_PUBLIC_APP_URL: ${{ vars.NEXT_PUBLIC_APP_URL }}
```

## Best Practices

1. **Never commit actual `.env` files** - only `.env.example` templates
2. **Keep secrets in `.env` files** - never hardcode in code
3. **Use different values for dev/prod** - especially for API keys, database URLs
4. **Document all variables** - add comments to `.env.example` files
5. **Validate on startup** - each app should validate required env vars exist

## Shared Variables

Some variables must be consistent across services:

- **NEXTAUTH_SECRET** - Must be identical in `api/.env` and `web/.env`
- **NEXT_PUBLIC_APP_URL** - Should be the same across all services (the web app URL)
- **Database credentials** - API and Scheduler use the same database

## Environment Variable Loading

### Next.js Apps (web, marketing)

- Loads `.env` from app directory automatically
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-side only

### NestJS API

- Uses `@nestjs/config` with `ConfigModule`
- Loads `.env` from `apps/api/` directory
- Access via `ConfigService.get()`

### Prisma (database)

- Requires `DATABASE_URL` for migrations and queries
- Can load from root `.env` or `apps/api/.env`
- Used by API and Scheduler services

## Troubleshooting

See [ENV_MIGRATION_GUIDE.md](./ENV_MIGRATION_GUIDE.md) for common issues and solutions.

## Security Notes

- All actual `.env` files are in `.gitignore`
- Production secrets should be managed by your deployment platform
- Use strong, randomly generated secrets for JWT_SECRET and NEXTAUTH_SECRET
- Rotate API keys regularly
- Use separate Stripe keys for test/production
