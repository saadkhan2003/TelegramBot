# ⚡ Telegram Digital Store + Web Admin Control Panel

A production-grade, modular digital-commerce platform built around Telegram customer interactions and a centralized Next.js Web Admin Control Panel.

---

## 🏗 Architecture Overview

```text
                       INTERNET
                           │
                           ▼
                     Caddy / Nginx
                    HTTPS + Routing
                     /           \
                    /             \
                   ▼               ▼
           Admin Next.js       NestJS API
           (admin.store)       (api.store)
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
        Telegram Bot           PostgreSQL              Redis
          (grammY)              (Prisma)                 │
             │                                           ▼
             │                                        BullMQ
             │                                           │
             │                                      Background
             │                                        Workers
             │                                           │
             │                         ┌─────────────────┼───────────────┐
             │                         ▼                 ▼               ▼
             │                      Payments         Delivery       Notifications
             │
             ▼
          CUSTOMER
```

---

## 📦 Monorepo Structure

```text
telegram-store/
│
├── apps/
│   ├── api/               # NestJS REST API (Auth, Orders, Wallets, Deposits, Products, RBAC)
│   ├── admin-web/         # Next.js 15 Web Admin Control Panel (Tailwind CSS, Dashboard, Stock)
│   ├── telegram-bot/      # grammY Telegram Commerce Bot (Catalog, Checkout, Wallet, Support)
│   └── worker/            # BullMQ background worker (Low-stock scan, reservation expiry)
│
├── packages/
│   ├── database/          # Prisma schema, client, migrations, and comprehensive seeds
│   ├── shared/            # Domain enums, standard error models, ID generators
│   ├── payments/          # Blockchain verification abstraction (USDT BEP20, TRC20, TON)
│   ├── inventory/         # AES-256-GCM encryption at rest & bulk parser/validator
│   ├── localization/      # i18n translation dictionary & interpolation (EN, UR, ZH, RU, VI)
│   └── config/            # Zod-validated environment config
│
├── infra/
│   └── docker-compose.yml # PostgreSQL 16 & Redis 7 services
│
├── .env.example           # Fully documented environment template
└── README.md
```

---

## 🛡️ Core Engineering Invariants

1. **No Floating-Point Math**: All financial records and ledger rows use `DECIMAL(18,4)` in PostgreSQL.
2. **Immutable Double-Entry Ledger**: Balance is never directly manipulated. Every balance modification generates a `WalletTransaction` entry (`balanceBefore`, `balanceAfter`, `type`, `referenceId`).
3. **Atomic Checkout**: Checkout operations execute in PostgreSQL `Serializable` transactions using `SELECT ... FOR UPDATE SKIP LOCKED` on `inventory_items` to eliminate race conditions and overselling.
4. **AES-256-GCM Encrypted Stock**: Digital inventory credentials (accounts, passwords, activation URLs) are encrypted at rest with isolated 96-bit IVs and authentication tags. The key is managed in environment secrets.
5. **Duplicate TxID Protection**: Database unique constraint on `(payment_network_id, transaction_hash)` guarantees a blockchain transaction hash can never be submitted or credited twice.
6. **Telegram Identity via BIGINT**: Customers are tracked strictly by their immutable `telegram_user_id` rather than usernames.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20+ (v26 tested)
- **pnpm**: v9+ (v12 tested)
- **Docker & Docker Compose**

### 2. Configure Environment
```bash
cp .env.example .env
```
Update `.env` with your `TELEGRAM_BOT_TOKEN`, database credentials, and a 64-character hex key for `ENCRYPTION_KEY`.

### 3. Start Database & Redis
```bash
pnpm docker:up
```

### 4. Install Dependencies & Build Packages
```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The seed script initializes:
- Default Owner Admin: `admin@store.local` / `AdminSecurePass123!`
- 15 granular RBAC permissions & roles
- Payment networks (USDT BEP20, USDT TRC20, TON)
- Categories (AI Tools, Developer Tools) & Sample Products (Gemini Pro, Cursor Pro)
- Initial encrypted inventory items
- System settings and multi-language translations

### 5. Run Development Services

- **Run NestJS API**:
  ```bash
  pnpm dev:api
  ```
  API runs on `http://localhost:4000/api/v1`

- **Run Admin Control Panel**:
  ```bash
  pnpm dev:admin
  ```
  Dashboard runs on `http://localhost:3000`

- **Run Telegram Bot**:
  ```bash
  pnpm dev:bot
  ```

- **Run Background Worker**:
  ```bash
  pnpm dev:worker
  ```

---

## 🌐 Multi-Language Support
The bot supports instant language switching with translation keys:
- 🇬🇧 English (`en`)
- 🇵🇰 Urdu (`ur`)
- 🇨🇳 Chinese (`zh`)
- 🇷🇺 Russian (`ru`)
- 🇻🇳 Vietnamese (`vi`)
Admin can update translation strings dynamically from the control panel.
