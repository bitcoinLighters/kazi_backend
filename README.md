# Kazi⚡ Backend

Node.js/Express backend for Kazi⚡, a Bitcoin Lightning-powered micro-earnings platform connecting Rwandan youth with clients who need small digital tasks completed.

This repository is the backend workstream for the hackathon. MongoDB Atlas is the shared database managed by the database teammate; this service connects to it through environment variables and owns the API, business rules, and Lightning integration boundary.

## What the MVP can do

The use cases are divided into small slices so the team can build and demo the main journey quickly:

1. Authentication and role selection: youth worker or client/business.
2. Client task creation with title, category, description, reward in sats, and deadline.
3. Youth task browsing and task details.
4. Atomic task acceptance so one task cannot be claimed twice.
5. Work submission using text and an optional file reference.
6. Client review, approval, or request for changes.
7. Lightning payment orchestration through a Polar/LND node.
8. Youth balance, payment confirmation, and earnings history.
9. Optional stretch: sats-to-RWF/mobile-money withdrawal.

The recommended demo path is: sign in as client → post task → sign in as youth → accept task → submit work → client approves and pays → youth sees the updated balance.

## Ownership split

### Backend workstream — this repository

- Express server, API routes, validation, error handling, and authentication.
- Mongoose models and service-layer business logic.
- Task state transitions: `open` → `in_progress` → `reviewing` → `paid`.
- Payment service interface and LND/Polar integration.
- Balance and earnings calculations.
- API documentation and integration support for the frontend.

### Database workstream — teammate

- MongoDB Atlas project, cluster, database user, network access, and shared connection string.
- Final collection/index review for users, tasks, submissions, payments, and withdrawals.
- Seed/demo data if needed.

Keep secrets in `atlas-credentials.env` or `.env`; both are ignored by git. Never paste credentials into source code, README files, screenshots, or commits.

## Current structure

```text
src/
  app.js                 Express middleware, route registration, Swagger UI
  server.js              Database connection and HTTP startup
  config/
    env.js               Environment loading and configuration
    database.js          MongoDB connection lifecycle
    openapi.js           OpenAPI/Swagger spec (served at /api-docs)
  routes/
    index.js             API route registry (mounts the controllers below)
    health.routes.js     Health check
  controllers/           HTTP request handlers for each resource
  middleware/            Auth (JWT) and role middleware
  models/                Mongoose schemas (User, Task, Submission, Payment, Wallet)
  services/              Auth, task, wallet, and payment business logic
  utils/                 ApiError and shared helpers
  # Preserved in-memory scaffold (not mounted; reference only):
  routes/*.routes.js     Collaborator scaffold routes (in-memory adapter)
  store/memory.store.js  Temporary Map-based adapter
  docs/swagger.js        Collaborator scaffold Swagger spec
```

MongoDB Atlas is the active data layer. The collaborator's in-memory scaffold in `src/store/` and `src/routes/*.routes.js` is preserved in the repo for reference but is **not mounted** by `routes/index.js`; the Atlas-based controllers handle all traffic.

## Setup

Requirements: Node.js 20+ and access to the shared MongoDB Atlas cluster.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The backend also automatically reads the existing `atlas-credentials.env` file when no `.env` MongoDB variables are present. To avoid ambiguity, add a database name to the Atlas URI for team development, for example `/kazi` before the query string.

Check that the server is running:

```text
GET http://localhost:5000/
GET http://localhost:5000/api/health
GET http://localhost:5000/api-docs
```

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `MONGODB_URI` | Yes* | MongoDB Atlas connection string |
| `MONGO_URI_NOT_SRV` | Yes* | Non-SRV Atlas fallback |
| `MONGODB_USERNAME` | Optional | Atlas username supplied by onboarding |
| `MONGODB_PASSWORD` | Optional | Atlas password supplied by onboarding |
| `PORT` | No | HTTP port, defaults to `5000` |
| `CONNECT_DATABASE` | No | Set `false` to skip the Atlas connection (uses in-memory scaffold). Defaults to connected |
| `JWT_SECRET` | No for scaffold | Signing key for authentication |
| `LND_REST_URL` | No for scaffold | Polar/LND REST endpoint |
| `LND_MACAROON` | No for scaffold | LND authentication credential |
| `LND_TLS_CERT_PATH` | No for scaffold | Local LND TLS certificate path |

`*` Either `MONGODB_URI` or `MONGO_URI_NOT_SRV` must be available at startup. MongoDB Atlas is the active data layer and connects by default; set `CONNECT_DATABASE=false` to disable it (for a backend-only run using the preserved in-memory scaffold in `src/store/memory.store.js`).

## Planned API contract

| Area | Endpoints | Use cases |
|---|---|---|
| Auth | `POST /api/auth/signup`, `POST /api/auth/login` | UC-1 |
| Tasks | `GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`, `POST /api/tasks/:id/accept` | UC-2–5 |
| Submissions | `POST /api/tasks/:id/submissions`, `GET /api/submissions/:id`, `POST /api/submissions/:id/request-changes` | UC-6–7 |
| Payments | `POST /api/submissions/:id/approve`, `GET /api/payments/:id` | UC-8–9 |
| Wallet | `GET /api/wallet`, `GET /api/wallet/earnings`, `POST /api/wallet/withdraw` | UC-10–11 |

For the one-day MVP, file uploads can initially be represented by a URL or filename, and withdrawal can remain a clearly labelled stretch feature.

## Engineering rules for the team

- Store money as integer satoshis, never floating-point BTC.
- Enforce role authorization on every client/youth-specific route.
- Use atomic updates when accepting tasks and when recording payments.
- Make payment approval idempotent so a retry cannot pay twice.
- Never mark a task `paid` until the Lightning payment is confirmed.
- Keep platform fee and payout amounts explicit in the payment record.
- Validate all request bodies and return consistent JSON errors.

## Immediate implementation order

1. Add User, Task, Submission, Payment, and Wallet models.
2. Add JWT auth and role middleware.
3. Implement task posting, browsing, details, and atomic acceptance.
4. Implement submission and client review flows.
5. Add a mock payment service for the demo, then connect Polar/LND.
6. Add balance/history endpoints and integration tests for the complete demo path.
