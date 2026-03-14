# Copilot Instructions

## Overview

Team availability matrix web app. Employees register, log in, and maintain a yearly grid showing their availability as `W` (Working), `V` (Vacation), or `A` (Absence). Cells without an explicit entry default to `W`.

- **Backend**: Rust · Axum · SQLx · SQLite · JWT (HS256) · Argon2
- **Frontend**: Angular 19 (standalone) · TypeScript · RxJS

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
npm start          # Angular dev server on http://localhost:4200
npm run build      # production build
```

## Architecture

```
frontend (Angular :4200)  →  REST API  →  backend (Axum :3000)  →  SQLite (backend/data/app.db)
```

- Auth flow: register/login → receive JWT → store full `AuthResponse` in `localStorage` under key `availability-matrix.session` → attach as `Authorization: Bearer <token>` on subsequent requests.
- Matrix data: `GET /api/matrix?year=YYYY` returns all employees + all explicit status entries for the year. Cells absent from `entries` are treated as `W` by the frontend.
- Status updates: `PUT /api/statuses/:date` with `{ "status": "W"|"V"|"A" }`. Backend uses `INSERT … ON CONFLICT … DO UPDATE` (upsert). Users can only modify their own column; enforcement is by JWT identity, not a separate permission check.

## Key Conventions

### Backend

- **Single-file**: all backend code lives in `backend/src/main.rs`. No modules yet.
- **Serde naming**: every request/response struct uses `#[serde(rename_all = "camelCase")]`. DB row structs (`FromRow`) use snake_case to match column names.
- **Error handling**: use `ApiError { status: StatusCode, message: String }` for all handler errors. It implements `IntoResponse` and serialises to `{ "error": "..." }`. Never return raw strings or panic in handlers.
- **Input normalisation**: email is trimmed + lowercased before insert/lookup. Display name is trimmed. Validation helpers (`normalize_email`, `normalize_display_name`, `validate_password`) live as plain fns, not methods.
- **DB schema**: created inline in `initialize_database()` at startup with `CREATE TABLE IF NOT EXISTS`. No migration framework; schema changes go there.
- **Date format**: always `YYYY-MM-DD` strings (SQLite TEXT). Use `NaiveDate` from `chrono` for parsing.

### Frontend

- **Standalone components only** — no `NgModule`. Do not introduce modules.
- **Single component**: all UI and state live in `AppComponent`. Services are thin HTTP wrappers.
- **Dependency injection**: use `inject()` inside the class body, not constructor parameters.
- **HTTP → Promise**: wrap `HttpClient` observables with `firstValueFrom()` and `await` them. Do not expose raw `Observable`s in services.
- **Change detection**: `ChangeDetectionStrategy.OnPush`. Replace objects/maps rather than mutating in place (e.g. `this.entryMap = new Map(...)` after an update).
- **API base URL**: hardcoded in `frontend/src/app/services/api.config.ts` as `http://localhost:3000/api`.
- **Error handling**: `handleError()` in `AppComponent` extracts the `error` field from the JSON body when the response is an `HttpErrorResponse`; fall back to a generic message.
- **Cell key format**: `${userId}:${date}` — used as the key in the `entryMap` Map and as `pendingCellKey`.
- **Status cycle**: clicking a cell cycles `W → V → A → W`.

## Data Model

| Entity | Key fields |
|---|---|
| `users` | `id`, `email` (unique, lowercase), `display_name`, `password_hash` |
| `availability_statuses` | `user_id`, `status_date` (YYYY-MM-DD), `status` (W/V/A); UNIQUE on `(user_id, status_date)` |

JWT claims: `{ sub: user_id (i64), exp: unix_timestamp }`. Token lifetime: 7 days.

## Environment Variables (backend `.env`)

| Variable | Default | Notes |
|---|---|---|
| `HOST` | `127.0.0.1` | |
| `PORT` | `3000` | |
| `DATABASE_URL` | `sqlite://data/app.db` | |
| `JWT_SECRET` | `change-me-in-production` | **Must be changed for real deployments** |
| `FRONTEND_ORIGIN` | `http://localhost:4200` | CORS allowed origin |
