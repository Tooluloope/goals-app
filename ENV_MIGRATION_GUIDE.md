# Environment Variables Migration Guide

This guide helps you migrate from the old centralized `.env` file to the new app-specific environment configuration.

## What Changed?

### Before (Old Structure)

```
.env                    # All environment variables in one file
.env.prod.example       # Production example with all variables
```

### After (New Structure)

```
.env                    # Shared database config only
apps/api/.env           # API-specific environment variables
apps/web/.env           # Web app-specific environment variables
apps/marketing/.env     # Marketing site-specific environment variables
```

## Why This Change?

1. **Separation of Concerns**: Each app only loads the environment variables it needs
2. **Clearer Configuration**: Easier to understand which variables belong to which service
3. **Better for Deployment**: Deploy services independently with their own configs
4. **Reduced Errors**: Prevents accidentally using wrong variables across services

## Migration Steps

### For Local Development

1. **Backup your existing `.env` file**:

   ```bash
   cp .env .env.backup
   ```

2. **Create app-specific `.env` files from examples**:

   ```bash
   # Copy app-specific examples
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   cp apps/marketing/.env.example apps/marketing/.env

   # Update root .env to only contain database config
   cp .env.example .env
   ```

3. **Migrate variables from your old `.env` to the new files**:

   #### For `apps/api/.env`:
   - DATABASE_URL
   - API_PORT
   - NODE_ENV
   - CORS_ORIGIN
   - CORS_ALLOW_ALL
   - JWT_SECRET
   - JWT_EXPIRES_IN
   - JWT_REFRESH_EXPIRES_IN
   - NEXTAUTH_SECRET
   - RESEND_API_KEY
   - EMAIL_FROM
   - EMAIL_FROM_NAME
   - NEXT_PUBLIC_APP_URL (for email links)
   - APP_LOGO_URL
   - ANTHROPIC_API_KEY
   - ANTHROPIC_MODEL
   - AI_MAX_TOKENS
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_FREE_PRICE_ID
   - STRIPE_PRO_PRICE_ID
   - STRIPE_FAMILY_PRICE_ID
   - TRIAL_PERIOD_DAYS
   - ENABLE_SCHEDULER

   #### For `apps/web/.env`:
   - NEXT_PUBLIC_API_URL
   - NEXT_PUBLIC_APP_URL
   - NEXT_PUBLIC_MARKETING_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

   #### For `apps/marketing/.env`:
   - NEXT_PUBLIC_APP_URL
   - NEXT_PUBLIC_SITE_URL

   #### For root `.env` (shared):
   - DATABASE_URL
   - DB_USER
   - DB_PASSWORD
   - DB_NAME
   - DB_PORT

4. **Verify the configuration**:

   ```bash
   # Start database
   docker compose up -d postgres

   # Run database migrations
   pnpm --filter @goals/database db:migrate

   # Start all services
   pnpm dev
   ```

### For Docker Compose Deployments

1. **Backup existing configuration**:

   ```bash
   cp docker-compose.prod.yml docker-compose.prod.yml.backup
   cp .env.prod .env.prod.backup
   ```

2. **Create app-specific production env files**:

   ```bash
   cp apps/api/.env.prod.example apps/api/.env
   cp apps/web/.env.prod.example apps/web/.env
   cp apps/marketing/.env.prod.example apps/marketing/.env
   ```

3. **Migrate variables** from your old `.env.prod` to the new app-specific files (see variable lists above)

4. **Update docker-compose.prod.yml**:
   The updated `docker-compose.prod.yml` now includes `env_file` directives:

   ```yaml
   api:
     env_file:
       - apps/api/.env
     environment:
       DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/goals_db
       ...
   ```

5. **Test the new configuration**:
   ```bash
   docker compose -f docker-compose.prod.yml config
   docker compose -f docker-compose.prod.yml up --build
   ```

### For Slipplane/Cloud Deployments

1. **Update environment variables in your deployment platform**:

   #### API Service
   - Set all variables from `apps/api/.env.prod.example`
   - Ensure DATABASE_URL points to your production database

   #### Web Service
   - Set all variables from `apps/web/.env.prod.example`
   - Ensure NEXT_PUBLIC_API_URL points to your API service

   #### Marketing Service
   - Set all variables from `apps/marketing/.env.prod.example`
   - Ensure NEXT_PUBLIC_APP_URL points to your web app

   #### Scheduler Service (if using)
   - Use same variables as API service
   - Set ENABLE_SCHEDULER=true

2. **No code changes required** - the services will automatically use the new structure

## Backwards Compatibility

The root `.env` file still works for database configuration during local development. However, app-specific variables should now be placed in their respective app directories.

## Troubleshooting

### "Environment variable not found"

- Check that you've created all three app-specific `.env` files
- Verify variables are in the correct file for each app

### "Database connection failed"

- Ensure DATABASE_URL is set in both root `.env` and `apps/api/.env`
- For Docker, DATABASE_URL should use the container hostname (`postgres:5432`)

### "NEXTAUTH_SECRET mismatch"

- NEXTAUTH_SECRET must be the same in both `apps/api/.env` and `apps/web/.env`

### Docker builds failing

- Ensure all three app-specific `.env` files exist before running docker compose
- Check that paths in `docker-compose.yml` match: `apps/api/.env`, `apps/web/.env`, `apps/marketing/.env`

## Need Help?

- Check the `.env.example` files in each app directory for required variables
- See [STRIPE_IMPLEMENTATION.md](./STRIPE_IMPLEMENTATION.md) for Stripe-specific configuration
- Review app-specific README files (if they exist)

## Rollback Instructions

If you need to rollback to the old structure:

1. Restore your backup:

   ```bash
   cp .env.backup .env
   cp docker-compose.prod.yml.backup docker-compose.prod.yml
   ```

2. Remove app-specific env files (optional):

   ```bash
   rm apps/api/.env apps/web/.env apps/marketing/.env
   ```

3. Restart services with the old configuration
