# AgriOS

**The Enterprise Unified Agriculture Operating System**

AgriOS is a unified agricultural operations platform that consolidates field intelligence, farm lifecycle management, supply chain tracking, market analytics, financial compliance, and AI-driven crop advisory into a single system. It replaces the fragmented tooling farmers, FPOs, and agribusinesses currently rely on with one coherent, role-aware platform.

The initial release targets the Indian agricultural ecosystem, with native support for PMFBY insurance workflows, KCC loan documentation, and AGMARKNET market data standards.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Modules](#core-modules)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [User Roles & Access Control](#user-roles--access-control)
- [Subscription Tiers](#subscription-tiers)
- [Machine Learning Service](#machine-learning-service)
- [Resiliency & Error Handling](#resiliency--error-handling)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Agricultural operations today are spread across disconnected tools: satellite observation platforms, spreadsheets for inventory, separate portals for government credit schemes, and standalone messaging apps for expert advice. This fragmentation leads to data loss, manual entry errors, and missed insight.

AgriOS addresses this by providing a single frontend that adapts to the authenticated user's role, backed by a modular REST API and an independent machine learning service for compute-intensive analytics.

## Architecture

AgriOS is built as a dual-runtime microservice system:

- **Client** — A single-page React application that renders role-specific dashboards based on JWT claims.
- **Server** — A Node.js/Express backend following strict MVC conventions: routes map directly to controllers, and controllers interact with the database exclusively through Mongoose models. No business logic lives in route handlers.
- **ML Service** — An independently deployed Python service exposing REST endpoints for computer vision, regression, and time-series inference. It loads serialized model artifacts (`.h5`, `.pkl`, `.onnx`) into memory and performs real inference against live payloads.

All communication between the three services happens over stateless REST using JSON. There is no shared runtime state and no WebSocket layer in this version, which keeps request/response behavior predictable and easy to test.

```
┌─────────────┐        REST/JSON        ┌─────────────┐        REST/JSON        ┌──────────────┐
│   Client    │  ───────────────────▶   │   Server    │  ───────────────────▶   │  ML Service  │
│  (React)    │  ◀───────────────────   │ (Express)   │  ◀───────────────────   │  (FastAPI)   │
└─────────────┘                         └─────────────┘                         └──────────────┘
                                                │
                                                ▼
                                          ┌───────────┐
                                          │  MongoDB  │
                                          └───────────┘
```

A hard failure in the ML service is isolated by design and must never take down the core API or the client application. See [Resiliency & Error Handling](#resiliency--error-handling).

## Core Modules

AgriOS is organized around eight functional modules:

1. **Field Intelligence & Remote Sensing** — Satellite imagery ingestion (Sentinel Hub / Copernicus / Google Earth Engine), NDVI calculation over time, and grid-level weather mapping against farm boundaries.
2. **Core Farm Operations & Lifecycle Management** — Dynamic crop calendars, operational task logging, input/inventory reconciliation, and per-plot cost accounting.
3. **Supply Chain & Post-Harvest Logistics** — Batch traceability from harvest to buyer, storage condition logging, logistics manifest tracking, and quality grading records.
4. **Market Dynamics & Smart Commerce** — Scheduled AGMARKNET price caching, bulk yield consolidation for FPOs, a B2B procurement workflow, and target price alerts.
5. **Agritech Financial Integration** — Digital KCC portfolio building, PMFBY compliance tracking, automated risk scoring, and signed PDF document packaging for loan and insurance applications.
6. **GenAI Conversational Advisor** — A contextual advisory chat interface that augments prompts with live farm data (crop stage, weather, soil NPK levels) and enforces agronomic safety guardrails.
7. **Computer Vision & Predictive Analytics** — In-house crop disease classification from image uploads, regression-based yield estimation, and time-series market price forecasting.
8. **Community Knowledge Base & Agronomist Peer Review** — Expert verification of AI-flagged disease alerts, a localized agronomic content library, and a peer-to-peer farmer/FPO communication network.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| ML Service | Python, FastAPI |
| ML Runtime | TensorFlow / Scikit-learn, serialized model artifacts (`.h5`, `.pkl`, `.onnx`) |
| Inter-service Communication | REST over HTTP, JSON |

## Repository Structure

```
agrios-root/
├── package.json                # Root orchestrator (concurrent boot scripts)
│
├── client/                     # React SPA
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/         # Shared UI components
│       ├── context/            # Auth and session state
│       ├── hooks/               # Data fetching and API hooks
│       ├── pages/
│       │   ├── DashboardSelector.jsx
│       │   ├── FarmerDashboard.jsx
│       │   ├── FPODashboard.jsx
│       │   └── BusinessDashboard.jsx
│       └── routes/             # Protected client-side routes
│
├── server/                     # Express MVC backend
│   ├── package.json
│   ├── server.js               # Entry point, DB initialization
│   ├── config/                 # Environment and DB configuration
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Farm.js
│   │   ├── CropCycle.js
│   │   ├── MandiPrice.js
│   │   └── DiseaseLog.js
│   ├── controllers/            # Business logic
│   │   ├── authController.js
│   │   ├── farmController.js
│   │   ├── marketController.js
│   │   └── analyticsController.js
│   ├── routes/                 # REST endpoint definitions
│   │   ├── api.auth.js
│   │   ├── api.farm.js
│   │   ├── api.market.js
│   │   └── api.analytics.js
│   └── middlewares/
│       ├── authentication.js   # JWT verification
│       ├── authorization.js    # Role-based access checks
│       └── premiumGating.js    # Subscription and usage limits
│
└── ml_service/                 # Independent Python ML service
    ├── requirements.txt
    ├── main.py                 # Service entry point
    ├── core/
    │   ├── config.py
    │   └── security.py
    ├── models_bin/              # Serialized model artifacts
    │   ├── disease_classifier.h5
    │   ├── yield_regressor.pkl
    │   └── price_forecaster.pkl
    ├── pipelines/               # Feature preprocessing
    │   ├── image_preprocessing.py
    │   ├── weather_normalization.py
    │   └── text_tokenization.py
    └── endpoints/
        ├── vision.py
        ├── prediction.py
        └── advisor.py
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.10+
- MongoDB (local instance or a hosted cluster)

### Installation

Clone the repository and install dependencies for all three services:

```bash
git clone https://github.com/<your-org>/agrios.git
cd agrios

# Install root, client, and server dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Install ML service dependencies
cd ml_service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Running the project

Each service can be run independently, or together via the root orchestrator:

```bash
# From the project root — boots client, server, and ml_service concurrently
npm run dev
```

Or run each service separately:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev

# Terminal 3 — ML service
cd ml_service && source venv/bin/activate && python main.py
```

By default:
- Client runs on `http://localhost:5173`
- Server runs on `http://localhost:5000`
- ML service runs on `http://localhost:8000`

## Environment Variables

Create a `.env` file in `server/` with the following:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/agrios
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TIMEOUT_MS=8000
```

Create a `.env` file in `ml_service/` with the following:

```
MODEL_DIR=./models_bin
API_AUTH_TOKEN=shared_secret_with_server
```

Adjust values to match your deployment environment. Do not commit `.env` files to version control.

## API Overview

All endpoints are served under `/api` and secured by JWT and role-based middleware where applicable.

| Method | Endpoint | Access | Tier |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Free |
| POST | `/api/auth/login` | Public | Free |
| POST | `/api/farm/create` | Farmer, FPO | Free |
| GET | `/api/farm/all` | Authenticated | Free |
| POST | `/api/crop/start` | Farmer, FPO | Free |
| GET | `/api/market/prices` | Authenticated | Free |
| POST | `/api/analytics/diagnose` | Authenticated | Premium |
| POST | `/api/analytics/predict-yield` | Authenticated | Premium |
| POST | `/api/analytics/advisor-chat` | Authenticated | Premium |

Premium-gated endpoints route through the ML service and are subject to per-account usage limits (see [Subscription Tiers](#subscription-tiers)).

## User Roles & Access Control

AgriOS is a multi-tenant system with role information embedded in signed JWTs. Every request to the server passes through role-validation middleware.

| Module | Farmer | FPO Admin | Agri-Business | Agronomist Expert |
|---|---|---|---|---|
| Field Logs & Crop Planning | Full read/write (own farm) | Aggregate read, bulk assignment | No access | Read access by invitation |
| Mandi Market Analytics | Read, historical trends | Read, bulk price alerts | Full write (bidding, offers) | Read only |
| KCC / PMFBY Documentation | Full form submission | Bulk validation, certification | No access | No access |
| AI Advisor / Model Compute | Rate-limited API access | High-throughput enterprise access | Batch ingestion for supply mapping | System validation / overrides |

## Subscription Tiers

Access to compute-intensive ML features is gated by subscription status:

- **Free** — Core farm logs, task planning, manual cost tracking, and cached market price data.
- **Premium** — Image-based disease diagnostics, yield forecasting, the conversational advisor, and price projection tools.

Usage is tracked per account. When a user exceeds their monthly compute allocation, the API returns `HTTP 429` with an upgrade prompt rather than silently failing.

## Machine Learning Service

The `ml_service` directory hosts three production inference pipelines, each backed by a real, loaded model artifact rather than static or rule-based outputs:

- **Computer Vision Pipeline** — Crop disease classification from uploaded images, returning a diagnosis label and confidence score.
- **Regression Engine** — Yield prediction from historical yield data, weather forecasts, and satellite vegetation indices.
- **Time-Series Engine** — 30-day wholesale market price forecasting from historical pricing data.
- **Generative AI Advisor** — A retrieval-augmented conversational pipeline that combines farm context with a local language model, wrapped in safety guardrails that reject out-of-scope or unsafe agronomic guidance.

## Resiliency & Error Handling

- **Timeout isolation** — Every server-to-ML-service call is wrapped in an explicit timeout (default 8000ms). A non-responsive ML service does not block server threads.
- **Graceful degradation** — If analytics endpoints are unavailable, the server falls back to cached or historical data where possible rather than failing the request outright.
- **Input sanitation** — User input is sanitized against injection attacks at both the API and database query layers.
- **Upload validation** — Image uploads are validated by file signature (not just extension) and capped at 8MB.

## Security

- Authentication is handled via JWT, verified on every protected request.
- Passwords are hashed before storage; plaintext credentials are never persisted.
- Role and subscription checks run as middleware ahead of controller execution, not inside business logic.
- Generative AI responses are constrained by prompt templates that keep output scoped to agronomic topics.

## Roadmap

| Phase | Focus |
|---|---|
| 1 | Base infrastructure, MVC scaffolding, authentication |
| 2 | Farm records, inventory tracking, market data integration |
| 3 | Financial and compliance tooling, premium gating |
| 4 | ML service activation and conversational advisor rollout |

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request, and ensure new code follows the existing MVC and service-boundary conventions described above.
