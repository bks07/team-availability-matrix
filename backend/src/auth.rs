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

pub(crate) const PERMISSION_ADMIN: &str = "admin";
pub(crate) const PERMISSION_MANAGE_LOCATIONS: &str = "manage_locations";
pub(crate) const PERMISSION_MANAGE_PUBLIC_HOLIDAYS: &str = "manage_public_holidays";
pub(crate) const PERMISSION_SUPER_ADMIN: &str = "super_admin";
pub(crate) const KNOWN_PERMISSIONS: [&str; 4] = [
    PERMISSION_ADMIN,
    PERMISSION_MANAGE_LOCATIONS,
    PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    PERMISSION_SUPER_ADMIN,
];
pub(crate) const FIRST_USER_PERMISSIONS: [&str; 4] = [
    PERMISSION_ADMIN,
    PERMISSION_MANAGE_LOCATIONS,
    PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    PERMISSION_SUPER_ADMIN,
];

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct Claims {
    pub(crate) sub: i64,
    pub(crate) exp: usize,
}

pub(crate) async fn get_user_permissions(db: &PgPool, user_id: i64) -> Result<Vec<String>, ApiError> {
    sqlx::query_scalar::<_, String>(
        "SELECT permission FROM user_permissions WHERE user_id = $1 ORDER BY permission ASC",
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

pub(crate) async fn require_permission(
    headers: &HeaderMap,
    db: &PgPool,
    jwt_secret: &str,
    permission: &str,
) -> Result<Claims, ApiError> {
    let claims = authorize(headers, jwt_secret)?;

    let has_permission = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission = $2 LIMIT 1",
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

    let token = bearer
        .strip_prefix("Bearer ")
        .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Authorization header must use Bearer token"))?;

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| ApiError::new(StatusCode::UNAUTHORIZED, "Authentication token is invalid or expired"))
}
