# ==============================================================================
# Telegram Digital Store - Unified Multi-Stage Production Dockerfile (Dokploy Ready)
# Uses Debian Slim (glibc) for 100% prebuilt binary compatibility (Prisma & bcrypt)
# ==============================================================================

FROM node:20-slim AS base
WORKDIR /app

# Install OpenSSL for Prisma engine & CA certificates
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

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
FROM node:20-slim AS api
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=base /app /app
EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]

# ------------------------------------------------------------------------------
# Target: Next.js Admin Web Panel (Port 3000)
# ------------------------------------------------------------------------------
FROM node:20-slim AS admin-web
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
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
FROM node:20-slim AS bot
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

COPY --from=base /app /app
WORKDIR /app/apps/telegram-bot
CMD ["node", "dist/index.js"]

# ------------------------------------------------------------------------------
# Target: BullMQ Async Background Worker (Daemon)
# ------------------------------------------------------------------------------
FROM node:20-slim AS worker
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

COPY --from=base /app /app
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
