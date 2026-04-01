use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{
    authorize, get_user_permissions, hash_password, issue_token, validate_password,
    verify_password, FIRST_USER_PERMISSIONS,
};
use crate::error::ApiError;
use crate::helpers::{
    derive_display_name, find_public_user, normalize_email, normalize_name_fields,
};
use crate::models::UserRecord;
use crate::state::AppState;
use crate::types::requests::{LoginRequest, RegisterRequest};
use crate::types::responses::{AuthResponse, PublicUser};

pub(crate) async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let self_registration_setting = sqlx::query_scalar::<_, String>(
        "SELECT value FROM system_settings WHERE key = 'self_registration_enabled'",
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load self-registration setting: {error}"),
        )
    })?;

    if self_registration_setting.as_deref() == Some("false") {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Self-registration is currently disabled",
        ));
    }

    let email = normalize_email(&payload.email)?;
    let (title, first_name, middle_name, last_name) =
        normalize_name_fields("", &payload.first_name, "", &payload.last_name)?;
    let display_name = derive_display_name(&title, &first_name, &middle_name, &last_name);
    validate_password(&payload.password)?;

    let password_hash = hash_password(&payload.password)?;

    let inserted_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO users (email, display_name, password_hash, title, first_name, middle_name, last_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    )
    .bind(&email)
    .bind(&display_name)
    .bind(password_hash)
    .bind(&title)
    .bind(&first_name)
    .bind(&middle_name)
    .bind(&last_name)
    .fetch_one(&state.db)
    .await;

    let inserted_id = match inserted_id {
        Ok(id) => id,
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
                format!("Failed to create account: {error}"),
            ));
        }
    };

    let user = sqlx::query_as::<_, UserRecord>(
        "SELECT id, email, display_name, title, first_name, middle_name, last_name, default_team_id, location_id, photo_url, password_hash FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load account after registration: {error}"),
        )
    })?;

    if inserted_id == 1 {
        for permission in FIRST_USER_PERMISSIONS {
            sqlx::query(
                "INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2) ON CONFLICT (user_id, permission) DO NOTHING",
            )
                .bind(user.id)
                .bind(permission)
                .execute(&state.db)
                .await
                .map_err(|error| {
                    ApiError::new(
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to assign initial permissions: {error}"),
                    )
                })?;
        }
    }

    let permissions = get_user_permissions(&state.db, user.id).await?;

    let token = issue_token(user.id, &state.jwt_secret)?;

    Ok(Json(AuthResponse {
        token,
        user: PublicUser {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            title: user.title,
            first_name: user.first_name,
            middle_name: user.middle_name,
            last_name: user.last_name,
            default_team_id: user.default_team_id,
            location_id: user.location_id,
            location_name: None,
            photo_url: user.photo_url,
            permissions: permissions.clone(),
        },
        permissions,
    }))
}



pub(crate) async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let email = normalize_email(&payload.email)?;

    let user = sqlx::query_as::<_, UserRecord>(
        "SELECT id, email, display_name, title, first_name, middle_name, last_name, default_team_id, location_id, photo_url, password_hash FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to query user account: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Invalid email or password"))?;

    verify_password(&payload.password, &user.password_hash)?;
    let permissions = get_user_permissions(&state.db, user.id).await?;
    let location_name = sqlx::query_scalar::<_, String>(
        "SELECT l.name FROM users u LEFT JOIN locations l ON u.location_id = l.id WHERE u.id = $1",
    )
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user location: {error}"),
        )
    })?;
    let token = issue_token(user.id, &state.jwt_secret)?;

    Ok(Json(AuthResponse {
        token,
        user: PublicUser {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            title: user.title,
            first_name: user.first_name,
            middle_name: user.middle_name,
            last_name: user.last_name,
            default_team_id: user.default_team_id,
            location_id: user.location_id,
            location_name,
            photo_url: user.photo_url,
            permissions: permissions.clone(),
        },
        permissions,
    }))
}



pub(crate) async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<PublicUser>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;
    let user = find_public_user(&state.db, claims.sub).await?;
    Ok(Json(user))
}

