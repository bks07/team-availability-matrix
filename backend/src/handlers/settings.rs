use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{require_permission, PERM_SETTINGS_MANAGE};
use crate::error::ApiError;
use crate::models::SystemSettingRow;
use crate::state::AppState;
use crate::types::requests::UpdateSelfRegistrationRequest;
use crate::types::responses::SelfRegistrationSettingResponse;

pub(crate) async fn get_self_registration_setting(
    State(state): State<AppState>,
) -> Result<Json<SelfRegistrationSettingResponse>, ApiError> {
    let setting = sqlx::query_as::<_, SystemSettingRow>(
        "SELECT key, value FROM system_settings WHERE key = 'self_registration_enabled'",
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load self-registration setting: {error}"),
        )
    })?;

    let enabled = match setting {
        Some(row) => row.key == "self_registration_enabled" && row.value == "true",
        None => true,
    };

    Ok(Json(SelfRegistrationSettingResponse { enabled }))
}

pub(crate) async fn update_self_registration_setting(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateSelfRegistrationRequest>,
) -> Result<Json<SelfRegistrationSettingResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_SETTINGS_MANAGE).await?;

    let value = if payload.enabled { "true" } else { "false" };

    sqlx::query(
        "INSERT INTO system_settings (key, value) VALUES ('self_registration_enabled', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
    )
    .bind(value)
    .execute(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update self-registration setting: {error}"),
        )
    })?;

    Ok(Json(SelfRegistrationSettingResponse {
        enabled: payload.enabled,
    }))
}
