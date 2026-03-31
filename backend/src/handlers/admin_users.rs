use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{
    get_user_permissions, hash_password, require_permission, validate_password, PERMISSION_ADMIN,
};
use crate::error::ApiError;
use crate::helpers::{
    delete_photo_file_best_effort, ensure_location_exists, ensure_user_exists,
    derive_display_name, normalize_email, normalize_name_fields,
};
use crate::models::EmployeeRow;
use crate::state::AppState;
use crate::types::requests::{
    AdminCreateUserRequest, AdminUpdateUserRequest, BulkAssignLocationRequest,
};
use crate::types::responses::{AdminUserResponse, BulkAssignLocationResponse};

pub(crate) async fn list_admin_users(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<AdminUserResponse>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_ADMIN,
    )
    .await?;

    let users = sqlx::query_as::<_, EmployeeRow>(
        "SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.location_id, u.photo_url, l.name AS location_name FROM users u LEFT JOIN locations l ON u.location_id = l.id ORDER BY LOWER(u.display_name) ASC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load users: {error}"),
        )
    })?;

    let mut response = Vec::with_capacity(users.len());
    for user in users {
        let permissions = get_user_permissions(&state.db, user.id).await?;
        response.push(AdminUserResponse {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            title: user.title,
            first_name: user.first_name,
            middle_name: user.middle_name,
            last_name: user.last_name,
            location_id: user.location_id,
            location_name: user.location_name,
            photo_url: user.photo_url,
            permissions,
        });
    }

    Ok(Json(response))
}



pub(crate) async fn admin_create_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AdminCreateUserRequest>,
) -> Result<(StatusCode, Json<AdminUserResponse>), ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    let email = normalize_email(&payload.email)?;
    let (title, first_name, middle_name, last_name) =
        normalize_name_fields("", &payload.first_name, "", &payload.last_name)?;
    let display_name = derive_display_name(&title, &first_name, &middle_name, &last_name);
    validate_password(&payload.password)?;

    if let Some(location_id) = payload.location_id {
        ensure_location_exists(&state.db, location_id).await?;
    }

    let password_hash = hash_password(&payload.password)?;

    let created_user_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO users (email, display_name, password_hash, title, first_name, middle_name, last_name, location_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
    )
    .bind(&email)
    .bind(&display_name)
    .bind(password_hash)
    .bind(&title)
    .bind(&first_name)
    .bind(&middle_name)
    .bind(&last_name)
    .bind(payload.location_id)
    .fetch_one(&state.db)
    .await;

    let created_user_id = match created_user_id {
        Ok(user) => user,
        Err(error) => {
            if error
                .to_string()
                .contains("duplicate key value violates unique constraint")
            {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "A user with this email already exists",
                ));
            }

            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create user: {error}"),
            ));
        }
    };

    let created_user = sqlx::query_as::<_, EmployeeRow>(
        "SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.location_id, u.photo_url, l.name AS location_name FROM users u LEFT JOIN locations l ON u.location_id = l.id WHERE u.id = $1",
    )
    .bind(created_user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load created user: {error}"),
        )
    })?;

    let permissions = get_user_permissions(&state.db, created_user.id).await?;

    Ok((
        StatusCode::CREATED,
        Json(AdminUserResponse {
            id: created_user.id,
            email: created_user.email,
            display_name: created_user.display_name,
            title: created_user.title,
            first_name: created_user.first_name,
            middle_name: created_user.middle_name,
            last_name: created_user.last_name,
            location_id: created_user.location_id,
            location_name: created_user.location_name,
            photo_url: created_user.photo_url,
            permissions,
        }),
    ))
}



pub(crate) async fn admin_update_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<AdminUpdateUserRequest>,
) -> Result<Json<AdminUserResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    ensure_user_exists(&state.db, id).await?;

    let email = normalize_email(&payload.email)?;
    let (title, first_name, middle_name, last_name) =
        normalize_name_fields("", &payload.first_name, "", &payload.last_name)?;
    let display_name = derive_display_name(&title, &first_name, &middle_name, &last_name);

    if let Some(location_id) = payload.location_id {
        ensure_location_exists(&state.db, location_id).await?;
    }

    let update_result = if let Some(password) = &payload.password {
        validate_password(password)?;
        let password_hash = hash_password(password)?;

        sqlx::query(
            "UPDATE users SET email = $1, display_name = $2, title = $3, first_name = $4, middle_name = $5, last_name = $6, location_id = $7, password_hash = $8 WHERE id = $9",
        )
        .bind(&email)
        .bind(&display_name)
        .bind(&title)
        .bind(&first_name)
        .bind(&middle_name)
        .bind(&last_name)
        .bind(payload.location_id)
        .bind(password_hash)
        .bind(id)
        .execute(&state.db)
        .await
    } else {
        sqlx::query(
            "UPDATE users SET email = $1, display_name = $2, title = $3, first_name = $4, middle_name = $5, last_name = $6, location_id = $7 WHERE id = $8",
        )
            .bind(&email)
            .bind(&display_name)
            .bind(&title)
            .bind(&first_name)
            .bind(&middle_name)
            .bind(&last_name)
            .bind(payload.location_id)
            .bind(id)
            .execute(&state.db)
            .await
    };

    if let Err(error) = update_result {
        if error
            .to_string()
            .contains("duplicate key value violates unique constraint")
        {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "A user with this email already exists",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update user: {error}"),
        ));
    }

    let user = sqlx::query_as::<_, EmployeeRow>(
        "SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.location_id, u.photo_url, l.name AS location_name FROM users u LEFT JOIN locations l ON u.location_id = l.id WHERE u.id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load updated user: {error}"),
        )
    })?;

    let permissions = get_user_permissions(&state.db, id).await?;

    Ok(Json(AdminUserResponse {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        title: user.title,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        location_id: user.location_id,
        location_name: user.location_name,
        photo_url: user.photo_url,
        permissions,
    }))
}



pub(crate) async fn admin_delete_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    let claims = require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    if claims.sub == id {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Cannot delete your own account",
        ));
    }

    let existing_photo_url = sqlx::query_scalar::<_, Option<String>>(
        "SELECT photo_url FROM users WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user photo for cleanup: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "User not found"))?;

    sqlx::query("DELETE FROM availability_statuses WHERE user_id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete user availability statuses: {error}"),
            )
        })?;

    sqlx::query("DELETE FROM user_permissions WHERE user_id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete user permissions: {error}"),
            )
        })?;

    let delete_result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete user: {error}"),
            )
        })?;

    if delete_result.rows_affected() == 0 {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "User not found"));
    }

    if let Some(photo_url) = existing_photo_url {
        delete_photo_file_best_effort(&photo_url).await;
    }

    Ok(StatusCode::NO_CONTENT)
}



pub(crate) async fn bulk_assign_location(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<BulkAssignLocationRequest>,
) -> Result<Json<BulkAssignLocationResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    if payload.user_ids.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "At least one user must be selected",
        ));
    }

    ensure_location_exists(&state.db, payload.location_id).await?;

    let update_result = sqlx::query("UPDATE users SET location_id = $1 WHERE id = ANY($2)")
        .bind(payload.location_id)
        .bind(&payload.user_ids[..])
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to assign location in bulk: {error}"),
            )
        })?;

    Ok(Json(BulkAssignLocationResponse {
        updated_count: update_result.rows_affected() as i64,
    }))
}

