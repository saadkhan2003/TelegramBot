# ==============================================================================
# Telegram Digital Store - Unified Multi-Stage Production Dockerfile (Dokploy Ready)
# ==============================================================================

FROM node:20-alpine AS base
WORKDIR /app

# Install native dependencies required by Prisma and bcrypt on Alpine
RUN apk add --no-cache openssl libc6-compat python3 make g++

# Enable and configure pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy all package manifests for caching dependency resolution
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY packages/inventory/package.json ./packages/inventory/
COPY packages/localization/package.json ./packages/localization/
COPY packages/payments/package.json ./packages/payments/
COPY apps/api/package.json ./apps/api/
COPY apps/admin-web/package.json ./apps/admin-web/
COPY apps/telegram-bot/package.json ./apps/telegram-bot/
COPY apps/worker/package.json ./apps/worker/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy full application source code
COPY . .

# Generate Prisma Client
RUN pnpm --filter @telegram-store/database db:generate

# Build all packages and applications for production
RUN pnpm -r run build

# ------------------------------------------------------------------------------
# Target: NestJS Backend API (Port 4000)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS api
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=base /app /app
EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]

# ------------------------------------------------------------------------------
# Target: Next.js Admin Web Panel (Port 3000)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS admin-web
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app /app
EXPOSE 3000

WORKDIR /app/apps/admin-web
CMD ["pnpm", "start"]

# ------------------------------------------------------------------------------
# Target: Telegram Bot Service (Daemon)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS bot
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production

COPY --from=base /app /app
WORKDIR /app/apps/telegram-bot
CMD ["node", "dist/index.js"]

# ------------------------------------------------------------------------------
# Target: BullMQ Async Background Worker (Daemon)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS worker
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production

COPY --from=base /app /app
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
