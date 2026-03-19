# Team Availability Matrix

An app that allows teams to keep a clear overview on who is available when. It also allows team members to perform time booking for each day and single items.
It works as a webapp with a Rust backend and React + TypeScript frontend built with Vite.

## What it does

- Employees can register and log in with email and password.
- Every authenticated employee can view the yearly availability matrix.
- Each column represents an employee.
- Each row represents one day of the selected year.
- Each cell stores one of three values:
  - `W` = Working
  - `V` = Vacation
  - `A` = Absence
- Employees can edit only their own column.

For this MVP, matrix cells default to `W` when no explicit entry exists yet.

## Project structure

- `backend/` - Rust API built with Axum, SQLx, SQLite, JWT auth, and Argon2 password hashing
- `frontend/` - React + TypeScript + Vite application that renders and edits the availability matrix

## Backend setup

Install Rust first, then run:

```bash
cd backend
cp .env.example .env
cargo run
```

The API listens on `http://localhost:3000` by default.

## Frontend setup

Install Node.js first, then run:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server listens on `http://localhost:4200` by default and proxies `/api` to `http://localhost:3000`.

### Frontend production build

```bash
cd frontend
npm run build
```

The optimized output is written to `frontend/dist/`.

## Environment variables

The backend reads these values from `.env`:

- `HOST` - server host, default `127.0.0.1`
- `PORT` - server port, default `3000`
- `DATABASE_URL` - SQLite connection string, default `sqlite://data/app.db`
- `JWT_SECRET` - JWT signing secret, must be changed for real deployments
- `FRONTEND_ORIGIN` - allowed frontend origin for CORS, default `http://localhost:4200`

## Main API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/matrix?year=2026`
- `PUT /api/statuses/:date`
