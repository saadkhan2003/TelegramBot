# ==============================================================================
# Telegram Digital Store - Unified Single Production Dockerfile (Dokploy Optimized)
# Uses Debian Slim (glibc) for Prisma & bcrypt compatibility
# ==============================================================================

FROM node:20-slim
WORKDIR /app

# Install OpenSSL for Prisma engine & CA certificates
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable and configure pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy all package manifests for dependency layer caching
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

# Generate Prisma Client & Build all workspace projects
RUN pnpm db:generate && \
    pnpm -r run build && \
    rm -rf apps/admin-web/.next/cache && \
    pnpm store prune

ENV NODE_ENV=production

# Default command (overridden per service in docker-compose.prod.yml)
CMD ["node", "apps/api/dist/main.js"]
