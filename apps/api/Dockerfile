# syntax=docker/dockerfile:1

# ====================
# Base stage
# ====================
FROM node:18-bullseye-slim AS base
WORKDIR /app

# Install dependencies for native modules and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    netcat-openbsd \
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

# Dummy DATABASE_URL for prisma generate (not used for actual connection)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Install dependencies and build
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @goals/shared build && \
    pnpm --filter @goals/database build && \
    pnpm --filter @goals/database db:generate && \
    pnpm --filter @goals/api build

# ====================
# Production stage
# ====================
FROM node:18-bullseye-slim AS runner
WORKDIR /app

# Install runtime dependencies (wget for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    netcat-openbsd \
    tini \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs api

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

# Copy built artifacts
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set ownership
RUN chown -R api:nodejs /app

USER api

EXPOSE 3001

# Use tini as init system for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--", "/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/main"]
