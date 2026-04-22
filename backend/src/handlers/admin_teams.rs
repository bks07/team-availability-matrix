use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json as AxumJson,
};
use sqlx::FromRow;

use crate::auth::{
    require_permission, PERM_TEAMS_ASSIGN, PERM_TEAMS_CREATE, PERM_TEAMS_DELETE, PERM_TEAMS_EDIT,
    PERM_TEAMS_VIEW,
};
use crate::error::ApiError;
use crate::helpers::is_unique_violation;
use crate::state::AppState;
use crate::types::requests::{AdminAssignUserRequest, CreateTeamRequest, UpdateTeamRequest};
use crate::types::responses::TeamMemberResponse;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdminTeamResponse {
    id: i64,
    name: String,
    description: String,
    member_count: i64,
    created_at: String,
}

#[derive(Debug, FromRow)]
struct AdminTeamRow {
    id: i64,
    name: String,
    description: String,
    member_count: i64,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, FromRow)]
struct TeamMemberRow {
    user_id: i64,
    display_name: String,
    email: String,
    photo_url: Option<String>,
    role: String,
    joined_at: chrono::DateTime<chrono::Utc>,
}

fn normalize_team_name(name: &str) -> Result<String, ApiError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Team name is required",
        ));
    }

    Ok(trimmed.to_string())
}

fn normalize_team_description(description: Option<String>) -> String {
    description.unwrap_or_default().trim().to_string()
}

async fn ensure_team_exists(db: &sqlx::PgPool, team_id: i64) -> Result<(), ApiError> {
    let exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM teams WHERE id = $1 LIMIT 1")
        .bind(team_id)
        .fetch_optional(db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check team: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Team not found"));
    }

    Ok(())
}

fn to_admin_team_response(team: AdminTeamRow) -> AdminTeamResponse {
    AdminTeamResponse {
        id: team.id,
        name: team.name,
        description: team.description,
        member_count: team.member_count,
        created_at: team.created_at.to_rfc3339(),
    }
}

pub(crate) async fn list_admin_teams(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<AxumJson<Vec<AdminTeamResponse>>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_TEAMS_VIEW).await?;

    let teams = sqlx::query_as::<_, AdminTeamRow>(
        r#"
        SELECT
            t.id,
            t.name,
            t.description,
            t.created_at,
            COUNT(tm.id)::BIGINT AS member_count
        FROM teams t
        LEFT JOIN team_members tm ON tm.team_id = t.id
        GROUP BY t.id
        ORDER BY t.name ASC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load teams: {error}"),
        )
    })?;

    Ok(AxumJson(
        teams.into_iter().map(to_admin_team_response).collect(),
    ))
}

pub(crate) async fn create_admin_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    AxumJson(payload): AxumJson<CreateTeamRequest>,
) -> Result<impl IntoResponse, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_TEAMS_CREATE).await?;

    let name = normalize_team_name(&payload.name)?;
    let description = normalize_team_description(payload.description);

    let team = sqlx::query_as::<_, AdminTeamRow>(
        r#"
        INSERT INTO teams (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, 0::BIGINT AS member_count
        "#,
    )
    .bind(&name)
    .bind(&description)
    .fetch_one(&state.db)
    .await;

    let team = match team {
        Ok(team) => team,
        Err(error) => {
            if is_unique_violation(&error) {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "A team with this name already exists",
                ));
            }

            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create team: {error}"),
            ));
        }
    };

    Ok((StatusCode::CREATED, AxumJson(to_admin_team_response(team))))
}

pub(crate) async fn update_admin_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    AxumJson(payload): AxumJson<UpdateTeamRequest>,
) -> Result<AxumJson<AdminTeamResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_TEAMS_EDIT).await?;

    let name = normalize_team_name(&payload.name)?;
    let description = normalize_team_description(payload.description);

    ensure_team_exists(&state.db, id).await?;

    let update_result = sqlx::query("UPDATE teams SET name = $1, description = $2 WHERE id = $3")
        .bind(&name)
        .bind(&description)
        .bind(id)
        .execute(&state.db)
        .await;

    if let Err(error) = update_result {
        if is_unique_violation(&error) {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "A team with this name already exists",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update team: {error}"),
        ));
    }

    let team = sqlx::query_as::<_, AdminTeamRow>(
        r#"
        SELECT
            t.id,
            t.name,
            t.description,
            t.created_at,
            COUNT(tm.id)::BIGINT AS member_count
        FROM teams t
        LEFT JOIN team_members tm ON tm.team_id = t.id
        WHERE t.id = $1
        GROUP BY t.id
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load updated team: {error}"),
        )
    })?;

    Ok(AxumJson(to_admin_team_response(team)))
}

pub(crate) async fn delete_admin_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_TEAMS_DELETE).await?;

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start transaction: {error}"),
        )
    })?;

    let exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM teams WHERE id = $1 LIMIT 1")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check team: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Team not found"));
    }

    let member_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::BIGINT FROM team_members WHERE team_id = $1",
    )
    .bind(id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check team members: {error}"),
        )
    })?;

    if member_count > 0 {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "Cannot delete team with active members",
        ));
    }

    sqlx::query("UPDATE users SET default_team_id = NULL WHERE default_team_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear default team references: {error}"),
            )
        })?;

    sqlx::query("DELETE FROM team_invitations WHERE team_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete pending invitations: {error}"),
            )
        })?;

    sqlx::query("DELETE FROM teams WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete team: {error}"),
            )
        })?;

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit transaction: {error}"),
        )
    })?;

    Ok(StatusCode::NO_CONTENT.into_response())
}

pub(crate) async fn list_admin_team_members(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<AxumJson<Vec<TeamMemberResponse>>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_TEAMS_VIEW).await?;

    ensure_team_exists(&state.db, id).await?;

    let members = sqlx::query_as::<_, TeamMemberRow>(
        r#"
        SELECT
            tm.user_id,
            u.display_name,
            u.email,
            u.photo_url,
            tm.role,
            tm.joined_at
        FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = $1
        ORDER BY tm.role ASC, u.display_name ASC
        "#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team members: {error}"),
        )
    })?;

    Ok(AxumJson(
        members
            .into_iter()
            .map(|member| TeamMemberResponse {
                user_id: member.user_id,
                display_name: member.display_name,
                email: member.email,
                photo_url: member.photo_url,
                role: member.role,
                joined_at: member.joined_at,
            })
            .collect(),
    ))
}

pub(crate) async fn assign_user_to_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    AxumJson(payload): AxumJson<AdminAssignUserRequest>,
) -> Result<impl IntoResponse, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_TEAMS_ASSIGN).await?;

    ensure_team_exists(&state.db, id).await?;

    let user_exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM users WHERE id = $1 LIMIT 1")
        .bind(payload.user_id)
        .fetch_optional(&state.db)
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

    let insert_result =
        sqlx::query("INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')")
            .bind(id)
            .bind(payload.user_id)
            .execute(&state.db)
            .await;

    if let Err(error) = insert_result {
        if is_unique_violation(&error) {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "User is already a member of this team",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to assign user to team: {error}"),
        ));
    }

    sqlx::query("UPDATE users SET default_team_id = $1 WHERE id = $2 AND default_team_id IS NULL")
        .bind(id)
        .bind(payload.user_id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to set user default team: {error}"),
            )
        })?;

    let member = sqlx::query_as::<_, TeamMemberRow>(
        r#"
        SELECT
            tm.user_id,
            u.display_name,
            u.email,
            u.photo_url,
            tm.role,
            tm.joined_at
        FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = $1 AND tm.user_id = $2
        LIMIT 1
        "#,
    )
    .bind(id)
    .bind(payload.user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load assigned team member: {error}"),
        )
    })?;

    Ok((
        StatusCode::CREATED,
        AxumJson(TeamMemberResponse {
            user_id: member.user_id,
            display_name: member.display_name,
            email: member.email,
            photo_url: member.photo_url,
            role: member.role,
            joined_at: member.joined_at,
        }),
    ))
}

pub(crate) async fn remove_user_from_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path((id, user_id)): Path<(i64, i64)>,
) -> Result<impl IntoResponse, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_TEAMS_ASSIGN).await?;

    let delete_result = sqlx::query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to remove user from team: {error}"),
            )
        })?;

    if delete_result.rows_affected() == 0 {
        return Err(ApiError::new(
            StatusCode::NOT_FOUND,
            "Team member not found",
        ));
    }

    sqlx::query("UPDATE users SET default_team_id = NULL WHERE id = $1 AND default_team_id = $2")
        .bind(user_id)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear user default team: {error}"),
            )
        })?;

    Ok(StatusCode::NO_CONTENT.into_response())
}
