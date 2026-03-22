# Copilot Instructions

## Overview

Team availability matrix web app. Employees register, log in, and maintain a yearly grid showing their availability as `W` (Working), `V` (Vacation), or `A` (Absence). Cells without an explicit entry default to `W`.

- **Backend**: Rust · Axum · SQLx · PostgreSQL · JWT (HS256) · Argon2
- **Frontend**: React 18 · TypeScript · Vite · Axios · React Router

## Commands

### Backend (`cd backend`)

```bash
cargo run          # start dev server on http://localhost:3000
cargo build        # compile
cargo test         # run all tests
cargo test <name>  # run a single test by name (substring match)
cargo clippy       # lint
cargo fmt          # format
```

First-time setup:
```bash
cp .env.example .env   # then edit JWT_SECRET
```

### Frontend (`cd frontend`)

```bash
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # production build (runs typecheck first)
npm run typecheck  # TypeScript type checking
```

## Architecture

```
frontend (React :5173)  →  REST API  →  backend (Axum :3000)  →  PostgreSQL
```

- Auth flow: register/login → receive JWT → store full `AuthResponse` (including `user.permissions`) in `localStorage` under key `availability-matrix.session` → attach as `Authorization: Bearer <token>` on subsequent requests.
- Permission model: `user_permissions` table stores per-user permissions (`admin`, `manage_locations`, `manage_public_holidays`, `super_admin`). First registered user (id=1) gets all permissions. Permissions checked from DB per-request via `require_permission()` helper — not embedded in JWT.
- Matrix data: `GET /api/matrix?year=YYYY` returns all employees + all explicit status entries for the year. Cells absent from `entries` are treated as `W` by the frontend.
- Status updates: `PUT /api/statuses/:date` with `{ "status": "W"|"V"|"A" }`. Backend uses `INSERT … ON CONFLICT … DO UPDATE` (upsert). Users can only modify their own column; enforcement is by JWT identity.
- Admin APIs: Location CRUD at `/api/admin/locations`, Public Holiday CRUD at `/api/admin/public-holidays`, Permission management at `/api/admin/users`. All guarded by appropriate permissions.

## Key Conventions

### Backend

- **Single-file**: all backend code lives in `backend/src/main.rs`. No modules yet.
- **Serde naming**: every request/response struct uses `#[serde(rename_all = "camelCase")]`. DB row structs (`FromRow`) use snake_case to match column names.
- **Error handling**: use `ApiError { status: StatusCode, message: String }` for all handler errors. It implements `IntoResponse` and serialises to `{ "error": "..." }`. Never return raw strings or panic in handlers.
- **Input normalisation**: email is trimmed + lowercased before insert/lookup. Display name is trimmed. Validation helpers (`normalize_email`, `normalize_display_name`, `validate_password`) live as plain fns, not methods.
- **DB schema**: created inline in `initialize_database()` at startup with `CREATE TABLE IF NOT EXISTS`. No migration framework; schema changes go there.
- **Date format**: always `YYYY-MM-DD` strings. Dates are stored as PostgreSQL `DATE`, and timestamps use `TIMESTAMPTZ`. Use `NaiveDate` from `chrono` for parsing.

### Frontend

- **React functional components** with hooks. No class components.
- **Routing**: `react-router-dom` v7 with `BrowserRouter`. Routes: `/login`, `/workspace` (auth-guarded), `/admin/*` (admin-guarded). Guards in `frontend/src/guards/`.
- **Auth context**: `AuthContext` in `frontend/src/context/AuthContext.tsx` provides `currentUser`, `onAuthSuccess`, `onLogout` to all components.
- **Layouts**: `MainLayout` (NavBar + Outlet), `WorkspaceLayout` (matrix UI), `AdminLayout` (sidebar + Outlet). Located in `frontend/src/layouts/`.
- **Services**: thin HTTP wrappers using Axios via `httpClient` in `frontend/src/lib/http.client.ts`. Services return Promises, not Observables.
- **API base URL**: hardcoded in `frontend/src/lib/api.config.ts` as `http://localhost:3000/api`. Dev proxy via Vite rewrites `/api` to the backend.
- **Error handling**: Axios interceptor extracts the `error` field from JSON response. Components catch errors and show banners.
- **Cell key format**: `${userId}:${date}` — used as the key in the `entryMap` Map.
- **Status cycle**: clicking a cell opens a popup with W/V/A buttons.
- **Weekend highlighting**: Saturday/Sunday rows get `weekend-row` CSS class. Coexists with `today-row`.

## Data Model

| Entity | Key fields |
|---|---|
| `users` | `id`, `email` (unique, lowercase), `display_name`, `password_hash`, `location_id` (nullable FK → locations) |
| `availability_statuses` | `user_id`, `status_date` (YYYY-MM-DD), `status` (W/V/A); UNIQUE on `(user_id, status_date)` |
| `user_permissions` | `user_id`, `permission` (text); UNIQUE on `(user_id, permission)`. Values: `admin`, `manage_locations`, `manage_public_holidays`, `super_admin` |
| `locations` | `id`, `name` (unique) |
| `public_holidays` | `id`, `holiday_date` (YYYY-MM-DD), `name`, `location_id` (FK → locations); UNIQUE on `(holiday_date, location_id)` |

JWT claims: `{ sub: user_id (i64), exp: unix_timestamp }`. Token lifetime: 7 days.

## Environment Variables (backend `.env`)

| Variable | Default | Notes |
|---|---|---|
| `HOST` | `127.0.0.1` | |
| `PORT` | `3000` | |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/availability_matrix` | |
| `JWT_SECRET` | `change-me-in-production` | **Must be changed for real deployments** |
| `FRONTEND_ORIGIN` | `http://localhost:4200` | CORS allowed origin |
