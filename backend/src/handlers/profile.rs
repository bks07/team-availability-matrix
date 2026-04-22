use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
    extract::{Multipart, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{
    authorize, get_user_permissions, get_user_profile_name, hash_password, validate_password,
    verify_password,
};
use crate::error::ApiError;
use crate::helpers::{
    delete_photo_file_best_effort, derive_display_name, ensure_location_exists, find_public_user,
    normalize_email, normalize_name_fields,
};
use crate::models::EmployeeRow;
use crate::state::AppState;
use crate::types::requests::{ChangePasswordRequest, UpdateProfileRequest};
use crate::types::responses::PublicUser;

pub(crate) async fn update_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<PublicUser>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;
    let email = normalize_email(&payload.email)?;
    let (title, first_name, middle_name, last_name) = normalize_name_fields(
        &payload.title,
        &payload.first_name,
        &payload.middle_name,
        &payload.last_name,
    )?;
    let display_name = derive_display_name(&title, &first_name, &middle_name, &last_name);

    if let Some(location_id) = payload.location_id {
        ensure_location_exists(&state.db, location_id).await?;
    }

    if let Some(Some(team_id)) = payload.default_team_id {
        let membership_exists = sqlx::query_scalar::<_, i32>(
            "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2",
        )
        .bind(team_id)
        .bind(claims.sub)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to validate team membership: {error}"),
            )
        })?
        .is_some();

        if !membership_exists {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "You are not a member of this team",
            ));
        }
    }

    let should_update_default_team = payload.default_team_id.is_some();
    let default_team_id = payload.default_team_id.flatten();

    let updated = sqlx::query_as::<_, EmployeeRow>(
        r#"
        WITH updated AS (
            UPDATE users
            SET title = $1,
                first_name = $2,
                middle_name = $3,
                last_name = $4,
                display_name = $5,
                email = $6,
                location_id = $7,
                default_team_id = CASE WHEN $8 THEN $9 ELSE default_team_id END
            WHERE id = $10
            RETURNING id
        )
        SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.default_team_id, u.location_id, u.photo_url, l.name AS location_name
        FROM users u
        LEFT JOIN locations l ON u.location_id = l.id
        WHERE u.id = (SELECT id FROM updated)
        "#,
    )
    .bind(&title)
    .bind(&first_name)
    .bind(&middle_name)
    .bind(&last_name)
    .bind(&display_name)
    .bind(&email)
    .bind(payload.location_id)
    .bind(should_update_default_team)
    .bind(default_team_id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await;

    let updated = match updated {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Err(ApiError::new(
                StatusCode::UNAUTHORIZED,
                "Current user no longer exists",
            ))
        }
        Err(error) => {
            if error
                .to_string()
                .contains("duplicate key value violates unique constraint")
            {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "An account with that email already exists",
                ));
            }

            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to update profile: {error}"),
            ));
        }
    };

    let permissions = get_user_permissions(&state.db, claims.sub).await?;
    let permission_profile_name = get_user_profile_name(&state.db, claims.sub).await?;
    Ok(Json(PublicUser {
        id: updated.id,
        email: updated.email,
        display_name: updated.display_name,
        title: updated.title,
        first_name: updated.first_name,
        middle_name: updated.middle_name,
        last_name: updated.last_name,
        default_team_id: updated.default_team_id,
        location_id: updated.location_id,
        location_name: updated.location_name,
        photo_url: updated.photo_url,
        permissions,
        permission_profile_name,
    }))
}

pub(crate) async fn upload_profile_photo(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Result<Json<PublicUser>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let field = multipart
        .next_field()
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Failed to read uploaded file: {error}"),
            )
        })?
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "No file was provided"))?;

    let content_type = field.content_type().map(str::to_string).ok_or_else(|| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            "Uploaded file is missing content type",
        )
    })?;

    let extension = match content_type.as_str() {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif",
        _ => {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Unsupported image format. Supported formats: JPEG, PNG, WebP, GIF",
            ))
        }
    };

    let bytes = field.bytes().await.map_err(|error| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("Failed to read uploaded file bytes: {error}"),
        )
    })?;

    if bytes.len() > 2 * 1024 * 1024 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "File size exceeds the 2MB limit",
        ));
    }

    let existing_photo_url =
        sqlx::query_scalar::<_, Option<String>>("SELECT photo_url FROM users WHERE id = $1")
            .bind(claims.sub)
            .fetch_optional(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to load current profile photo: {error}"),
                )
            })?
            .ok_or_else(|| {
                ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists")
            })?;

    tokio::fs::create_dir_all("uploads/photos")
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to prepare upload directory: {error}"),
            )
        })?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to generate upload timestamp: {error}"),
            )
        })?
        .as_millis();
    let filename = format!("{}_{}.{}", claims.sub, timestamp, extension);
    let file_path = format!("uploads/photos/{filename}");
    let photo_url = format!("/uploads/photos/{filename}");

    tokio::fs::write(&file_path, &bytes)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to store uploaded file: {error}"),
            )
        })?;

    sqlx::query("UPDATE users SET photo_url = $1 WHERE id = $2")
        .bind(&photo_url)
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to save profile photo reference: {error}"),
            )
        })?;

    if let Some(previous) = existing_photo_url {
        delete_photo_file_best_effort(&previous).await;
    }

    let user = find_public_user(&state.db, claims.sub).await?;
    Ok(Json(user))
}

pub(crate) async fn delete_profile_photo(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<StatusCode, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let existing_photo_url =
        sqlx::query_scalar::<_, Option<String>>("SELECT photo_url FROM users WHERE id = $1")
            .bind(claims.sub)
            .fetch_optional(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to load current profile photo: {error}"),
                )
            })?
            .ok_or_else(|| {
                ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists")
            })?;

    if let Some(photo_url) = existing_photo_url {
        delete_photo_file_best_effort(&photo_url).await;
    }

    sqlx::query("UPDATE users SET photo_url = NULL WHERE id = $1")
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear profile photo: {error}"),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn change_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let current_password_hash =
        sqlx::query_scalar::<_, String>("SELECT password_hash FROM users WHERE id = $1")
            .bind(claims.sub)
            .fetch_optional(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to load current password: {error}"),
                )
            })?
            .ok_or_else(|| {
                ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists")
            })?;

    if let Err(error) = verify_password(&payload.current_password, &current_password_hash) {
        if error.status == StatusCode::UNAUTHORIZED {
            return Err(ApiError::new(
                StatusCode::UNAUTHORIZED,
                "Current password is incorrect",
            ));
        }
        return Err(error);
    }

    validate_password(&payload.new_password)?;
    let new_password_hash = hash_password(&payload.new_password)?;

    sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
        .bind(new_password_hash)
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to update password: {error}"),
            )
        })?;

    Ok(Json(
        serde_json::json!({ "message": "Password changed successfully" }),
    ))
}
