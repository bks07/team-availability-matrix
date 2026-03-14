# Team Availability Matrix

An app that allows teams to keep a clear overview on who is available when. It also allows team members to perform time booking for each day and single items.
It works as a webapp with a Rust backend and Angular frontend.

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

- `backend/` - Rust API built with Axum, SQLx, PostgreSQL, JWT auth, and Argon2 password hashing
- `frontend/` - Angular standalone application that renders and edits the availability matrix

## Run with Docker

This repository now includes a Docker Compose setup for the full stack:

- `frontend` on `http://localhost:4200`
- `backend` on `http://localhost:3000`
- `postgres` as an internal compose service used by the backend

Start everything with:

```bash
docker compose up --build
```

Stop the stack with:

```bash
docker compose down
```

The PostgreSQL data is persisted in the `postgres_data` Docker volume.

## Backend setup without Docker

If you want to run the backend directly on your machine instead of in Docker, install Rust and PostgreSQL first, then run:

```bash
cd backend
cp .env.example .env
cargo run
```

The example `.env` assumes a local PostgreSQL instance that exposes the `postgres` user with password `postgres`. Docker Compose does not use this file for the backend container; it injects container-specific values directly.

The API listens on `http://localhost:3000` by default.

## Frontend setup without Docker

Install Node.js first, then run:

```bash
cd frontend
npm install
npm start
```

The Angular dev server listens on `http://localhost:4200` by default.

## Environment variables

The backend reads these values from `.env`:

- `HOST` - server host, default `127.0.0.1`
- `PORT` - server port, default `3000`
- `DATABASE_URL` - PostgreSQL connection string, default `postgresql://postgres:postgres@localhost:5432/availability_matrix`
- `JWT_SECRET` - JWT signing secret, must be changed for real deployments
- `FRONTEND_ORIGIN` - allowed frontend origin for CORS, default `http://localhost:4200`

In Docker Compose, the backend uses `postgresql://postgres:postgres@db:5432/availability_matrix` so it can reach the PostgreSQL container over the internal Docker network.

## Main API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/matrix?year=2026`
- `PUT /api/statuses/:date`

## Notes

This repository was scaffolded in an environment without Rust and Node.js installed, so the source code is in place but local build validation still requires installing those toolchains.
