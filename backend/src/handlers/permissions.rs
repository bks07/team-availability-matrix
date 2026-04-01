use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{
    get_user_permissions, get_user_profile_name, require_permission,
    PERMISSION_CATALOG, SUPER_ADMIN_PROFILE_NAME,
    PERM_PERMISSION_PROFILES_ASSIGN, PERM_PERMISSION_PROFILES_CREATE,
    PERM_PERMISSION_PROFILES_DELETE, PERM_PERMISSION_PROFILES_EDIT,
    PERM_PERMISSION_PROFILES_VIEW, PermissionCatalogEntry,
};
use crate::error::ApiError;
use crate::helpers::{ensure_user_exists, is_known_permission};
use crate::models::PermissionProfileRow;
use crate::state::AppState;
use crate::types::requests::{
    AssignProfileRequest, CreatePermissionProfileRequest, UpdatePermissionProfileRequest,
};
use crate::types::responses::{PermissionProfileResponse, UserPermissionProfileResponse};

// GET /api/admin/permission-catalog
pub(crate) async fn list_permission_catalog(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<PermissionCatalogEntry>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    Ok(Json(PERMISSION_CATALOG.to_vec()))
}

// GET /api/admin/permission-profiles
pub(crate) async fn list_permission_profiles(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<PermissionProfileResponse>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    let profiles = sqlx::query_as::<_, PermissionProfileRow>(
        "SELECT id, name, is_built_in, created_at, updated_at FROM permission_profiles ORDER BY name ASC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load permission profiles: {error}"),
        )
    })?;

    let mut response = Vec::with_capacity(profiles.len());
    for profile in profiles {
        let permissions = sqlx::query_scalar::<_, String>(
            "SELECT permission_key FROM profile_permissions WHERE profile_id = $1 ORDER BY permission_key ASC",
        )
        .bind(profile.id)
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load profile permissions: {error}"),
            )
        })?;

        let user_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM user_permission_profiles WHERE profile_id = $1",
        )
        .bind(profile.id)
        .fetch_one(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to count profile users: {error}"),
            )
        })?;

        response.push(PermissionProfileResponse {
            id: profile.id,
            name: profile.name,
            is_built_in: profile.is_built_in,
            permissions,
            user_count,
        });
    }

    Ok(Json(response))
}

// POST /api/admin/permission-profiles
pub(crate) async fn create_permission_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePermissionProfileRequest>,
) -> Result<(StatusCode, Json<PermissionProfileResponse>), ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_CREATE,
    )
    .await?;

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Profile name is required",
        ));
    }

    for perm in &payload.permissions {
        if !is_known_permission(perm) {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Unknown permission: {perm}"),
            ));
        }
    }

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start transaction: {error}"),
        )
    })?;

    let profile_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO permission_profiles (name, is_built_in) VALUES ($1, FALSE) RETURNING id",
    )
    .bind(&name)
    .fetch_one(&mut *tx)
    .await;

    let profile_id = match profile_id {
        Ok(id) => id,
        Err(error) => {
            if error
                .to_string()
                .contains("duplicate key value violates unique constraint")
            {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "A permission profile with that name already exists",
                ));
            }
            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create permission profile: {error}"),
            ));
        }
    };

    let mut unique_perms = Vec::new();
    for perm in &payload.permissions {
        if !unique_perms.contains(perm) {
            unique_perms.push(perm.clone());
        }
    }

    for perm in &unique_perms {
        sqlx::query(
            "INSERT INTO profile_permissions (profile_id, permission_key) VALUES ($1, $2)",
        )
        .bind(profile_id)
        .bind(perm)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to save profile permission: {error}"),
            )
        })?;
    }

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit transaction: {error}"),
        )
    })?;

    unique_perms.sort();

    Ok((
        StatusCode::CREATED,
        Json(PermissionProfileResponse {
            id: profile_id,
            name,
            is_built_in: false,
            permissions: unique_perms,
            user_count: 0,
        }),
    ))
}

// GET /api/admin/permission-profiles/:id
pub(crate) async fn get_permission_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<Json<PermissionProfileResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    let profile = sqlx::query_as::<_, PermissionProfileRow>(
        "SELECT id, name, is_built_in, created_at, updated_at FROM permission_profiles WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load permission profile: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Permission profile not found"))?;

    let permissions = sqlx::query_scalar::<_, String>(
        "SELECT permission_key FROM profile_permissions WHERE profile_id = $1 ORDER BY permission_key ASC",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load profile permissions: {error}"),
        )
    })?;

    let user_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM user_permission_profiles WHERE profile_id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to count profile users: {error}"),
        )
    })?;

    Ok(Json(PermissionProfileResponse {
        id: profile.id,
        name: profile.name,
        is_built_in: profile.is_built_in,
        permissions,
        user_count,
    }))
}

// PUT /api/admin/permission-profiles/:id
pub(crate) async fn update_permission_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePermissionProfileRequest>,
) -> Result<Json<PermissionProfileResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_EDIT,
    )
    .await?;

    let profile = sqlx::query_as::<_, PermissionProfileRow>(
        "SELECT id, name, is_built_in, created_at, updated_at FROM permission_profiles WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load permission profile: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Permission profile not found"))?;

    if profile.is_built_in {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Built-in profiles cannot be edited",
        ));
    }

    let name = payload.name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Profile name is required",
        ));
    }

    for perm in &payload.permissions {
        if !is_known_permission(perm) {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Unknown permission: {perm}"),
            ));
        }
    }

    let mut unique_perms = Vec::new();
    for perm in &payload.permissions {
        if !unique_perms.contains(perm) {
            unique_perms.push(perm.clone());
        }
    }

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start transaction: {error}"),
        )
    })?;

    let update_result = sqlx::query(
        "UPDATE permission_profiles SET name = $1, updated_at = NOW() WHERE id = $2",
    )
    .bind(&name)
    .bind(id)
    .execute(&mut *tx)
    .await;

    if let Err(error) = update_result {
        if error
            .to_string()
            .contains("duplicate key value violates unique constraint")
        {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "A permission profile with that name already exists",
            ));
        }
        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update permission profile: {error}"),
        ));
    }

    sqlx::query("DELETE FROM profile_permissions WHERE profile_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear profile permissions: {error}"),
            )
        })?;

    for perm in &unique_perms {
        sqlx::query(
            "INSERT INTO profile_permissions (profile_id, permission_key) VALUES ($1, $2)",
        )
        .bind(id)
        .bind(perm)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to save profile permission: {error}"),
            )
        })?;
    }

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit transaction: {error}"),
        )
    })?;

    let user_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM user_permission_profiles WHERE profile_id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to count profile users: {error}"),
        )
    })?;

    unique_perms.sort();

    Ok(Json(PermissionProfileResponse {
        id,
        name,
        is_built_in: false,
        permissions: unique_perms,
        user_count,
    }))
}

// DELETE /api/admin/permission-profiles/:id
pub(crate) async fn delete_permission_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_DELETE,
    )
    .await?;

    let profile = sqlx::query_as::<_, PermissionProfileRow>(
        "SELECT id, name, is_built_in, created_at, updated_at FROM permission_profiles WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load permission profile: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Permission profile not found"))?;

    if profile.is_built_in {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Built-in profiles cannot be deleted",
        ));
    }

    let user_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM user_permission_profiles WHERE profile_id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to count profile users: {error}"),
        )
    })?;

    if user_count > 0 {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "Cannot delete a profile that is still assigned to users",
        ));
    }

    sqlx::query("DELETE FROM permission_profiles WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete permission profile: {error}"),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

// PUT /api/admin/users/:id/permission-profile
pub(crate) async fn assign_user_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(user_id): Path<i64>,
    Json(payload): Json<AssignProfileRequest>,
) -> Result<Json<UserPermissionProfileResponse>, ApiError> {
    let claims = require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_ASSIGN,
    )
    .await?;

    ensure_user_exists(&state.db, user_id).await?;

    if let Some(profile_id) = payload.profile_id {
        // Verify profile exists
        let profile_name = sqlx::query_scalar::<_, String>(
            "SELECT name FROM permission_profiles WHERE id = $1",
        )
        .bind(profile_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check permission profile: {error}"),
            )
        })?
        .ok_or_else(|| {
            ApiError::new(StatusCode::BAD_REQUEST, "Permission profile not found")
        })?;

        // Prevent removing Super Admin from yourself
        if claims.sub == user_id && profile_name != SUPER_ADMIN_PROFILE_NAME {
            let current_profile = get_user_profile_name(&state.db, user_id).await?;
            if current_profile.as_deref() == Some(SUPER_ADMIN_PROFILE_NAME) {
                return Err(ApiError::new(
                    StatusCode::FORBIDDEN,
                    "Cannot remove your own Super Admin profile",
                ));
            }
        }

        sqlx::query(
            "INSERT INTO user_permission_profiles (user_id, profile_id) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET profile_id = $2, assigned_at = NOW()",
        )
        .bind(user_id)
        .bind(profile_id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to assign permission profile: {error}"),
            )
        })?;
    } else {
        // Unassign profile — prevent removing Super Admin from yourself
        if claims.sub == user_id {
            let current_profile = get_user_profile_name(&state.db, user_id).await?;
            if current_profile.as_deref() == Some(SUPER_ADMIN_PROFILE_NAME) {
                return Err(ApiError::new(
                    StatusCode::FORBIDDEN,
                    "Cannot remove your own Super Admin profile",
                ));
            }
        }

        sqlx::query("DELETE FROM user_permission_profiles WHERE user_id = $1")
            .bind(user_id)
            .execute(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to unassign permission profile: {error}"),
                )
            })?;
    }

    let profile_info: Option<(i64, String)> = sqlx::query_as(
        "SELECT p.id, p.name FROM user_permission_profiles upp JOIN permission_profiles p ON p.id = upp.profile_id WHERE upp.user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user profile: {error}"),
        )
    })?;

    let permissions = get_user_permissions(&state.db, user_id).await?;

    Ok(Json(UserPermissionProfileResponse {
        user_id,
        profile_id: profile_info.as_ref().map(|(id, _)| *id),
        profile_name: profile_info.map(|(_, name)| name),
        permissions,
    }))
}

// GET /api/admin/users/:id/permission-profile
pub(crate) async fn get_user_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(user_id): Path<i64>,
) -> Result<Json<UserPermissionProfileResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    ensure_user_exists(&state.db, user_id).await?;

    let profile_info: Option<(i64, String)> = sqlx::query_as(
        "SELECT p.id, p.name FROM user_permission_profiles upp JOIN permission_profiles p ON p.id = upp.profile_id WHERE upp.user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user profile: {error}"),
        )
    })?;

    let permissions = get_user_permissions(&state.db, user_id).await?;

    Ok(Json(UserPermissionProfileResponse {
        user_id,
        profile_id: profile_info.as_ref().map(|(id, _)| *id),
        profile_name: profile_info.map(|(_, name)| name),
        permissions,
    }))
}
