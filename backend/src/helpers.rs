use axum::http::StatusCode;
use chrono::{Duration, NaiveDate};
use sqlx::PgPool;

use crate::auth::{get_user_permissions, KNOWN_PERMISSIONS};
use crate::error::ApiError;
use crate::models::EmployeeRow;
use crate::types::responses::PublicUser;

pub(crate) async fn find_public_user(db: &PgPool, user_id: i64) -> Result<PublicUser, ApiError> {
    let row = sqlx::query_as::<_, EmployeeRow>(
        "SELECT id, email, display_name, location_id, photo_url FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load current user: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists"))?;

    let permissions = get_user_permissions(db, user_id).await?;
    Ok(PublicUser {
        id: row.id,
        email: row.email,
        display_name: row.display_name,
        location_id: row.location_id,
        photo_url: row.photo_url,
        permissions,
    })
}

pub(crate) async fn delete_photo_file_best_effort(photo_url: &str) {
    let relative_path = if let Some(path) = photo_url.strip_prefix("/uploads/") {
        path
    } else if let Some(path) = photo_url.strip_prefix("uploads/") {
        path
    } else {
        return;
    };

    let full_path = std::path::Path::new("uploads").join(relative_path);
    let _ = tokio::fs::remove_file(full_path).await;
}

pub(crate) fn normalize_email(email: &str) -> Result<String, ApiError> {
    let normalized = email.trim().to_lowercase();
    if normalized.is_empty() || !normalized.contains('@') {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "A valid email address is required",
        ));
    }

    Ok(normalized)
}

pub(crate) fn normalize_display_name(display_name: &str) -> Result<String, ApiError> {
    let normalized = display_name.trim();
    if normalized.len() < 2 || normalized.len() > 80 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Display name must be between 2 and 80 characters",
        ));
    }

    Ok(normalized.to_string())
}

pub(crate) fn normalize_location_name(name: &str) -> Result<String, ApiError> {
    let normalized = name.trim();
    if normalized.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Location name is required",
        ));
    }

    Ok(normalized.to_string())
}

pub(crate) fn normalize_public_holiday_name(name: &str) -> Result<String, ApiError> {
    let normalized = name.trim();
    if normalized.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Public holiday name is required",
        ));
    }

    Ok(normalized.to_string())
}

pub(crate) async fn ensure_location_exists(db: &PgPool, location_id: i64) -> Result<(), ApiError> {
    let exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM locations WHERE id = $1 LIMIT 1")
        .bind(location_id)
        .fetch_optional(db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check location: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::BAD_REQUEST, "Location not found"));
    }

    Ok(())
}

pub(crate) async fn table_exists(db: &PgPool, table_name: &str) -> Result<bool, ApiError> {
    let exists = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1",
    )
    .bind(table_name)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check table existence: {error}"),
        )
    })?
    .is_some();

    Ok(exists)
}

pub(crate) async fn ensure_user_exists(db: &PgPool, user_id: i64) -> Result<(), ApiError> {
    let exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM users WHERE id = $1 LIMIT 1")
        .bind(user_id)
        .fetch_optional(db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check user: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "User not found"));
    }

    Ok(())
}

pub(crate) fn is_known_permission(permission: &str) -> bool {
    KNOWN_PERMISSIONS.contains(&permission)
}

pub(crate) fn build_day_list(year: i32) -> Result<Vec<String>, ApiError> {
    let start = NaiveDate::from_ymd_opt(year, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;
    let next_year_start = NaiveDate::from_ymd_opt(year + 1, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;

    let total_days = (next_year_start - start).num_days();
    Ok((0..total_days)
        .map(|offset| (start + Duration::days(offset)).to_string())
        .collect())
}
