use sqlx::PgPool;
use crate::auth::{KNOWN_PERMISSIONS, SUPER_ADMIN_PROFILE_NAME};
use crate::helpers::column_exists;

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

    // ── Permission profiles tables ───────────────────────────────────────
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS permission_profiles (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            is_built_in BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS profile_permissions (
            profile_id BIGINT NOT NULL REFERENCES permission_profiles(id) ON DELETE CASCADE,
            permission_key TEXT NOT NULL,
            PRIMARY KEY (profile_id, permission_key)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS user_permission_profiles (
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            profile_id BIGINT NOT NULL REFERENCES permission_profiles(id) ON DELETE RESTRICT,
            assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (user_id)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS public_holidays (
            id           BIGSERIAL PRIMARY KEY,
            holiday_date DATE NOT NULL,
            name         TEXT NOT NULL,
            UNIQUE(holiday_date, name)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS public_holiday_locations (
            holiday_id  BIGINT NOT NULL REFERENCES public_holidays(id) ON DELETE CASCADE,
            location_id BIGINT NOT NULL REFERENCES locations(id)       ON DELETE CASCADE,
            PRIMARY KEY (holiday_id, location_id)
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
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS user_team_favorites (
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (user_id, team_id)
        );
        "#,
    )
    .execute(db)
    .await?;


    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS permission_audit_log (
            id BIGSERIAL PRIMARY KEY,
            admin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            profile_id BIGINT,
            profile_name TEXT,
            target_user_id BIGINT,
            target_user_name TEXT,
            details JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created_at
        ON permission_audit_log(created_at DESC);
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_permission_audit_log_event_type
        ON permission_audit_log(event_type);
        "#,
    )
    .execute(db)
    .await?;

    // ── Seed built-in Super Admin profile ────────────────────────────────
    sqlx::query(
        "INSERT INTO permission_profiles (name, is_built_in) VALUES ($1, TRUE) ON CONFLICT (name) DO NOTHING",
    )
    .bind(SUPER_ADMIN_PROFILE_NAME)
    .execute(db)
    .await?;

    let super_admin_profile_id = sqlx::query_scalar::<_, i64>(
        "SELECT id FROM permission_profiles WHERE name = $1",
    )
    .bind(SUPER_ADMIN_PROFILE_NAME)
    .fetch_one(db)
    .await?;

    // Sync all 18 permissions into the Super Admin profile
    for perm in KNOWN_PERMISSIONS {
        sqlx::query(
            "INSERT INTO profile_permissions (profile_id, permission_key) VALUES ($1, $2) ON CONFLICT (profile_id, permission_key) DO NOTHING",
        )
        .bind(super_admin_profile_id)
        .bind(perm)
        .execute(db)
        .await?;
    }

    // ── Migrate from user_permissions if the table still exists ──────────
    let old_table_exists = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_permissions' LIMIT 1",
    )
    .fetch_optional(db)
    .await?
    .is_some();

    if old_table_exists {
        // Find all users who have permissions but no profile assignment yet
        let users_with_perms: Vec<(i64,)> = sqlx::query_as(
            "SELECT DISTINCT user_id FROM user_permissions WHERE user_id NOT IN (SELECT user_id FROM user_permission_profiles)",
        )
        .fetch_all(db)
        .await?;

        for (user_id,) in &users_with_perms {
            let user_perms: Vec<String> = sqlx::query_scalar(
                "SELECT permission FROM user_permissions WHERE user_id = $1 ORDER BY permission",
            )
            .bind(user_id)
            .fetch_all(db)
            .await?;

            if user_perms.is_empty() {
                continue;
            }

            // Check if a profile with exactly these permissions already exists
            let perm_list = user_perms.join(", ");
            let migrated_name = format!("Migrated — {}", perm_list);

            // Try to find an existing migrated profile with the same name
            let existing_profile_id = sqlx::query_scalar::<_, i64>(
                "SELECT id FROM permission_profiles WHERE name = $1",
            )
            .bind(&migrated_name)
            .fetch_optional(db)
            .await?;

            let profile_id = if let Some(id) = existing_profile_id {
                id
            } else {
                let new_id = sqlx::query_scalar::<_, i64>(
                    "INSERT INTO permission_profiles (name, is_built_in) VALUES ($1, FALSE) RETURNING id",
                )
                .bind(&migrated_name)
                .fetch_one(db)
                .await?;

                for perm in &user_perms {
                    sqlx::query(
                        "INSERT INTO profile_permissions (profile_id, permission_key) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    )
                    .bind(new_id)
                    .bind(perm)
                    .execute(db)
                    .await?;
                }

                new_id
            };

            sqlx::query(
                "INSERT INTO user_permission_profiles (user_id, profile_id) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING",
            )
            .bind(user_id)
            .bind(profile_id)
            .execute(db)
            .await?;
        }

        // Override user id=1 → Super Admin profile
        let user_one_exists = sqlx::query_scalar::<_, i32>(
            "SELECT 1 FROM users WHERE id = 1 LIMIT 1",
        )
        .fetch_optional(db)
        .await?
        .is_some();

        if user_one_exists {
            sqlx::query(
                "INSERT INTO user_permission_profiles (user_id, profile_id) VALUES (1, $1) ON CONFLICT (user_id) DO UPDATE SET profile_id = $1",
            )
            .bind(super_admin_profile_id)
            .execute(db)
            .await?;
        }

        // Drop the old table
        sqlx::query("DROP TABLE IF EXISTS user_permissions")
            .execute(db)
            .await?;
    } else {
        // Fresh DB — just ensure user id=1 has Super Admin if they exist
        let user_one_exists = sqlx::query_scalar::<_, i32>(
            "SELECT 1 FROM users WHERE id = 1 LIMIT 1",
        )
        .fetch_optional(db)
        .await?
        .is_some();

        if user_one_exists {
            sqlx::query(
                "INSERT INTO user_permission_profiles (user_id, profile_id) VALUES (1, $1) ON CONFLICT (user_id) DO NOTHING",
            )
            .bind(super_admin_profile_id)
            .execute(db)
            .await?;
        }
    }

        // ── ASD-17 migration: move location_id from public_holidays to junction table ──
        if column_exists(db, "public_holidays", "location_id").await? {
                sqlx::query(
                        "INSERT INTO public_holiday_locations (holiday_id, location_id) \
                         SELECT id, location_id FROM public_holidays WHERE location_id IS NOT NULL \
                         ON CONFLICT DO NOTHING"
                )
                .execute(db)
                .await?;

                sqlx::query("ALTER TABLE public_holidays DROP COLUMN location_id")
                        .execute(db)
                        .await?;
        }

        // Add unique constraint on (holiday_date, name) if it doesn't exist yet
        sqlx::query(
                r#"DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'public_holidays_holiday_date_name_key'
                            AND conrelid = 'public_holidays'::regclass
                    ) THEN
                        ALTER TABLE public_holidays ADD CONSTRAINT public_holidays_holiday_date_name_key UNIQUE (holiday_date, name);
                    END IF;
                END $$"#
        )
        .execute(db)
        .await?;

    Ok(())
}
