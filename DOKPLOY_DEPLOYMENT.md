# 🚀 Delux Store - Dokploy Deployment Guide (Server: 178.105.157.51)

This project is fully containerized and pre-configured for **1-click deployment on Dokploy** using Docker Compose.

---

## 📦 What Has Been Containerized

| Container Service | Base Image / Target | Internal Port | External Port / Route | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `postgres:16-alpine` | `5432` | *(Internal network only)* | PostgreSQL 16 database with persistent volume |
| **`redis`** | `redis:7-alpine` | `6379` | *(Internal network only)* | Redis 7 for BullMQ queues & fast session store |
| **`api`** | `Dockerfile (target: api)` | `4000` | `4000` / API Domain | NestJS Core Backend (auto-runs migrations on startup) |
| **`admin-web`** | `Dockerfile (target: admin-web)` | `3000` | `3000` / Web Domain | Next.js Microsoft Fluent Light Web Dashboard |
| **`telegram-bot`**| `Dockerfile (target: bot)` | — | — | GrammY Bot Daemon connected to `@thedeluxstorebot` |
| **`worker`** | `Dockerfile (target: worker)` | — | — | BullMQ Async Worker for order expiry & deposit sweep |

---

## 🛠️ Step-by-Step Dokploy GUI Deployment

### Step 1: Open Your Dokploy Dashboard
Open your browser and navigate to your Dokploy control panel at:
```
http://178.105.157.51:3000
```
*(or the custom domain / port you set up for Dokploy)*

---

### Step 2: Create a Project & Compose Service
1. In Dokploy, go to **Projects** (on the left menu).
2. Click **Create Project** (e.g. name it **`Delux Store`**).
3. Inside your project, click **`Create Service`** and select **`Compose`**.
4. Name the Compose service: `delux-store`.

---

### Step 3: Paste Environment Variables
1. Click on your `delux-store` Compose service.
2. Navigate to the **Environment** tab.
3. Copy and paste the contents of `.env.dokploy` into the environment editor:

```env
NODE_ENV=production
PORT=4000

# Server & Domain Configuration (Server IP: 178.105.157.51)
NEXT_PUBLIC_API_URL=http://178.105.157.51:4000/api/v1
ADMIN_WEB_URL=*

# Database: Internal Docker Network Connection
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_secure_pass
POSTGRES_DB=telegram_store
DATABASE_URL=postgresql://postgres:postgres_secure_pass@postgres:5432/telegram_store?schema=public

# Redis & Background Queue: Internal Docker Network
REDIS_URL=redis://redis:6379

# Telegram Bot Credentials
TELEGRAM_BOT_TOKEN=8665703172:AAF7jLLob23ZdIaYvI0Sybi29SoFpVXZh_k
TELEGRAM_BOT_USERNAME=thedeluxstorebot

# Cryptography & Security
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
JWT_SECRET=super_secret_jwt_key_delux_production_2026_segoe
JWT_EXPIRATION=7d

# Initial Store Owner Credentials
ADMIN_DEFAULT_EMAIL=msaad.official6@gmail.com
ADMIN_DEFAULT_PASSWORD=Saad_@123

# Store Defaults
STORE_NAME=Delux Store
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=en
REFERRAL_DEFAULT_PERCENTAGE=10.00
MINIMUM_DEPOSIT_USD=1.00
```
4. Click **Save**.

---

### Step 4: Configure Source & Deploy

In the **General** tab of your Compose service:

#### Option A: Deploying via GitHub (Recommended)
1. Set **Source Type** to **`Git`**.
2. Connect your repository (e.g., `https://github.com/saadkhan2003/...`).
3. Set **Branch** to `master` (or `main`).
4. Set **Compose Path** to:
   ```
   docker-compose.prod.yml
   ```
5. Click **`Deploy`**!

#### Option B: Deploying via Raw Compose (Zero Git Setup)
1. Set **Source Type** to **`Docker Compose`** / **`Raw`**.
2. Copy the entire contents of [`docker-compose.prod.yml`](./docker-compose.prod.yml) and paste it into the editor.
3. Click **`Deploy`**!

---

### Step 5: Assign Dokploy's Temporary Domain or Custom Domain

Dokploy includes Traefik with free automatic Let's Encrypt SSL:

1. In your `delux-store` Compose service in Dokploy, go to **Domains**.
2. Click **Add Domain** or **Generate Free Domain**:
   * **For Admin Web Panel:**
     * Service: Select `admin-web`
     * Port: `3000`
     * Domain: Click *Generate Domain* (e.g. `https://delux-web-xxxx.178.105.157.51.sslip.io`) or use a custom domain like `admin.deluxstore.com`.
     * Enable **HTTPS / SSL**: Checked ✅.
   * **For API Backend:**
     * Service: Select `api`
     * Port: `4000`
     * Domain: Click *Generate Domain* (e.g. `https://delux-api-xxxx.178.105.157.51.sslip.io`) or `api.deluxstore.com`.
     * Enable **HTTPS / SSL**: Checked ✅.
3. Once the API domain is generated, go back to the **Environment** tab:
   * Update `NEXT_PUBLIC_API_URL` to your API domain (e.g. `https://delux-api-xxxx.178.105.157.51.sslip.io/api/v1`).
4. Click **Redeploy**.

---

## ✨ Automated Behaviors
* **Automatic Database Migrations:** When `api` boots, it automatically runs `pnpm db:migrate` so all tables and the initial admin user are automatically provisioned.
* **Health Checks:** Postgres and Redis have active health checks; the API and services wait until the database is ready before accepting traffic.
* **Auto-Restart:** All containers are set to `restart: unless-stopped` so your store stays online 24/7 even after server reboots.
