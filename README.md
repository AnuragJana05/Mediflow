# MediFlow — Smart Hospital Bed & Patient Allocation System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Docker](https://img.shields.io/badge/Docker_Compose-Supported-2496ED?logo=docker&logoColor=white)](https://www.docker.com)

**MediFlow** is a hospital operations platform designed to enhance resource visibility, streamline patient flow, prioritize incoming cases through transparent clinical triage scoring, and recommend suitable available beds through deterministic, multi-factor matching.

> [!TIP]
> **Ready for 1-Click Vercel Deployment**: See [VERCEL_DEPLOYMENT_GUIDE.md](file:///d:/Projects/MediFlow/VERCEL_DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.

> [!IMPORTANT]
> **Safety & Product Boundaries (PRD v1.0 Compliance)**:
> MediFlow is a software prototype and clinical decision-support platform designed for operational resource management. It uses synthetic demonstration data only. The system **never silently auto-allocates beds** or diagnoses patients; clinical recommendations serve as decision-support information and **strictly require human physician/staff authorization**.

---

## 🏥 Key Features

1. **Hospital Operations Command Dashboard**:
   - Live KPI cards: Total beds, Available, Occupied, Cleaning/Sanitizing, Maintenance, Reserved.
   - Acuity department occupancy rates (ICU, Emergency, Coronary Care, General Inpatient, Isolation, Surgical).
   - Real-time patient waiting queue with acuity tags and average waiting time calculations.

2. **Explainable Triage & Priority Assessment Engine**:
   - Evaluates physiological vitals ($SpO_2$, Heart Rate, Systolic/Diastolic BP, Temperature) alongside clinical airway and symptom presentations.
   - Outputs priority acuity: **Critical (Immediate)**, **High (Urgent)**, **Medium (Semi-urgent)**, **Low (Non-urgent)** with detailed contributing factors.
   - **Clinician Override**: Attending physicians can override priority with a mandatory recorded justification and audit log.

3. **Smart Bed Matching Engine (The Core Innovation)**:
   - Evaluates candidate beds against required clinical criteria:
     1. Strict department suitability (ICU, ED, Isolation, CCU, Ward).
     2. Life-support hardware verification (Mechanical ventilators, central oxygen lines, multi-parameter cardiac monitors, negative-pressure isolation).
     3. Acuity-to-bed capability efficiency scoring.
   - Returns ranked compatible beds with matching percentage score (e.g. 96%), positive verified reasons, and explicit rejection explanations for incompatible/unavailable beds.
   - Requires explicit authorized clinician approval (`[Approve Allocation]`, `[Reject]`) with recorded staff identity and timestamp.

4. **Interactive 2D Visual Hospital Bed Map**:
   - Topological layout representing hospital wings, floors, and rooms.
   - Real-time color status indicators:
     - 🟢 **Available**
     - 🔴 **Occupied**
     - 🟡 **Cleaning / Sanitizing**
     - 🔵 **Reserved**
     - ⚪ **Maintenance**
   - Click-to-inspect modal displaying patient vitals, hardware, and quick status changes.

5. **Mass-Casualty Incident & Surge Simulator**:
   - Dedicated disaster mode simulating sudden demand spikes:
     - *Highway Collision* (14 acute trauma patients)
     - *Chemical Vapor Hazard* (18 acute respiratory / ventilator patients)
     - *Viral Outbreak Spike* (20 droplet isolation patients)
   - Visual **Hospital Capacity Pressure Meter**, automated alert generation, and queue pressure calculation.
   - **Clean Revert**: 1-click reset that safely clears synthetic simulation patients and restores baseline beds.

6. **Real-Time Updates via WebSockets**:
   - Full duplex WebSocket stream (`/ws`) broadcasting state changes (`BED_STATUS_CHANGED`, `PATIENT_REGISTERED`, `RECOMMENDATION_APPROVED`, `SURGE_SIMULATION_ACTIVATED`).
   - Connected clients update seamlessly with animated floating alerts without page refreshes.

7. **Capacity Analytics**:
   - Interactive Recharts visualization with time filters (*Today*, *7 Days*, *30 Days*):
     - Bed occupancy trends over time (Overall vs ICU).
     - Department utilization breakdown.
     - Average waiting time to allocation by acuity level.
     - 24-hour diurnal peak load curve.
     - Key turnover velocity metrics.

8. **Immutable Audit Trail**:
   - Comprehensive log recording User, Role, Action, Entity, Old/New Values, Details, and Timestamp.

---

## 🔑 Pre-Seeded Test Accounts

Use the **Fast Demo Switcher** in the header or sign in with these credentials:

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Hospital Administrator** | Dr. Sarah Chen | `admin@mediflow.health` | `admin123` | Full system access, bed CRUD, department management, surge simulation, analytics |
| **Attending Doctor** | Dr. Marcus Smith, MD | `dr.smith@mediflow.health` | `doctor123` | Clinical intake, priority override, bed recommendation approval/rejection |
| **Triage Nurse** | Clara Evans, BSN RN | `nurse.clara@mediflow.health` | `nurse123` | Patient intake, bed status changes (Cleaning, Ready), patient discharge |

---

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide React, Vite
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, WebSockets, PyJWT, Bcrypt
- **Database**: PostgreSQL 16 (Production / Docker) & SQLite (Zero-friction local fallback)
- **Deployment**: Docker, Docker Compose, NGINX

---

## 🚀 Local Quickstart Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- (Optional) Docker and Docker Compose

### Option A: Run Natively (Fastest for Development)

#### 1. Start FastAPI Backend:
```bash
cd backend
# Install dependencies (if not already installed)
python -m pip install -r requirements.txt

# Start the backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- Backend will run at: `http://127.0.0.1:8000`
- Interactive Swagger API docs: `http://127.0.0.1:8000/docs`
- Database automatically initializes and seeds 72 beds and 20+ realistic patients on first launch.

#### 2. Start React Frontend:
```bash
cd frontend
# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
- Open your browser to: `http://127.0.0.1:5173`

---

### Option B: Run with Docker Compose

To spin up PostgreSQL, the FastAPI backend, and the NGINX-served React frontend:

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🧪 Testing & Verification

### Running Automated Test Suite
From the `backend` directory:
```bash
python tests/test_api.py
```
*Executes tests for authentication, dashboard KPIs, deterministic triage engine, bed matching recommendation logic, and surge simulation.*

### Running Live End-to-End Walkthrough Script
```bash
python tests/test_live_demo_flow.py
```
*Validates the full 11-step hackathon scenario directly against the running server.*

---

## 🎬 11-Step Hackathon Demonstration Scenario

1. **Dashboard Overview**:
   - Open `http://127.0.0.1:5173`.
   - Inspect the KPI cards (72 Total Beds, Available, Occupied, ICU Occupancy Rate, Average Wait Time).
2. **Explore Visual Bed Map**:
   - Navigate to **Visual Bed Map** in the sidebar.
   - Review the 2D layout of ICU, ED, Cardiology, General Ward, and Isolation.
   - Click on any bed (e.g. `ICU-02`) to inspect current patient vitals and hardware capabilities.
3. **Register an Emergency Patient**:
   - Go to **Patient Queue & Intake** &rarr; click **Intake New Patient**.
   - Input: *Lucas Montgomery*, Age: 54, Symptoms: *Severe acute respiratory distress with cyanosis*, $SpO_2$: 86%, Heart Rate: 132 bpm, Oxygen: *Invasive*, Dept: *ICU*.
   - Observe the **Live Triage Engine Assessment** calculate *Critical* priority in real-time.
   - Click **Register & Run Triage**.
4. **Smart Bed Matching Engine**:
   - Navigate to **Smart Bed Matching** &rarr; select *Lucas Montgomery (P-1024)*.
   - Notice the engine filters out non-ventilator and occupied beds.
   - Review the top recommendation (e.g. `ICU-07` or `ICU-03`) with a 96%+ compatibility score and verified factors checklist.
   - Inspect the **Incompatible / Unavailable Beds** sidebar showing rejected beds and exact rejection reasons.
5. **Doctor Authorization & Approval**:
   - Click **[Approve Allocation]**.
   - Confirm the clinical authorization modal.
   - The bed status transitions immediately to **Occupied** and patient status to **Admitted**.
6. **Live Dashboard Synchronized**:
   - Return to the **Command Dashboard**.
   - Notice the live bed counts and waiting queue updated via WebSocket without manual page refresh.
7. **Mass-Casualty Surge Simulation**:
   - Navigate to **Surge Simulator**.
   - Select *Mass Casualty: Multi-Vehicle Interstate Collision* (14 patients).
   - Click **SIMULATE SURGE EVENT**.
   - Watch the **Hospital Capacity Pressure Meter** jump to *Severe Pressure*, Emergency occupancy spike to 85%+, and real-time operations surge alerts trigger.
8. **Inspect Alerts & Analytics**:
   - Open **Alerts Center** to review triggered capacity alerts and acknowledge them.
   - Open **Capacity Analytics** to observe the occupancy area chart, department load bar chart, and peak hourly inflow.
9. **Clean Revert**:
   - In **Surge Simulator**, click **Reset Simulation**.
   - The synthetic surge patients are purged and the hospital baseline is restored cleanly.
10. **Audit Trail Verification**:
    - Open **Audit Trail** to view the immutable chronological log of the triage registration, priority scoring, recommendation approval, and surge simulation lifecycle.

---

## 📄 License
MIT License. Built for clinical resource optimization demonstrations.
