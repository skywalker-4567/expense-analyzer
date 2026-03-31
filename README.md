# Expenso — Smart Expense Analyzer

![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.4-brightgreen?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.10-yellow?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-teal?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square&logo=docker)

A full-stack expense tracking web application that automatically detects expenses from Gmail, categorizes them using a machine learning model, and provides spending insights and budget management.

**Live Demo:** [https://expenso-frontend-bwde.onrender.com](https://expenso-frontend-bwde.onrender.com)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Gmail OAuth Setup](#gmail-oauth-setup)
- [Deployment](#deployment)

---

## Features

- **JWT Authentication** — Secure register and login with BCrypt password hashing
- **Manual Expense Entry** — Add expenses with ML-based auto-categorization
- **Gmail Integration** — Connect Gmail via OAuth2, auto-detect expense amounts from emails, confirm before saving
- **Budget Management** — Set spending limits per category per month
- **Dashboard** — Spending trend (area chart) and category breakdown (pie chart) via Recharts
- **AI Insights** — Auto-generated spending alerts and patterns
- **Email Expense Queue** — Review pending and converted email expenses
- **Profile Page** — Account overview with total expenses and budgets
- **Fully Dockerized** — All services run with a single command

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios, Recharts |
| Backend | Spring Boot 3.2.4, Spring Security, JWT, Spring Data JPA, Hibernate |
| ML Service | FastAPI, scikit-learn (Naive Bayes), Python 3.10 |
| Database | PostgreSQL 15 |
| Containerization | Docker, Docker Compose |
| Deployment | Render (Frontend + Backend + ML + DB) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React + Vite (Render Static Site)              │
│         nginx proxies /api/ → BACKEND_URL env var           │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP (JWT in Authorization header)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│           Spring Boot 3.2.4 (Render Web Service)            │
│     JWT Auth │ JPA/Hibernate │ Gmail OAuth2 │ Scheduling    │
└──────┬───────────────────────────────────┬──────────────────┘
       │ HTTP POST /predict-category        │ JDBC
       ▼                                    ▼
┌──────────────────┐              ┌─────────────────────┐
│   ML SERVICE     │              │      DATABASE        │
│  FastAPI/Python  │              │    PostgreSQL 15     │
│  Naive Bayes     │              │   (Render Managed)   │
│  scikit-learn    │              └─────────────────────┘
└──────────────────┘

Gmail API Flow:
Gmail API → Backend → email_expenses table → User confirms → expenses table
```

---

## Project Structure

```
expense-analyzer/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── nginx.conf              # Proxies /api/ to backend
│   ├── Dockerfile
│   └── package.json
├── backend/                    # Spring Boot
│   ├── src/main/java/com/expenseanalyzer/
│   │   ├── client/             # MlServiceClient
│   │   ├── config/             # GoogleOAuthConfig
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   ├── scheduler/          # InsightScheduler
│   │   ├── security/           # JWT + Spring Security
│   │   └── service/
│   ├── Dockerfile
│   └── pom.xml
├── ml-service/                 # FastAPI
│   ├── main.py
│   ├── model.py                # Naive Bayes pipeline
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

---

## Local Setup

### Prerequisites

- Docker Desktop
- Java 17
- Maven
- Node.js 18+

### Steps

**1. Clone the repository:**
```bash
git clone https://github.com/skywalker-4567/expense-analyzer.git
cd expense-analyzer
```

**2. Create `.env` in the root directory** (see [Environment Variables](#environment-variables))

**3. Build the backend jar:**
```bash
cd backend
mvn clean package -DskipTests
cd ..
```

**4. Start all services:**
```bash
docker-compose up --build
```

**5. Access the app:**

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend | http://localhost:8080 |
| ML Service | http://localhost:8000 |

> **Windows users:** If Docker Compose doesn't pick up `.env` automatically, set variables in PowerShell before running:
> ```powershell
> $env:POSTGRES_DB="expense_db"; $env:POSTGRES_USER="postgres"; $env:POSTGRES_PASSWORD="yourpassword"
> docker-compose up --build
> ```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
POSTGRES_DB=expense_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
DB_URL=jdbc:postgresql://db:5432/expense_db
DB_USERNAME=postgres
DB_PASSWORD=yourpassword

# JWT
JWT_SECRET=mySecretKey1234567890mySecretKey1234567890

# ML Service
ML_SERVICE_URL=http://ml-service:8000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/integrations/gmail/callback
```

| Variable | Description |
|---|---|
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Secret key for JWT signing (min 32 characters) |
| `ML_SERVICE_URL` | Internal URL for ML microservice |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | OAuth2 callback URL |

---

## API Reference

<details>
<summary><strong>Auth</strong></summary>

```
POST /api/auth/register
Body: { "name": "User", "email": "user@email.com", "password": "123456" }
Response 201: { "message": "User registered successfully", "token": "...", "userId": 1 }

POST /api/auth/login
Body: { "email": "user@email.com", "password": "123456" }
Response 200: { "message": "Login successful", "token": "...", "userId": 1 }
```
</details>

<details>
<summary><strong>Expenses</strong></summary>

```
POST /api/expenses
Headers: Authorization: Bearer <token>
Body: { "amount": 450, "description": "Swiggy order", "expenseDate": "2026-03-27" }
Response 201: Expense object with ML-predicted category

GET /api/expenses?page=0&size=10&month=2026-03
Headers: Authorization: Bearer <token>
Response 200: Paginated expense list

GET /api/expenses/summary?month=2026-03
Headers: Authorization: Bearer <token>
Response 200: { "total": 12000, "categoryBreakdown": { "Food": 5000, "Travel": 2000 } }
```
</details>

<details>
<summary><strong>Budgets</strong></summary>

```
POST /api/budgets
Headers: Authorization: Bearer <token>
Body: { "category": "Food", "limitAmount": 4000, "month": "2026-03" }
Response 201: Budget object

GET /api/budgets?month=2026-03
Headers: Authorization: Bearer <token>
Response 200: List of budgets for the month
```
</details>

<details>
<summary><strong>Insights</strong></summary>

```
GET /api/insights
Headers: Authorization: Bearer <token>
Response 200: [ "You spent the most on Food this month: ₹5000." ]
```
</details>

<details>
<summary><strong>Gmail Integration</strong></summary>

```
GET /api/integrations/gmail/connect
Headers: Authorization: Bearer <token>
Response 200: { "url": "https://accounts.google.com/o/oauth2/v2/auth?..." }

GET /api/integrations/gmail/callback?code=...&userId=...
Response 200: { "message": "Gmail connected successfully" }

POST /api/integrations/gmail/fetch
Headers: Authorization: Bearer <token>
Response 200: { "message": "Emails fetched and processed", "savedCount": 5 }

GET /api/email-expenses
Headers: Authorization: Bearer <token>
Response 200: List of detected email expenses pending confirmation

POST /api/email-expenses/{id}/convert
Headers: Authorization: Bearer <token>
Response 200: { "message": "Email expense converted successfully", "expenseId": 1 }
```
</details>

<details>
<summary><strong>ML Service</strong></summary>

```
POST /predict-category
Body: { "description": "Swiggy order 450" }
Response 200: { "category": "Food" }

Supported categories: Food, Travel, Shopping, Bills

GET /health
Response 200: { "status": "ok" }
```
</details>

<details>
<summary><strong>User</strong></summary>

```
GET /api/users/me
Headers: Authorization: Bearer <token>
Response 200: { "id": 1, "name": "User", "email": "user@email.com", "createdAt": "..." }
```
</details>

---

## Database Schema

```
users
├── id (BIGSERIAL, PK)
├── name (VARCHAR)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, BCrypt)
└── created_at (TIMESTAMP)

expenses
├── id (BIGSERIAL, PK)
├── user_id (FK → users)
├── amount (DECIMAL 10,2)
├── category (VARCHAR)
├── description (TEXT)
├── expense_date (DATE)
├── source (VARCHAR) — MANUAL | EMAIL
└── created_at (TIMESTAMP)

budgets
├── id (BIGSERIAL, PK)
├── user_id (FK → users)
├── category (VARCHAR)
├── limit_amount (DECIMAL 10,2)
├── month (VARCHAR) — format: YYYY-MM
└── created_at (TIMESTAMP)

insights
├── id (BIGSERIAL, PK)
├── user_id (FK → users)
├── message (TEXT)
└── created_at (TIMESTAMP)

email_expenses
├── id (BIGSERIAL, PK)
├── user_id (FK → users)
├── email_id (VARCHAR)
├── extracted_text (TEXT)
├── amount (DECIMAL 10,2)
├── detected (BOOLEAN DEFAULT FALSE)
└── created_at (TIMESTAMP)
```

---

## Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Gmail API**
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Set application type to **Web Application**
6. Add Authorized Redirect URI:
   - Local: `http://localhost:8080/api/integrations/gmail/callback`
   - Production: `https://expenso-backend-syv4.onrender.com/api/integrations/gmail/callback`
7. Copy **Client ID** and **Client Secret** into your `.env`
8. Go to **OAuth Consent Screen → Audience → Add Test Users** and add your Gmail address

> **Note:** The app requests `gmail.readonly` scope only. No emails are stored — only the snippet text and detected amount are saved.

---

## Deployment

All four services are deployed independently on Render.

### Services

| Service | Type | Root Directory | Start Command |
|---|---|---|---|
| PostgreSQL | Managed DB | — | — |
| ML Service | Web Service | `ml-service/` | `uvicorn main:app --host 0.0.0.0 --port 8000` |
| Backend | Web Service | `backend/` | `java -jar target/*.jar` |
| Frontend | Static Site | `frontend/` | Build: `npm install && npm run build` / Publish: `dist` |

### Backend Environment Variables (Render)

| Variable | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | Render internal DB URL |
| `DB_USERNAME` | From Render DB credentials |
| `DB_PASSWORD` | From Render DB credentials |
| `JWT_SECRET` | Your secret key |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GMAIL_REDIRECT_URI` | `https://expenso-backend-syv4.onrender.com/api/integrations/gmail/callback` |
| `ML_SERVICE_URL` | Render internal ML service URL |

### Frontend Environment Variables (Render)

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://expenso-backend-syv4.onrender.com` |
| `BACKEND_URL` | `https://expenso-backend-syv4.onrender.com` |

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | https://expenso-frontend-bwde.onrender.com |
| Backend | https://expenso-backend-syv4.onrender.com |

---

## Author

**Utkarsh** — [@skywalker-4567](https://github.com/skywalker-4567)
