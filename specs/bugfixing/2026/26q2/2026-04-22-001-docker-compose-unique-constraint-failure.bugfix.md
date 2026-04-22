---
status: DONE
---

# Docker Compose Fails Due to Duplicate public_holidays Rows Blocking UNIQUE Constraint Creation

## CURRENT BEHAVIOR

Running `docker compose up --build` results in a startup failure after the build phase completes successfully. During PostgreSQL initialization, a migration attempts to add a UNIQUE constraint on `public_holidays(holiday_date, name)`. The operation fails because duplicate rows already exist in the table — specifically, multiple entries for `(2026-01-01, Neujahr)`. The backend process then exits with code 1, leaving the application unavailable.

PostgreSQL reports:

```
ERROR:  could not create unique index "public_holidays_holiday_date_name_key"
DETAIL:  Key (holiday_date, name)=(2026-01-01, Neujahr) is duplicated.
```

The backend surfaces this as a database error with PostgreSQL error code `23505`.

## EXPECTED BEHAVIOR

`docker compose up --build` completes without errors on both a fresh database and an already-seeded database. The UNIQUE constraint on `public_holidays(holiday_date, name)` is applied successfully in all cases. Re-running `docker compose up --build` against an existing database does not produce constraint violations.

## IMPACT

The application cannot be started via Docker Compose when duplicate rows are present in `public_holidays`. This blocks all local development and any deployment that relies on `docker compose up --build`, including initial setup on a clean environment.

## STEPS TO REPRODUCE

1. Clone the repository.
2. Run `docker compose up --build`.
3. Observe that the build phase completes successfully (frontend and backend images built).
4. Observe that PostgreSQL startup fails with the UNIQUE constraint error shown above.
5. Observe that the backend exits with code 1.

## ADDITIONAL INFORMATION

**Root cause:** The `public_holidays` table contains duplicate `(holiday_date, name)` pairs introduced by seed data or prior migrations. A subsequent migration unconditionally attempts to add a UNIQUE constraint on those columns without first ensuring the existing data is free of duplicates. PostgreSQL rejects the constraint creation because uniqueness is already violated.

**Expected fix direction:** The database initialization and migration sequence must guarantee that `public_holidays` contains no duplicate `(holiday_date, name)` pairs before the UNIQUE constraint is applied, or seed inserts must be written in a way that skips rows which would create duplicates rather than inserting them unconditionally.

**Acceptance criteria:**
1. `docker compose up --build` completes without errors.
2. The UNIQUE constraint on `public_holidays(holiday_date, name)` is applied successfully on a clean or previously-seeded database.
3. Re-running `docker compose up --build` on an already-seeded database does not fail.

**Jira:** ASD-18
**App:** team-availability-matrix
**Dependencies:** None
