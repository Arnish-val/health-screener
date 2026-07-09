# 🩺 Unified Health & Wellness Screener

![CI](https://github.com/Arnish-val/health-screener/actions/workflows/ci.yml/badge.svg)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat-square&logo=vite&logoColor=FFD627)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit_learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

An end-to-end, full-stack intelligence platform that leverages Machine Learning to provide preliminary health screenings and mental wellness risk assessments. By combining a responsive, state-of-the-art React frontend with a high-performance Python FastAPI microservice, the platform delivers instant, interactive risk analysis and educational guidance.

---

## 🚀 Key Features

*   **Symptom-Based Disease Classifier:** Predicts the top 3 most likely medical conditions based on a dynamic input of 132+ physical symptoms, along with statistical probability rankings.
*   **Mental Wellness Risk Profiler:** Assesses depression risk profiles (Low, Medium, High Risk) by evaluating academic/work stress, financial pressure, sleep hygiene, CGPA, and lifestyle factors.
*   **Dynamic Interactive Dashboard:** Beautifully visualizes prediction metrics, risk bands, and personalized actionable wellness guidance using **Recharts** and smooth **Framer Motion** micro-animations.
*   **Local SQLite Storage:** Secure, lightweight database logging for audit trails and screening sessions.

---

## 🛠️ Tech Stack & Architecture

### 💻 Frontend (Client Dashboard)
*   **Core:** React 19 + Vite (Superfast Hot Module Replacement)
*   **Styling & Motion:** Tailwind CSS + Framer Motion (Glassmorphism design & premium micro-animations)
*   **Data Visualization:** Recharts (For interactive probability graphs & risk dials)
*   **Icons:** Lucide React

### ⚙️ Backend (Intelligence API)
*   **Framework:** FastAPI (High-performance ASGI Python framework)
*   **Server:** Uvicorn (Lightning-fast concurrency)
*   **Database:** SQLite + SQLAlchemy ORM

### 🤖 Machine Learning Pipeline
*   **Runtime:** Python, Scikit-Learn, NumPy, Pandas, Joblib
*   **Models:** Specialized classification pipelines trained and serialized (`.joblib`) for clinical symptom mapping and risk-band allocation.

---

## 📂 Project Structure

```text
├── backend/            # Python FastAPI backend server & API endpoints
├── frontend/           # React + Vite client-side dashboard
├── ml_pipeline/        # Model training scripts, preprocessing, and datasets
│   └── models/         # Trained .joblib ML model artifacts
├── nginx/              # Nginx reverse proxy configuration files
├── scripts/            # Shell scripts (EC2 setup & bootstrapping)
└── .github/workflows/  # CI/CD deployment pipelines (GitHub Actions)
```

---

## 📦 Getting Started Locally

Follow these instructions to run the application on your local machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Python 3.12](https://www.python.org/)

---

### Step 1: Start the Backend API (FastAPI)

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate the Python virtual environment:
   *   **Windows (PowerShell):**
       ```powershell
       .venv\Scripts\Activate.ps1
       ```
   *   **Windows (CMD):**
       ```cmd
       .venv\Scripts\activate.bat
       ```
   *   **macOS / Linux:**
       ```bash
       source .venv/bin/activate
       ```
3. Start the development server using **Uvicorn**:
   ```bash
   uvicorn app.main:app --reload
   ```
   *   *The API will start running locally at `http://127.0.0.1:8000`.*
   *   *Interactive documentation is available at `http://127.0.0.1:8000/docs`.*

---

### Step 2: Start the Frontend Site (React + Vite)

1. Open a **new terminal window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *   *Open the local address output in your browser (usually `http://localhost:5173`) to view and interact with your website!*

---

## ☁️ Production Deployment Architecture (AWS + Vercel)

The production stack is deployed using a highly scalable, secure, and **zero-cost** decoupled cloud architecture:

```
  User's Browser
       │
       ├──── HTTPS (Port 443) ────► Vercel CDN (Frontend SPA Build)
       │
       └──── HTTPS (Port 443) ────► Nginx Proxy + Let's Encrypt SSL (EC2 Host)
                                     │
                                     ▼ (Port 8000)
                              Docker Container (FastAPI Backend)
                                     │
                                     ▼ (Persistent Volume)
                              SQLite Database
```

### 💻 Frontend (Vercel)
*   The React client dashboard is deployed to **Vercel's global Edge CDN** for ultra-fast asset delivery.
*   Pushes to the `main` branch trigger Vercel to automatically compile your production Vite build and publish.

### ⚙️ Backend & Machine Learning (AWS EC2 + Docker)
*   **Host**: AWS EC2 `t3.micro` instance running **Ubuntu 24.04 LTS**.
*   **Virtual Memory**: Configured with a **2 GB Swap Space** to assist the physical RAM in loading heavy Scikit-Learn and XGBoost pipelines without memory crashes.
*   **Containerization**: The FastAPI backend is built and run inside a **Docker** container for clean environment isolation.
*   **Reverse Proxy**: **Nginx** handles incoming traffic, forwards requests to the Docker container, and manages secure HSTS/XSS security headers.
*   **SSL Certificate**: Fully encrypted via free auto-renewing **Let's Encrypt** certificates managed by **Certbot**.
*   **DNS Resolution**: Routed using **DuckDNS** dynamic DNS servers.
*   **Security & Rate Limiting**: Features built-in Nginx request rate limiters (5 req/sec for APIs, 1 req/sec for authentication routes) to prevent DDoS attacks and credential brute-forcing.
*   **Data Persistence**: A host-mounted Docker volume maps database modifications to `/data/` on the EC2 drive, keeping SQLite records safe across deployments.

### 🚀 CI/CD Pipeline (GitHub Actions)
Our automated pipeline ([deploy.yml](file:///.github/workflows/deploy.yml)) governs code releases:
1. **Trigger**: Pushes to `main`.
2. **Lint & Test**: Builds and tests the React codebase and runs the backend `pytest` suite in parallel.
3. **Deploy**: If tests pass, SSHs into the EC2 server, pulls the repository, rebuilds the Docker image, reloads the Nginx configurations, and tests the health status of the new container with zero downtime.

---

## ⚖️ Disclaimer
*This application is an educational prototype and proof of concept. It is not intended to serve as a licensed clinical diagnostic device or medical device.*
