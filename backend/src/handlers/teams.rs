use axum::extract::{Json, Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json as AxumJson;
use serde_json::json;
use sqlx::FromRow;

use crate::auth::authorize;
use crate::error::ApiError;
use crate::models::{TeamInvitationRow, TeamMemberRow};
use crate::state::AppState;
use crate::types::requests::{
    CreateTeamRequest, InviteToTeamRequest, TransferOwnershipRequest, UpdateMemberRoleRequest,
    UpdateTeamRequest, UserSearchQuery,
};
use crate::types::responses::{
    TeamDetailResponse, TeamInvitationResponse, TeamMemberResponse, TeamResponse, UserSearchResult,
};

#[derive(Debug, FromRow)]
struct TeamSummaryRow {
    id: i64,
    name: String,
    description: String,
    member_count: i64,
    my_role: String,
    owner_name: String,
    created_at: chrono::DateTime<chrono::Utc>,
    is_favorite: bool,
}

#[derive(Debug, FromRow)]
struct TeamBasicRow {
    id: i64,
    name: String,
    description: String,
}

#[derive(Debug, FromRow)]
struct TeamMemberDetailRow {
    user_id: i64,
    display_name: String,
    email: String,
    photo_url: Option<String>,
    role: String,
    joined_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, FromRow)]
struct UserSearchRow {
    id: i64,
    display_name: String,
    email: String,
    photo_url: Option<String>,
}

#[derive(Debug, FromRow)]
struct TeamInvitationResponseRow {
    id: i64,
    team_id: i64,
    team_name: String,
    inviter_name: String,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

fn validate_team_name(name: &str) -> Result<String, ApiError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Team name is required",
        ));
    }

    if trimmed.chars().count() > 100 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Team name must be at most 100 characters",
        ));
    }

    Ok(trimmed.to_string())
}

fn validate_team_description(description: Option<String>) -> Result<String, ApiError> {
    let normalized = description.unwrap_or_default().trim().to_string();

    if normalized.chars().count() > 500 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Team description must be at most 500 characters",
        ));
    }

    Ok(normalized)
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    if let sqlx::Error::Database(db_error) = error {
        return db_error.code().as_deref() == Some("23505");
    }

    false
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

async fn ensure_team_member(
    db: &sqlx::PgPool,
    team_id: i64,
    user_id: i64,
) -> Result<TeamMemberRow, ApiError> {
    sqlx::query_as::<_, TeamMemberRow>(
        "SELECT id, team_id, user_id, role, joined_at FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
    )
    .bind(team_id)
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check team membership: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::FORBIDDEN, "You are not a member of this team"))
}

async fn ensure_team_owner(db: &sqlx::PgPool, team_id: i64, user_id: i64) -> Result<(), ApiError> {
    let member = ensure_team_member(db, team_id, user_id).await?;
    if member.role != "owner" {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Only the team owner can perform this action",
        ));
    }

    Ok(())
}

async fn ensure_team_owner_or_admin(
    db: &sqlx::PgPool,
    team_id: i64,
    user_id: i64,
) -> Result<TeamMemberRow, ApiError> {
    let member = ensure_team_member(db, team_id, user_id).await?;
    if member.role != "owner" && member.role != "admin" {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Only team owners and administrators can perform this action",
        ));
    }

    Ok(member)
}

async fn load_invitation_response(
    db: &sqlx::PgPool,
    invitation_id: i64,
) -> Result<TeamInvitationResponse, ApiError> {
    let invitation = sqlx::query_as::<_, TeamInvitationResponseRow>(
        r#"
        SELECT
            ti.id,
            ti.team_id,
            t.name AS team_name,
            inviter.display_name AS inviter_name,
            ti.status,
            ti.created_at
        FROM team_invitations ti
        INNER JOIN teams t ON t.id = ti.team_id
        INNER JOIN users inviter ON inviter.id = ti.inviter_id
        WHERE ti.id = $1
        LIMIT 1
        "#,
    )
    .bind(invitation_id)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load invitation: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Invitation not found"))?;

    Ok(TeamInvitationResponse {
        id: invitation.id,
        team_id: invitation.team_id,
        team_name: invitation.team_name,
        inviter_name: invitation.inviter_name,
        status: invitation.status,
        created_at: invitation.created_at,
    })
}

pub(crate) async fn create_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(body): Json<CreateTeamRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let name = validate_team_name(&body.name)?;
    let description = validate_team_description(body.description)?;

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start transaction: {error}"),
        )
    })?;

    let team = sqlx::query_as::<_, TeamBasicRow>(
        "INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING id, name, description",
    )
    .bind(&name)
    .bind(&description)
    .fetch_one(&mut *tx)
    .await;

    let team = match team {
        Ok(team) => team,
        Err(error) => {
            if is_unique_violation(&error) {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "A team with that name already exists",
                ));
            }

            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create team: {error}"),
            ));
        }
    };

    sqlx::query(
        "INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')",
    )
    .bind(team.id)
    .bind(claims.sub)
    .execute(&mut *tx)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to add owner membership: {error}"),
        )
    })?;

    sqlx::query("UPDATE users SET default_team_id = $1 WHERE id = $2 AND default_team_id IS NULL")
        .bind(team.id)
        .bind(claims.sub)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to set default team: {error}"),
            )
        })?;

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit transaction: {error}"),
        )
    })?;

    let caller_name = sqlx::query_scalar::<_, String>(
        "SELECT display_name FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user: {error}"),
        )
    })?;

    let created_at = sqlx::query_scalar::<_, chrono::DateTime<chrono::Utc>>(
        "SELECT created_at FROM teams WHERE id = $1",
    )
    .bind(team.id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team created_at: {error}"),
        )
    })?;

    Ok((
        StatusCode::CREATED,
        AxumJson(TeamResponse {
            id: team.id,
            name: team.name,
            description: team.description,
            member_count: 1,
            my_role: "owner".to_string(),
            owner_name: caller_name,
            created_at,
            is_favorite: false,
        }),
    ))
}

pub(crate) async fn list_my_teams(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let teams = sqlx::query_as::<_, TeamSummaryRow>(
        r#"
        SELECT
            t.id,
            t.name,
            t.description,
            counts.member_count,
            tm.role AS my_role,
            owner_u.display_name AS owner_name,
            t.created_at,
            CASE WHEN utf.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_favorite
        FROM teams t
        INNER JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
        INNER JOIN (
            SELECT team_id, COUNT(*)::BIGINT AS member_count
            FROM team_members
            GROUP BY team_id
        ) counts ON counts.team_id = t.id
        INNER JOIN team_members owner_tm ON owner_tm.team_id = t.id AND owner_tm.role = 'owner'
        INNER JOIN users owner_u ON owner_u.id = owner_tm.user_id
        LEFT JOIN user_team_favorites utf ON utf.team_id = t.id AND utf.user_id = $1
        ORDER BY LOWER(t.name) ASC, t.id ASC
        "#,
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load teams: {error}"),
        )
    })?;

    let response = teams
        .into_iter()
        .map(|team| TeamResponse {
            id: team.id,
            name: team.name,
            description: team.description,
            member_count: team.member_count,
            my_role: team.my_role,
            owner_name: team.owner_name,
            created_at: team.created_at,
            is_favorite: team.is_favorite,
        })
        .collect::<Vec<_>>();

    Ok(AxumJson(response))
}

pub(crate) async fn get_team_detail(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let team = sqlx::query_as::<_, TeamBasicRow>(
        "SELECT id, name, description FROM teams WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Team not found"))?;

    ensure_team_member(&state.db, id, claims.sub).await?;

    let members = sqlx::query_as::<_, TeamMemberDetailRow>(
        r#"
        SELECT
            tm.user_id,
            u.display_name,
            u.email,
            u.photo_url,
            tm.role,
            tm.joined_at
        FROM team_members tm
        INNER JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = $1
        ORDER BY
            CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
            LOWER(u.display_name) ASC,
            tm.user_id ASC
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

    Ok(AxumJson(TeamDetailResponse {
        id: team.id,
        name: team.name,
        description: team.description,
        members: members
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
    }))
}

pub(crate) async fn update_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(body): Json<UpdateTeamRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    ensure_team_owner(&state.db, id, claims.sub).await?;

    let name = validate_team_name(&body.name)?;
    let description = validate_team_description(body.description)?;

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
                "A team with that name already exists",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update team: {error}"),
        ));
    }

    let member_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::BIGINT FROM team_members WHERE team_id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team member count: {error}"),
        )
    })?;

    let owner_name = sqlx::query_scalar::<_, String>(
        r#"
        SELECT u.display_name
        FROM team_members tm
        INNER JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = $1 AND tm.role = 'owner'
        LIMIT 1
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team owner: {error}"),
        )
    })?;

    let created_at = sqlx::query_scalar::<_, chrono::DateTime<chrono::Utc>>(
        "SELECT created_at FROM teams WHERE id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team created_at: {error}"),
        )
    })?;

    let is_favorite = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM user_team_favorites WHERE user_id = $1 AND team_id = $2 LIMIT 1",
    )
    .bind(claims.sub)
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check favorite: {error}"),
        )
    })?
    .is_some();

    Ok(AxumJson(TeamResponse {
        id,
        name,
        description,
        member_count,
        my_role: "owner".to_string(),
        owner_name,
        created_at,
        is_favorite,
    }))
}

pub(crate) async fn delete_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    ensure_team_owner(&state.db, id, claims.sub).await?;

    sqlx::query("DELETE FROM teams WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete team: {error}"),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn update_member_role(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path((id, user_id)): Path<(i64, i64)>,
    Json(body): Json<UpdateMemberRoleRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    ensure_team_owner(&state.db, id, claims.sub).await?;

    if user_id == claims.sub {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Owners cannot change their own role",
        ));
    }

    let new_role = body.role.trim();
    if new_role != "admin" && new_role != "member" {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Role must be either 'admin' or 'member'",
        ));
    }

    let target_member = sqlx::query_as::<_, TeamMemberRow>(
        "SELECT id, team_id, user_id, role, joined_at FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team member: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Team member not found"))?;

    if target_member.role == "owner" {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Cannot change the owner's role",
        ));
    }

    sqlx::query("UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3")
        .bind(new_role)
        .bind(id)
        .bind(user_id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to update team member role: {error}"),
            )
        })?;

    Ok(AxumJson(json!({ "message": "Role updated" })))
}

pub(crate) async fn remove_member(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path((id, user_id)): Path<(i64, i64)>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    let caller_member = ensure_team_owner_or_admin(&state.db, id, claims.sub).await?;

    if user_id == claims.sub {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "You cannot remove yourself from a team using this endpoint",
        ));
    }

    let target_member = sqlx::query_as::<_, TeamMemberRow>(
        "SELECT id, team_id, user_id, role, joined_at FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load team member: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Team member not found"))?;

    if target_member.role == "owner" {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "The team owner cannot be removed",
        ));
    }

    if caller_member.role == "admin" && target_member.role != "member" {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Team administrators can only remove regular members",
        ));
    }

    sqlx::query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to remove team member: {error}"),
            )
        })?;

    sqlx::query("UPDATE users SET default_team_id = NULL WHERE id = $1 AND default_team_id = $2")
        .bind(user_id)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear removed member default team: {error}"),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn leave_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    let member = ensure_team_member(&state.db, id, claims.sub).await?;

    if member.role == "owner" {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "Team owners must transfer ownership or delete the team before leaving",
        ));
    }

    sqlx::query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2")
        .bind(id)
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to leave team: {error}"),
            )
        })?;

    sqlx::query("UPDATE users SET default_team_id = NULL WHERE id = $1 AND default_team_id = $2")
        .bind(claims.sub)
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear default team after leaving: {error}"),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn transfer_ownership(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(body): Json<TransferOwnershipRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    ensure_team_owner(&state.db, id, claims.sub).await?;

    if body.new_owner_id == claims.sub {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "New owner must be a different team member",
        ));
    }

    let new_owner_member = sqlx::query_as::<_, TeamMemberRow>(
        "SELECT id, team_id, user_id, role, joined_at FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
    )
    .bind(id)
    .bind(body.new_owner_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load new owner membership: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "New owner must be a team member"))?;

    if new_owner_member.role == "owner" {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Selected user is already the team owner",
        ));
    }

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start transaction: {error}"),
        )
    })?;

    sqlx::query("UPDATE team_members SET role = 'member' WHERE team_id = $1 AND user_id = $2")
        .bind(id)
        .bind(claims.sub)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to demote current owner: {error}"),
            )
        })?;

    sqlx::query("UPDATE team_members SET role = 'owner' WHERE team_id = $1 AND user_id = $2")
        .bind(id)
        .bind(body.new_owner_id)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to promote new owner: {error}"),
            )
        })?;

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit transaction: {error}"),
        )
    })?;

    Ok(AxumJson(json!({ "message": "Ownership transferred" })))
}

pub(crate) async fn search_users(
    headers: HeaderMap,
    State(state): State<AppState>,
    Query(query): Query<UserSearchQuery>,
) -> Result<impl IntoResponse, ApiError> {
    authorize(&headers, &state.jwt_secret)?;

    let search_term = query.q.unwrap_or_default().trim().to_string();
    if search_term.is_empty() {
        return Ok(AxumJson(Vec::<UserSearchResult>::new()));
    }

    let pattern = format!("%{search_term}%");
    let users = sqlx::query_as::<_, UserSearchRow>(
        r#"
        SELECT id, display_name, email, photo_url
        FROM users
        WHERE display_name ILIKE $1 OR email ILIKE $1
        ORDER BY LOWER(display_name) ASC, LOWER(email) ASC, id ASC
        LIMIT 20
        "#,
    )
    .bind(&pattern)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to search users: {error}"),
        )
    })?;

    Ok(AxumJson(
        users
            .into_iter()
            .map(|user| UserSearchResult {
                id: user.id,
                display_name: user.display_name,
                email: user.email,
                photo_url: user.photo_url,
            })
            .collect::<Vec<_>>(),
    ))
}

pub(crate) async fn invite_to_team(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(body): Json<InviteToTeamRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    ensure_team_owner_or_admin(&state.db, id, claims.sub).await?;

    let invitee_exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM users WHERE id = $1 LIMIT 1")
        .bind(body.user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check invitee: {error}"),
            )
        })?
        .is_some();

    if !invitee_exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Invitee not found"));
    }

    let already_member = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
    )
    .bind(id)
    .bind(body.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check existing membership: {error}"),
        )
    })?
    .is_some();

    if already_member {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "User is already a member of this team",
        ));
    }

    let pending_exists = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM team_invitations WHERE team_id = $1 AND invitee_id = $2 AND status = 'pending' LIMIT 1",
    )
    .bind(id)
    .bind(body.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check existing invitation: {error}"),
        )
    })?
    .is_some();

    if pending_exists {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "A pending invitation already exists for this user",
        ));
    }

    let invitation = sqlx::query_as::<_, TeamInvitationRow>(
        r#"
        INSERT INTO team_invitations (team_id, inviter_id, invitee_id, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING id, team_id, inviter_id, invitee_id, status, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(claims.sub)
    .bind(body.user_id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        if is_unique_violation(&error) {
            return ApiError::new(
                StatusCode::CONFLICT,
                "A pending invitation already exists for this user",
            );
        }

        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to create invitation: {error}"),
        )
    })?;

    let response = load_invitation_response(&state.db, invitation.id).await?;
    Ok((StatusCode::CREATED, AxumJson(response)))
}

pub(crate) async fn list_my_invitations(
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let invitations = sqlx::query_as::<_, TeamInvitationResponseRow>(
        r#"
        SELECT
            ti.id,
            ti.team_id,
            t.name AS team_name,
            inviter.display_name AS inviter_name,
            ti.status,
            ti.created_at
        FROM team_invitations ti
        INNER JOIN teams t ON t.id = ti.team_id
        INNER JOIN users inviter ON inviter.id = ti.inviter_id
        WHERE ti.invitee_id = $1 AND ti.status = 'pending'
        ORDER BY ti.created_at DESC
        "#,
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load invitations: {error}"),
        )
    })?;

    Ok(AxumJson(
        invitations
            .into_iter()
            .map(|invitation| TeamInvitationResponse {
                id: invitation.id,
                team_id: invitation.team_id,
                team_name: invitation.team_name,
                inviter_name: invitation.inviter_name,
                status: invitation.status,
                created_at: invitation.created_at,
            })
            .collect::<Vec<_>>(),
    ))
}

pub(crate) async fn accept_invitation(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let invitation = sqlx::query_as::<_, TeamInvitationRow>(
        "SELECT id, team_id, inviter_id, invitee_id, status, created_at, updated_at FROM team_invitations WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load invitation: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Invitation not found"))?;

    if invitation.invitee_id != claims.sub {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Only the invitee can accept this invitation",
        ));
    }

    if invitation.status != "pending" {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Only pending invitations can be accepted",
        ));
    }

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start transaction: {error}"),
        )
    })?;

    let update_result = sqlx::query(
        "UPDATE team_invitations SET status = 'accepted', updated_at = NOW() WHERE id = $1 AND status = 'pending'",
    )
    .bind(id)
    .execute(&mut *tx)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update invitation: {error}"),
        )
    })?;

    if update_result.rows_affected() == 0 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Only pending invitations can be accepted",
        ));
    }

    let membership_insert = sqlx::query(
        "INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')",
    )
    .bind(invitation.team_id)
    .bind(claims.sub)
    .execute(&mut *tx)
    .await;

    if let Err(error) = membership_insert {
        if is_unique_violation(&error) {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "User is already a member of this team",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to create team membership: {error}"),
        ));
    }

    sqlx::query("UPDATE users SET default_team_id = $1 WHERE id = $2 AND default_team_id IS NULL")
        .bind(invitation.team_id)
        .bind(claims.sub)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to set default team: {error}"),
            )
        })?;

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit transaction: {error}"),
        )
    })?;

    Ok(AxumJson(load_invitation_response(&state.db, id).await?))
}

pub(crate) async fn reject_invitation(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let invitation = sqlx::query_as::<_, TeamInvitationRow>(
        "SELECT id, team_id, inviter_id, invitee_id, status, created_at, updated_at FROM team_invitations WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load invitation: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Invitation not found"))?;

    if invitation.invitee_id != claims.sub {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Only the invitee can reject this invitation",
        ));
    }

    if invitation.status != "pending" {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Only pending invitations can be rejected",
        ));
    }

    let update_result = sqlx::query(
        "UPDATE team_invitations SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND status = 'pending'",
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update invitation: {error}"),
        )
    })?;

    if update_result.rows_affected() == 0 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Only pending invitations can be rejected",
        ));
    }

    Ok(AxumJson(load_invitation_response(&state.db, id).await?))
}

pub(crate) async fn cancel_invitation(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let invitation = sqlx::query_as::<_, TeamInvitationRow>(
        "SELECT id, team_id, inviter_id, invitee_id, status, created_at, updated_at FROM team_invitations WHERE id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load invitation: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Invitation not found"))?;

    if invitation.status != "pending" {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Only pending invitations can be cancelled",
        ));
    }

    ensure_team_owner_or_admin(&state.db, invitation.team_id, claims.sub).await?;

    let update_result = sqlx::query(
        "UPDATE team_invitations SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status = 'pending'",
    )
    .bind(id)
    .execute(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update invitation: {error}"),
        )
    })?;

    if update_result.rows_affected() == 0 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Only pending invitations can be cancelled",
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn toggle_favorite(
    headers: HeaderMap,
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<impl IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    ensure_team_exists(&state.db, id).await?;
    ensure_team_member(&state.db, id, claims.sub).await?;

    let existing = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM user_team_favorites WHERE user_id = $1 AND team_id = $2 LIMIT 1",
    )
    .bind(claims.sub)
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check favorite: {error}"),
        )
    })?;

    let is_favorite = if existing.is_some() {
        sqlx::query("DELETE FROM user_team_favorites WHERE user_id = $1 AND team_id = $2")
            .bind(claims.sub)
            .bind(id)
            .execute(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to remove favorite: {error}"),
                )
            })?;
        false
    } else {
        sqlx::query("INSERT INTO user_team_favorites (user_id, team_id) VALUES ($1, $2)")
            .bind(claims.sub)
            .bind(id)
            .execute(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to add favorite: {error}"),
                )
            })?;
        true
    };

    Ok(AxumJson(json!({ "isFavorite": is_favorite })))
}
