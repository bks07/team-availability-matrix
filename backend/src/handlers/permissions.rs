use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{
    get_user_permissions, get_user_profile_name, require_permission, Claims,
    PermissionCatalogEntry, PERMISSION_CATALOG, PERM_PERMISSION_PROFILES_ASSIGN,
    PERM_PERMISSION_PROFILES_CREATE, PERM_PERMISSION_PROFILES_DELETE,
    PERM_PERMISSION_PROFILES_EDIT, PERM_PERMISSION_PROFILES_VIEW, SUPER_ADMIN_PROFILE_NAME,
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
    let claims: Claims = require_permission(
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
        sqlx::query("INSERT INTO profile_permissions (profile_id, permission_key) VALUES ($1, $2)")
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

    insert_audit_log(
        &state.db,
        claims.sub,
        "profile_created",
        Some(profile_id),
        Some(&name),
        None,
        None,
        serde_json::json!({ "permissions": unique_perms }),
    )
    .await?;

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
    let claims: Claims = require_permission(
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

    let old_name = profile.name.clone();
    let old_permissions = sqlx::query_scalar::<_, String>(
        "SELECT permission_key FROM profile_permissions WHERE profile_id = $1 ORDER BY permission_key ASC",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load old permissions: {error}"),
        )
    })?;

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

    let update_result =
        sqlx::query("UPDATE permission_profiles SET name = $1, updated_at = NOW() WHERE id = $2")
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
        sqlx::query("INSERT INTO profile_permissions (profile_id, permission_key) VALUES ($1, $2)")
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

    insert_audit_log(
        &state.db,
        claims.sub,
        "profile_updated",
        Some(id),
        Some(&name),
        None,
        None,
        serde_json::json!({
            "before": { "name": old_name, "permissions": old_permissions },
            "after": { "name": name, "permissions": unique_perms }
        }),
    )
    .await?;

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
    let claims: Claims = require_permission(
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

    insert_audit_log(
        &state.db,
        claims.sub,
        "profile_deleted",
        Some(id),
        Some(&profile.name),
        None,
        None,
        serde_json::json!({}),
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

// PUT /api/admin/users/:id/permission-profile
pub(crate) async fn assign_user_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(user_id): Path<i64>,
    Json(payload): Json<AssignProfileRequest>,
) -> Result<Json<UserPermissionProfileResponse>, ApiError> {
    let claims: Claims = require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_ASSIGN,
    )
    .await?;

    ensure_user_exists(&state.db, user_id).await?;

    if let Some(profile_id) = payload.profile_id {
        // Verify profile exists
        let profile_name =
            sqlx::query_scalar::<_, String>("SELECT name FROM permission_profiles WHERE id = $1")
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

        let target_user_name =
            sqlx::query_scalar::<_, String>("SELECT display_name FROM users WHERE id = $1")
                .bind(user_id)
                .fetch_one(&state.db)
                .await
                .map_err(|error| {
                    ApiError::new(
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to load user name: {error}"),
                    )
                })?;

        insert_audit_log(
            &state.db,
            claims.sub,
            "profile_assigned",
            Some(profile_id),
            Some(&profile_name),
            Some(user_id),
            Some(&target_user_name),
            serde_json::json!({}),
        )
        .await?;
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

        let old_profile_info: Option<(i64, String)> = sqlx::query_as(
            "SELECT p.id, p.name FROM user_permission_profiles upp JOIN permission_profiles p ON p.id = upp.profile_id WHERE upp.user_id = $1",
        )
        .bind(user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load old profile: {error}"),
            )
        })?;

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

        if let Some((old_profile_id, old_profile_name)) = old_profile_info {
            let target_user_name =
                sqlx::query_scalar::<_, String>("SELECT display_name FROM users WHERE id = $1")
                    .bind(user_id)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|error| {
                        ApiError::new(
                            StatusCode::INTERNAL_SERVER_ERROR,
                            format!("Failed to load user name: {error}"),
                        )
                    })?;

            insert_audit_log(
                &state.db,
                claims.sub,
                "profile_unassigned",
                Some(old_profile_id),
                Some(&old_profile_name),
                Some(user_id),
                Some(&target_user_name),
                serde_json::json!({}),
            )
            .await?;
        }
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

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AuditLogQuery {
    pub(crate) page: Option<i64>,
    pub(crate) page_size: Option<i64>,
    pub(crate) event_type: Option<String>,
    pub(crate) date_from: Option<String>,
    pub(crate) date_to: Option<String>,
    pub(crate) search: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AuditLogEntry {
    pub(crate) id: i64,
    pub(crate) admin_name: String,
    pub(crate) event_type: String,
    pub(crate) profile_name: Option<String>,
    pub(crate) target_user_name: Option<String>,
    pub(crate) details: serde_json::Value,
    pub(crate) created_at: String,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AuditLogResponse {
    pub(crate) entries: Vec<AuditLogEntry>,
    pub(crate) total: i64,
    pub(crate) page: i64,
    pub(crate) page_size: i64,
}

// GET /api/admin/permission-audit-log
pub(crate) async fn list_audit_log(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<AuditLogQuery>,
) -> Result<Json<AuditLogResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let total: i64 = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM permission_audit_log l
        JOIN users u ON u.id = l.admin_id
        WHERE ($1::text IS NULL OR l.event_type = $1)
          AND ($2::text IS NULL OR l.created_at >= $2::timestamptz)
          AND ($3::text IS NULL OR l.created_at < ($3::timestamptz + INTERVAL '1 day'))
          AND (
                $4::text IS NULL
                OR u.display_name ILIKE '%' || $4 || '%'
                OR l.profile_name ILIKE '%' || $4 || '%'
                OR l.target_user_name ILIKE '%' || $4 || '%'
              )
        "#,
    )
    .bind(params.event_type.as_deref())
    .bind(params.date_from.as_deref())
    .bind(params.date_to.as_deref())
    .bind(params.search.as_deref())
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to count audit log entries: {error}"),
        )
    })?;

    #[derive(sqlx::FromRow)]
    struct AuditRow {
        id: i64,
        admin_name: String,
        event_type: String,
        profile_name: Option<String>,
        target_user_name: Option<String>,
        details: serde_json::Value,
        created_at: chrono::DateTime<chrono::Utc>,
    }

    let rows: Vec<AuditRow> = sqlx::query_as::<_, AuditRow>(
        r#"
        SELECT l.id, u.display_name as admin_name, l.event_type, l.profile_name, l.target_user_name, l.details, l.created_at
        FROM permission_audit_log l
        JOIN users u ON u.id = l.admin_id
        WHERE ($1::text IS NULL OR l.event_type = $1)
          AND ($2::text IS NULL OR l.created_at >= $2::timestamptz)
          AND ($3::text IS NULL OR l.created_at < ($3::timestamptz + INTERVAL '1 day'))
          AND (
                $4::text IS NULL
                OR u.display_name ILIKE '%' || $4 || '%'
                OR l.profile_name ILIKE '%' || $4 || '%'
                OR l.target_user_name ILIKE '%' || $4 || '%'
              )
        ORDER BY l.created_at DESC
        LIMIT $5 OFFSET $6
        "#,
    )
    .bind(params.event_type.as_deref())
    .bind(params.date_from.as_deref())
    .bind(params.date_to.as_deref())
    .bind(params.search.as_deref())
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load audit log entries: {error}"),
        )
    })?;

    let entries = rows
        .into_iter()
        .map(|row| AuditLogEntry {
            id: row.id,
            admin_name: row.admin_name,
            event_type: row.event_type,
            profile_name: row.profile_name,
            target_user_name: row.target_user_name,
            details: row.details,
            created_at: row.created_at.to_rfc3339(),
        })
        .collect();

    Ok(Json(AuditLogResponse {
        entries,
        total,
        page,
        page_size,
    }))
}

// GET /api/admin/permission-audit-log/csv
pub(crate) async fn export_audit_log_csv(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl axum::response::IntoResponse, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    #[derive(sqlx::FromRow)]
    struct AuditRow {
        admin_name: String,
        event_type: String,
        profile_name: Option<String>,
        target_user_name: Option<String>,
        details: serde_json::Value,
        created_at: chrono::DateTime<chrono::Utc>,
    }

    let rows: Vec<AuditRow> = sqlx::query_as(
        r#"
        SELECT u.display_name as admin_name, l.event_type, l.profile_name, l.target_user_name, l.details, l.created_at
        FROM permission_audit_log l
        JOIN users u ON u.id = l.admin_id
        ORDER BY l.created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load audit log: {error}"),
        )
    })?;

    let mut csv = String::from("Timestamp,Admin,Event Type,Profile,User,Details\n");
    for row in rows {
        let timestamp = row.created_at.to_rfc3339();
        let admin = escape_csv_field(&row.admin_name);
        let event = escape_csv_field(&row.event_type);
        let profile = escape_csv_field(row.profile_name.as_deref().unwrap_or(""));
        let user = escape_csv_field(row.target_user_name.as_deref().unwrap_or(""));
        let details = escape_csv_field(&row.details.to_string());
        csv.push_str(&format!(
            "{timestamp},{admin},{event},{profile},{user},{details}\n"
        ));
    }

    Ok((
        StatusCode::OK,
        [
            (axum::http::header::CONTENT_TYPE, "text/csv"),
            (
                axum::http::header::CONTENT_DISPOSITION,
                "attachment; filename=\"permission-audit-log.csv\"",
            ),
        ],
        csv,
    ))
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UsageReportQuery {
    pub(crate) profile_name: Option<String>,
    pub(crate) user_name: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UsageReportEntry {
    pub(crate) user_id: i64,
    pub(crate) display_name: String,
    pub(crate) email: String,
    pub(crate) profile_name: Option<String>,
    pub(crate) permissions: Vec<String>,
}

// GET /api/admin/permission-usage-report
pub(crate) async fn get_usage_report(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<UsageReportQuery>,
) -> Result<Json<Vec<UsageReportEntry>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    #[derive(sqlx::FromRow)]
    struct ReportRow {
        user_id: i64,
        display_name: String,
        email: String,
        profile_name: Option<String>,
        profile_id: Option<i64>,
    }

    let rows: Vec<ReportRow> = sqlx::query_as(
        r#"
        SELECT u.id as user_id, u.display_name, u.email,
               p.name as profile_name, upp.profile_id
        FROM users u
        LEFT JOIN user_permission_profiles upp ON upp.user_id = u.id
        LEFT JOIN permission_profiles p ON p.id = upp.profile_id
        WHERE ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR u.display_name ILIKE '%' || $2 || '%')
        ORDER BY u.display_name ASC
        "#,
    )
    .bind(params.profile_name.as_deref())
    .bind(params.user_name.as_deref())
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load usage report: {error}"),
        )
    })?;

    let mut entries = Vec::with_capacity(rows.len());
    for row in rows {
        let permissions = if let Some(profile_id) = row.profile_id {
            sqlx::query_scalar::<_, String>(
                "SELECT permission_key FROM profile_permissions WHERE profile_id = $1 ORDER BY permission_key ASC",
            )
            .bind(profile_id)
            .fetch_all(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to load profile permissions: {error}"),
                )
            })?
        } else {
            Vec::new()
        };

        entries.push(UsageReportEntry {
            user_id: row.user_id,
            display_name: row.display_name,
            email: row.email,
            profile_name: row.profile_name,
            permissions,
        });
    }

    Ok(Json(entries))
}

// GET /api/admin/permission-usage-report/csv
pub(crate) async fn export_usage_report_csv(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl axum::response::IntoResponse, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PERMISSION_PROFILES_VIEW,
    )
    .await?;

    #[derive(sqlx::FromRow)]
    struct ReportRow {
        display_name: String,
        email: String,
        profile_name: Option<String>,
        profile_id: Option<i64>,
    }

    let rows: Vec<ReportRow> = sqlx::query_as(
        r#"
        SELECT u.display_name, u.email,
               p.name as profile_name, upp.profile_id
        FROM users u
        LEFT JOIN user_permission_profiles upp ON upp.user_id = u.id
        LEFT JOIN permission_profiles p ON p.id = upp.profile_id
        ORDER BY u.display_name ASC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load usage report: {error}"),
        )
    })?;

    let mut csv = String::from("Display Name,Email,Profile Name,Permissions\n");
    for row in rows {
        let permissions = if let Some(profile_id) = row.profile_id {
            sqlx::query_scalar::<_, String>(
                "SELECT permission_key FROM profile_permissions WHERE profile_id = $1 ORDER BY permission_key ASC",
            )
            .bind(profile_id)
            .fetch_all(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to load profile permissions: {error}"),
                )
            })?
            .join(", ")
        } else {
            String::new()
        };

        let display_name = escape_csv_field(&row.display_name);
        let email = escape_csv_field(&row.email);
        let profile_name = escape_csv_field(row.profile_name.as_deref().unwrap_or(""));
        let permissions_str = escape_csv_field(&permissions);

        csv.push_str(&format!(
            "{display_name},{email},{profile_name},{permissions_str}\n"
        ));
    }

    Ok((
        StatusCode::OK,
        [
            (axum::http::header::CONTENT_TYPE, "text/csv"),
            (
                axum::http::header::CONTENT_DISPOSITION,
                "attachment; filename=\"permission-usage-report.csv\"",
            ),
        ],
        csv,
    ))
}

fn escape_csv_field(field: &str) -> String {
    if field.contains(',') || field.contains('"') || field.contains('\n') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
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

#[allow(clippy::too_many_arguments)]
async fn insert_audit_log(
    db: &sqlx::PgPool,
    admin_id: i64,
    event_type: &str,
    profile_id: Option<i64>,
    profile_name: Option<&str>,
    target_user_id: Option<i64>,
    target_user_name: Option<&str>,
    details: serde_json::Value,
) -> Result<(), ApiError> {
    sqlx::query(
        r#"INSERT INTO permission_audit_log (admin_id, event_type, profile_id, profile_name, target_user_id, target_user_name, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
    )
    .bind(admin_id)
    .bind(event_type)
    .bind(profile_id)
    .bind(profile_name)
    .bind(target_user_id)
    .bind(target_user_name)
    .bind(details)
    .execute(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to insert audit log: {error}"),
        )
    })?;

    Ok(())
}
