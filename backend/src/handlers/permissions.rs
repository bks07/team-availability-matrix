use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{get_user_permissions, require_permission, PERMISSION_SUPER_ADMIN};
use crate::error::ApiError;
use crate::helpers::{ensure_user_exists, is_known_permission};
use crate::state::AppState;
use crate::types::requests::UpdatePermissionsRequest;
use crate::types::responses::UserPermissionsResponse;

pub(crate) async fn get_user_permissions_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(user_id): Path<i64>,
) -> Result<Json<UserPermissionsResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_SUPER_ADMIN,
    )
    .await?;

    ensure_user_exists(&state.db, user_id).await?;
    let permissions = get_user_permissions(&state.db, user_id).await?;

    Ok(Json(UserPermissionsResponse {
        user_id,
        permissions,
    }))
}



pub(crate) async fn update_user_permissions(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(user_id): Path<i64>,
    Json(payload): Json<UpdatePermissionsRequest>,
) -> Result<Json<UserPermissionsResponse>, ApiError> {
    let claims = require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_SUPER_ADMIN,
    )
    .await?;

    for permission in &payload.permissions {
        if !is_known_permission(permission) {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Unknown permission: {permission}"),
            ));
        }
    }

    if claims.sub == user_id
        && !payload
            .permissions
            .iter()
            .any(|permission| permission == PERMISSION_SUPER_ADMIN)
    {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Cannot remove your own super admin permission",
        ));
    }

    let mut unique_permissions = Vec::new();
    for permission in &payload.permissions {
        if !unique_permissions.iter().any(|item| item == permission) {
            unique_permissions.push(permission.clone());
        }
    }

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start permission update transaction: {error}"),
        )
    })?;

    let user_exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM users WHERE id = $1 LIMIT 1")
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check user: {error}"),
            )
        })?
        .is_some();

    if !user_exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "User not found"));
    }

    sqlx::query("DELETE FROM user_permissions WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear user permissions: {error}"),
            )
        })?;

    for permission in &unique_permissions {
        sqlx::query("INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)")
            .bind(user_id)
            .bind(permission)
            .execute(&mut *tx)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to save user permissions: {error}"),
                )
            })?;
    }

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit permission update transaction: {error}"),
        )
    })?;

    let permissions = get_user_permissions(&state.db, user_id).await?;
    Ok(Json(UserPermissionsResponse {
        user_id,
        permissions,
    }))
}
