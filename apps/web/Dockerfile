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

# Ensure public dir exists for standalone copy (Next allows no public/ dir)
RUN mkdir -p /app/apps/web/public

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies and build
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @goals/shared build && \
    pnpm --filter email-templates build && \
    pnpm --filter @goals/web build

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
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build
# Note: In monorepo, standalone preserves the apps/web/ path structure
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
# Monorepo standalone output places server.js at apps/web/server.js
CMD ["node", "apps/web/server.js"]
