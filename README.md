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
├── render.yaml         # Blueprint for automated cloud deployment on Render
└── .gitignore          # Production git ignore configuration
```

---

## 📦 Getting Started Locally

Follow these instructions to run the application on your local machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Python 3.10+](https://www.python.org/)

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

## ☁️ Deployment

This project includes a `render.yaml` file, allowing you to deploy both the backend and frontend seamlessly on **Render.com** using Blueprints:

1. Push your repository to **GitHub**.
2. Log in to [Render](https://render.com).
3. Click **New** > **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically build, deploy, and link both applications!

---

## ⚖️ Disclaimer
*This application is an educational prototype and proof of concept. It is not intended to serve as a licensed clinical diagnostic device or medical device.*
