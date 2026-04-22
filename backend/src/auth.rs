use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::http::{HeaderMap, StatusCode};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::error::ApiError;

// ── New permission keys (18 total) ──────────────────────────────────────
pub(crate) const PERM_USERS_LIST: &str = "users.list";
pub(crate) const PERM_USERS_CREATE: &str = "users.create";
pub(crate) const PERM_USERS_EDIT: &str = "users.edit";
pub(crate) const PERM_USERS_DELETE: &str = "users.delete";
pub(crate) const PERM_LOCATIONS_VIEW: &str = "locations.view";
pub(crate) const PERM_LOCATIONS_CREATE: &str = "locations.create";
pub(crate) const PERM_LOCATIONS_EDIT: &str = "locations.edit";
pub(crate) const PERM_LOCATIONS_DELETE: &str = "locations.delete";
pub(crate) const PERM_PUBLIC_HOLIDAYS_VIEW: &str = "public_holidays.view";
pub(crate) const PERM_PUBLIC_HOLIDAYS_CREATE: &str = "public_holidays.create";
pub(crate) const PERM_PUBLIC_HOLIDAYS_EDIT: &str = "public_holidays.edit";
pub(crate) const PERM_PUBLIC_HOLIDAYS_DELETE: &str = "public_holidays.delete";
pub(crate) const PERM_PERMISSION_PROFILES_VIEW: &str = "permission_profiles.view";
pub(crate) const PERM_PERMISSION_PROFILES_CREATE: &str = "permission_profiles.create";
pub(crate) const PERM_PERMISSION_PROFILES_EDIT: &str = "permission_profiles.edit";
pub(crate) const PERM_PERMISSION_PROFILES_DELETE: &str = "permission_profiles.delete";
pub(crate) const PERM_PERMISSION_PROFILES_ASSIGN: &str = "permission_profiles.assign";
pub(crate) const PERM_SETTINGS_MANAGE: &str = "settings.manage";
pub(crate) const PERM_TEAMS_VIEW: &str = "teams.view";
pub(crate) const PERM_TEAMS_CREATE: &str = "teams.create";
pub(crate) const PERM_TEAMS_EDIT: &str = "teams.edit";
pub(crate) const PERM_TEAMS_DELETE: &str = "teams.delete";
pub(crate) const PERM_TEAMS_ASSIGN: &str = "teams.assign";

pub(crate) const KNOWN_PERMISSIONS: [&str; 23] = [
    PERM_USERS_LIST,
    PERM_USERS_CREATE,
    PERM_USERS_EDIT,
    PERM_USERS_DELETE,
    PERM_LOCATIONS_VIEW,
    PERM_LOCATIONS_CREATE,
    PERM_LOCATIONS_EDIT,
    PERM_LOCATIONS_DELETE,
    PERM_PUBLIC_HOLIDAYS_VIEW,
    PERM_PUBLIC_HOLIDAYS_CREATE,
    PERM_PUBLIC_HOLIDAYS_EDIT,
    PERM_PUBLIC_HOLIDAYS_DELETE,
    PERM_PERMISSION_PROFILES_VIEW,
    PERM_PERMISSION_PROFILES_CREATE,
    PERM_PERMISSION_PROFILES_EDIT,
    PERM_PERMISSION_PROFILES_DELETE,
    PERM_PERMISSION_PROFILES_ASSIGN,
    PERM_SETTINGS_MANAGE,
    PERM_TEAMS_VIEW,
    PERM_TEAMS_CREATE,
    PERM_TEAMS_EDIT,
    PERM_TEAMS_DELETE,
    PERM_TEAMS_ASSIGN,
];

pub(crate) const SUPER_ADMIN_PROFILE_NAME: &str = "Super Admin";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PermissionCatalogEntry {
    pub(crate) key: &'static str,
    pub(crate) description: &'static str,
    pub(crate) category: &'static str,
}

pub(crate) const PERMISSION_CATALOG: [PermissionCatalogEntry; 23] = [
    PermissionCatalogEntry {
        key: "users.list",
        description: "View list of all users in admin area",
        category: "User Administration",
    },
    PermissionCatalogEntry {
        key: "users.create",
        description: "Create new user accounts via admin",
        category: "User Administration",
    },
    PermissionCatalogEntry {
        key: "users.edit",
        description: "Edit user details, work schedules, bulk-assign locations",
        category: "User Administration",
    },
    PermissionCatalogEntry {
        key: "users.delete",
        description: "Delete user accounts",
        category: "User Administration",
    },
    PermissionCatalogEntry {
        key: "locations.view",
        description: "View list of locations",
        category: "Location Management",
    },
    PermissionCatalogEntry {
        key: "locations.create",
        description: "Create new locations",
        category: "Location Management",
    },
    PermissionCatalogEntry {
        key: "locations.edit",
        description: "Edit existing locations",
        category: "Location Management",
    },
    PermissionCatalogEntry {
        key: "locations.delete",
        description: "Delete locations",
        category: "Location Management",
    },
    PermissionCatalogEntry {
        key: "public_holidays.view",
        description: "View public holidays",
        category: "Public Holiday Management",
    },
    PermissionCatalogEntry {
        key: "public_holidays.create",
        description: "Create public holidays",
        category: "Public Holiday Management",
    },
    PermissionCatalogEntry {
        key: "public_holidays.edit",
        description: "Edit existing public holidays",
        category: "Public Holiday Management",
    },
    PermissionCatalogEntry {
        key: "public_holidays.delete",
        description: "Delete public holidays",
        category: "Public Holiday Management",
    },
    PermissionCatalogEntry {
        key: "permission_profiles.view",
        description: "View permission profiles and user assignments",
        category: "Permission Management",
    },
    PermissionCatalogEntry {
        key: "permission_profiles.create",
        description: "Create new permission profiles",
        category: "Permission Management",
    },
    PermissionCatalogEntry {
        key: "permission_profiles.edit",
        description: "Edit permission profile name and permissions",
        category: "Permission Management",
    },
    PermissionCatalogEntry {
        key: "permission_profiles.delete",
        description: "Delete permission profiles",
        category: "Permission Management",
    },
    PermissionCatalogEntry {
        key: "permission_profiles.assign",
        description: "Assign or unassign profiles to/from users",
        category: "Permission Management",
    },
    PermissionCatalogEntry {
        key: "settings.manage",
        description: "Manage system settings",
        category: "System Settings",
    },
    PermissionCatalogEntry {
        key: "teams.view",
        description: "View all teams and their members",
        category: "Team Administration",
    },
    PermissionCatalogEntry {
        key: "teams.create",
        description: "Create new teams",
        category: "Team Administration",
    },
    PermissionCatalogEntry {
        key: "teams.edit",
        description: "Edit team details",
        category: "Team Administration",
    },
    PermissionCatalogEntry {
        key: "teams.delete",
        description: "Delete teams",
        category: "Team Administration",
    },
    PermissionCatalogEntry {
        key: "teams.assign",
        description: "Assign or remove users from teams",
        category: "Team Administration",
    },
];

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Claims {
    pub(crate) sub: i64,
    pub(crate) exp: usize,
}

pub(crate) async fn get_user_permissions(
    db: &PgPool,
    user_id: i64,
) -> Result<Vec<String>, ApiError> {
    sqlx::query_scalar::<_, String>(
        r#"
        SELECT pp.permission_key
        FROM user_permission_profiles upp
        JOIN profile_permissions pp ON pp.profile_id = upp.profile_id
        WHERE upp.user_id = $1
        ORDER BY pp.permission_key ASC
        "#,
    )
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user permissions: {error}"),
        )
    })
}

pub(crate) async fn get_user_profile_name(
    db: &PgPool,
    user_id: i64,
) -> Result<Option<String>, ApiError> {
    sqlx::query_scalar::<_, String>(
        r#"
        SELECT p.name
        FROM user_permission_profiles upp
        JOIN permission_profiles p ON p.id = upp.profile_id
        WHERE upp.user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user profile name: {error}"),
        )
    })
}

pub(crate) async fn require_permission(
    headers: &HeaderMap,
    db: &PgPool,
    jwt_secret: &str,
    permission: &str,
) -> Result<Claims, ApiError> {
    let claims = authorize(headers, jwt_secret)?;

    let has_permission = sqlx::query_scalar::<_, i32>(
        r#"
        SELECT 1
        FROM user_permission_profiles upp
        JOIN profile_permissions pp ON pp.profile_id = upp.profile_id
        WHERE upp.user_id = $1 AND pp.permission_key = $2
        LIMIT 1
        "#,
    )
    .bind(claims.sub)
    .bind(permission)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to verify user permission: {error}"),
        )
    })?
    .is_some();

    if !has_permission {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Insufficient permissions",
        ));
    }

    Ok(claims)
}

pub(crate) fn validate_password(password: &str) -> Result<(), ApiError> {
    if password.len() < 8 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Password must be at least 8 characters long",
        ));
    }

    Ok(())
}

pub(crate) fn hash_password(password: &str) -> Result<String, ApiError> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to hash password: {error}"),
            )
        })
}

pub(crate) fn verify_password(password: &str, password_hash: &str) -> Result<(), ApiError> {
    let parsed_hash = PasswordHash::new(password_hash).map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Stored password hash is invalid: {error}"),
        )
    })?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| ApiError::new(StatusCode::UNAUTHORIZED, "Invalid email or password"))
}

pub(crate) fn issue_token(user_id: i64, jwt_secret: &str) -> Result<String, ApiError> {
    let expiration = Utc::now() + Duration::days(7);
    let claims = Claims {
        sub: user_id,
        exp: expiration.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to issue auth token: {error}"),
        )
    })
}

pub(crate) fn authorize(headers: &HeaderMap, jwt_secret: &str) -> Result<Claims, ApiError> {
    let bearer = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Missing Authorization header"))?;

    let token = bearer.strip_prefix("Bearer ").ok_or_else(|| {
        ApiError::new(
            StatusCode::UNAUTHORIZED,
            "Authorization header must use Bearer token",
        )
    })?;

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| {
        ApiError::new(
            StatusCode::UNAUTHORIZED,
            "Authentication token is invalid or expired",
        )
    })
}
