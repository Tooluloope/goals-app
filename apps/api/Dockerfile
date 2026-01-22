FROM node:18-bullseye-slim AS base

WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @goals/shared build \
  && pnpm --filter @goals/database build \
  && pnpm --filter @goals/database db:generate \
  && pnpm --filter @goals/api build

FROM node:18-bullseye-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/api/dist /app/apps/api/dist
COPY --from=base /app/apps/api/package.json /app/apps/api/package.json
COPY --from=base /app/packages/database /app/packages/database
COPY --from=base /app/packages/shared /app/packages/shared

EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
