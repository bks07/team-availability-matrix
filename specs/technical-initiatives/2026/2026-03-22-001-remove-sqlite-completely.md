# Technical Initiative: Replace SQLite with PostgreSQL

## WHAT

Remove all SQLite database artifacts from the project and replace them with PostgreSQL equivalents so that PostgreSQL is the sole database engine used across development, Docker, and production.

## WHY

The SQLite database is a leftover from the time when the project was initiated. PostgreSQL provides stronger typing, better concurrency support, and is the intended production database.

## IN-SCOPE

- Replace the `sqlx` feature flag from `sqlite` to `postgres` in `backend/Cargo.toml`.
- Replace all SQLite-specific Rust types (`SqlitePool`, `SqlitePoolOptions`, `SqliteConnectOptions`) with their PostgreSQL counterparts (`PgPool`, `PgPoolOptions`, `PgConnectOptions`) in `backend/src/main.rs`.
- Convert all SQL DDL in `initialize_database()` from SQLite dialect to PostgreSQL dialect:
  - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY` (or `BIGSERIAL`).
  - `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` → `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
  - SQLite-style `ALTER TABLE … ADD COLUMN` migration workaround → proper PostgreSQL migration or conditional DDL.
- Convert all SQL DML from SQLite parameter placeholders (`?`) to PostgreSQL positional placeholders (`$1`, `$2`, …).
- Replace `last_insert_rowid()` calls with `RETURNING id` clauses.
- Replace `UNIQUE constraint failed` error string matching with the PostgreSQL equivalent (`duplicate key value violates unique constraint`).
- Update `DATABASE_URL` default value and `.env.example` to a PostgreSQL connection string (e.g. `postgres://user:pass@localhost:5432/availability_matrix`).
- Update `docker-compose.yml`:
  - Add a `postgres` service with a named volume for data persistence.
  - Remove the `sqlite_data` volume.
  - Update the backend service environment to use the PostgreSQL connection string and add a `depends_on` for the postgres service.
- Update `backend/Dockerfile`:
  - Remove `libsqlite3-dev` (build stage) and `libsqlite3-0` (runtime stage) packages.
  - Add `libpq-dev` (build stage) and `libpq5` (runtime stage) packages if dynamically linking, or rely on `sqlx` with `runtime-tokio-rustls` with the `postgres` feature.
  - Remove the `RUN mkdir -p data` directive (no local file-based DB needed).
- Remove `backend/data/` directory and its `.gitkeep`.
- Update `.gitignore` to remove SQLite-specific entries (`*.db`, `*.db-shm`, `*.db-wal`).
- Update `README.md` to reflect PostgreSQL setup, connection configuration, and developer instructions.
- Update `.github/copilot-instructions.md` to replace all SQLite references with PostgreSQL equivalents.

## OUT-OF-SCOPE

- Any frontend code changes (React components, services, routing, styles).
- API contract changes (request and response shapes remain identical).
- New product features unrelated to the database migration.
- Introduction of a migration framework (e.g. `sqlx migrate`); the existing inline `CREATE TABLE IF NOT EXISTS` approach will be preserved for now.
- Schema redesign or normalisation changes beyond what is required for PostgreSQL compatibility.

## ACCEPTANCE CRITERIA

- The backend compiles and runs successfully against a PostgreSQL database.
- All existing API endpoints behave identically from the frontend perspective.
- `cargo build`, `cargo clippy`, and `cargo test` pass with no SQLite-related warnings or errors.
- `docker-compose up` starts a PostgreSQL container and a backend that connects to it successfully.
- No SQLite references remain in source code, configuration files, Dockerfiles, or documentation.
- The `backend/data/` directory and all SQLite gitignore entries are removed.
- Database schema created by `initialize_database()` is valid PostgreSQL DDL.
- All parameterised queries use PostgreSQL `$N` placeholder syntax.

## ADDITIONAL INFORMATION

Suggested implementation sequence:

1. Switch `Cargo.toml` feature flag and update Rust types (`SqlitePool` → `PgPool`, etc.).
2. Convert all DDL in `initialize_database()` to PostgreSQL syntax.
3. Convert all DML queries: parameter placeholders (`?` → `$N`), `last_insert_rowid()` → `RETURNING id`, error strings.
4. Update `.env.example`, `DATABASE_URL` default, `docker-compose.yml`, and `backend/Dockerfile`.
5. Remove `backend/data/` directory and update `.gitignore`.
6. Update `README.md` and `.github/copilot-instructions.md`.
7. Full build, lint, and test verification.

Notes:

- SQLite uses `?` for bind parameters; PostgreSQL uses `$1`, `$2`, etc. Every `sqlx::query` call must be updated.
- SQLite's `last_insert_rowid()` has no PostgreSQL equivalent; use `RETURNING id` in INSERT queries and read the result with `sqlx::query_scalar` or `sqlx::query_as` instead.
- The `UNIQUE constraint failed` error string used in conflict handling must be replaced with PostgreSQL's `duplicate key value violates unique constraint`.
- The `ALTER TABLE users ADD COLUMN location_id …` migration workaround currently catches the SQLite error `duplicate column name`; PostgreSQL uses a different error (`column … of relation … already exists`) — or the migration can switch to `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (PostgreSQL 9.6+).

