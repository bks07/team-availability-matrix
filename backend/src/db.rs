use sqlx::PgPool;

pub(crate) async fn initialize_database(db: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS locations (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL",
    )
    .execute(db)
    .await?;

    sqlx::query("ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT")
        .execute(db)
        .await?;

    sqlx::query("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT ''")
        .execute(db)
        .await?;

    sqlx::query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT ''")
        .execute(db)
        .await?;

    sqlx::query("ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''")
        .execute(db)
        .await?;

    sqlx::query("ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name TEXT NOT NULL DEFAULT ''")
        .execute(db)
        .await?;

    sqlx::query(
        r#"
        UPDATE users
        SET first_name = split_part(display_name, ' ', 1),
            last_name = CASE WHEN position(' ' in display_name) > 0
                             THEN substring(display_name from position(' ' in display_name)+1)
                             ELSE '' END
        WHERE first_name = '' AND display_name != '';
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS availability_statuses (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status_date DATE NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('W', 'V', 'A')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, status_date)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS user_permissions (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            permission TEXT NOT NULL,
            UNIQUE(user_id, permission)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS public_holidays (
            id BIGSERIAL PRIMARY KEY,
            holiday_date DATE NOT NULL,
            name TEXT NOT NULL,
            location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
            UNIQUE(holiday_date, location_id)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        "INSERT INTO system_settings (key, value) VALUES ('self_registration_enabled', 'true') ON CONFLICT (key) DO NOTHING",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_availability_statuses_date ON availability_statuses(status_date);",
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS employee_work_schedules (
            user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            monday BOOLEAN NOT NULL DEFAULT TRUE,
            tuesday BOOLEAN NOT NULL DEFAULT TRUE,
            wednesday BOOLEAN NOT NULL DEFAULT TRUE,
            thursday BOOLEAN NOT NULL DEFAULT TRUE,
            friday BOOLEAN NOT NULL DEFAULT TRUE,
            saturday BOOLEAN NOT NULL DEFAULT FALSE,
            sunday BOOLEAN NOT NULL DEFAULT FALSE,
            hours_per_week DOUBLE PRECISION,
            ignore_weekends BOOLEAN NOT NULL DEFAULT TRUE,
            ignore_public_holidays BOOLEAN NOT NULL DEFAULT TRUE
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query("ALTER TABLE employee_work_schedules ALTER COLUMN hours_per_week TYPE DOUBLE PRECISION;")
        .execute(db)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS teams (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS default_team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL;",
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS team_members (
            id BIGSERIAL PRIMARY KEY,
            team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(team_id, user_id)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS team_invitations (
            id BIGSERIAL PRIMARY KEY,
            team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            inviter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            invitee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_pending
        ON team_invitations (team_id, invitee_id)
        WHERE status = 'pending';
        "#,
    )
    .execute(db)
    .await?;

    Ok(())
}
