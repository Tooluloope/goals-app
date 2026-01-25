# syntax=docker/dockerfile:1

# ====================
# Base stage
# ====================
FROM node:18-bullseye-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# ====================
# Builder stage
# ====================
FROM base AS builder
WORKDIR /app

# Copy all files
COPY . .

# Ensure public dir exists for standalone copy
RUN mkdir -p /app/apps/marketing/public

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies and build
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @goals/marketing build

# ====================
# Production stage
# ====================
FROM node:18-bullseye-slim AS runner
WORKDIR /app

# Install wget for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# Copy standalone build
COPY --from=builder /app/apps/marketing/public ./apps/marketing/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/marketing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/marketing/.next/static ./apps/marketing/.next/static

USER nextjs

EXPOSE 3002

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/marketing/server.js"]
