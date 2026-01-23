# E2E tests (Playwright)

## Setup

1. Install browsers (one-time):
   ```bash
   pnpm --filter e2e install:browsers
   ```
2. Export credentials for a test user (must exist in your backend):
   ```bash
   export E2E_USER_EMAIL="tester@example.com"
   export E2E_USER_PASSWORD="pass1234"
   export E2E_BASE_URL="http://localhost:3008" # optional, defaults to local dev port
   ```

## Run

```bash
pnpm --filter e2e test          # headless
pnpm --filter e2e test:headed   # headed/debug
```

## What tests do

- `auth.spec.ts` ensures login page renders and, when creds are provided, the dashboard loads.
- `rhythm.spec.ts` opens /rhythm and checks the habit tracker shell.
- `ai.spec.ts` opens /ai (or /ai2) and verifies the page renders insight prompts.

Tests that require auth auto-skip when `E2E_USER_EMAIL/PASSWORD` are not set.
They use your local web/api stack and the DB those point to (via `.env.local` / `.env`).

## Codegen helper

Use Playwright codegen to record flows:

```bash
pnpm --filter e2e codegen
```

## Storage state

Global setup logs in once (when creds are set) and saves cookies/session to `storageStates/auth.json` for faster tests.
