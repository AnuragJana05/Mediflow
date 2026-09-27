# MediFlow — Vercel Deployment Guide

This guide details how to deploy **MediFlow** to [Vercel](https://vercel.com/) with zero friction.

MediFlow is configured to support **two deployment models** out of the box:
- **Option 1: All-in-One Vercel Deployment (Recommended)**: Both the Vite React frontend and the FastAPI Python backend run directly on Vercel (using Vercel Serverless Functions via `@vercel/python`).
- **Option 2: Frontend on Vercel + Backend on Dedicated Cloud**: Deploy the Vite frontend on Vercel, connecting to a backend hosted on Render, Railway, Fly.io, or AWS.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │            Vercel Edge                │
                      └──────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
         Route: /api/*                                     Route: /*
  ┌─────────────────────────────┐                 ┌─────────────────────────────┐
  │  Vercel Python Serverless   │                 │    Static React 19 / Vite   │
  │      api/index.py           │                 │       frontend/dist         │
  │   FastAPI + SQLite/Postgres │                 │  Tailwind CSS + Lucide      │
  └─────────────────────────────┘                 └─────────────────────────────┘
```

---

## Option 1: All-in-One Vercel Deployment (Zero-Config)

Deploy the entire repository to Vercel without provisioning separate backend servers.

### Step 1: Push Code to GitHub / GitLab / Bitbucket
```bash
git add .
git commit -m "chore: prepare for vercel deployment"
git branch -M main
git remote add origin https://github.com/your-username/mediflow.git
git push -u origin main
```

### Step 2: Import into Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your `mediflow` repository.
3. Configure Project Settings:
   - **Framework Preset**: `Other` (or auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `cd frontend && npm install && npm run build` *(Pre-configured in `vercel.json`)*
   - **Output Directory**: `frontend/dist` *(Pre-configured in `vercel.json`)*
4. **Environment Variables** (Optional):
   | Variable | Recommended Value | Description |
   |---|---|---|
   | `SECRET_KEY` | *(generate a random 32-char string)* | JWT signing secret |
   | `DATABASE_URL` | *(leave empty or provide Postgres URL)* | If left empty, auto-uses `/tmp/mediflow.db` with seeded demo data |

5. Click **Deploy**.

---

## Option 2: Deploy Frontend Only to Vercel (Split Architecture)

If your FastAPI backend is already hosted on Render, Railway, or Fly.io:

### Step 1: Import into Vercel Dashboard
1. Select your `mediflow` repository.
2. Edit **Root Directory**: click **Edit** and choose `frontend`.
3. Vercel will automatically detect the **Vite** preset and use `frontend/vercel.json`.

### Step 2: Set Environment Variables
In the Vercel project settings, add:
- `VITE_API_URL`: Your backend URL (e.g. `https://mediflow-backend.onrender.com`)
- `VITE_WS_URL`: Your backend WebSocket URL (e.g. `wss://mediflow-backend.onrender.com/ws`)

### Step 3: Deploy
Click **Deploy**. All single-page application routes (`/beds`, `/bed-map`, `/simulation`, `/admin-login`) will resolve cleanly without 404s via `frontend/vercel.json` rewrites.

---

## Option 3: Deploy via Vercel CLI

If you have the Vercel CLI installed:

```bash
# Login to Vercel
npx vercel login

# Deploy preview build from the root directory
npx vercel

# Deploy production build
npx vercel --prod
```

---

## Database Configuration on Vercel

| Environment | Database Configuration | Behavior |
|---|---|---|
| **Zero-Config Demo (Default)** | Leave `DATABASE_URL` unset | Uses SQLite at `/tmp/mediflow.db`. On cold start, auto-seeds 72 beds, 20+ patients, and test accounts. |
| **Persistent Cloud Database** | Set `DATABASE_URL="postgresql://user:pass@host:5432/dbname"` | Connects to Neon, Supabase, Vercel Postgres, or Railway PostgreSQL. Tables and seed data auto-migrate seamlessly. |

---

## Verification Checklist

After deployment finishes, verify the following:

- [ ] **Health Endpoint**: Visit `https://your-deployment.vercel.app/` &rarr; should return JSON with `"status": "Operational"`.
- [ ] **Interactive API Docs**: Visit `https://your-deployment.vercel.app/docs` &rarr; should load Swagger UI.
- [ ] **Frontend Application**: Visit `https://your-deployment.vercel.app/` &rarr; should load the Command Dashboard.
- [ ] **Administrator Login**: Visit `https://your-deployment.vercel.app/` and navigate to **Admin Portal** &rarr; test with `admin@mediflow.health` / `admin123`.
- [ ] **Deep Links**: Refresh the browser on `https://your-deployment.vercel.app/bed-map` &rarr; should load directly without 404.
