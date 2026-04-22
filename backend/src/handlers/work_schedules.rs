use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{require_permission, PERM_USERS_EDIT};
use crate::error::ApiError;
use crate::helpers::ensure_user_exists;
use crate::models::WorkScheduleRow;
use crate::state::AppState;
use crate::types::requests::UpdateWorkScheduleRequest;
use crate::types::responses::WorkScheduleResponse;

fn to_response(row: WorkScheduleRow) -> WorkScheduleResponse {
    WorkScheduleResponse {
        user_id: row.user_id,
        monday: row.monday,
        tuesday: row.tuesday,
        wednesday: row.wednesday,
        thursday: row.thursday,
        friday: row.friday,
        saturday: row.saturday,
        sunday: row.sunday,
        hours_per_week: row.hours_per_week,
        ignore_weekends: row.ignore_weekends,
        ignore_public_holidays: row.ignore_public_holidays,
    }
}

fn default_schedule(user_id: i64) -> WorkScheduleResponse {
    WorkScheduleResponse {
        user_id,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        hours_per_week: None,
        ignore_weekends: true,
        ignore_public_holidays: true,
    }
}

pub(crate) async fn get_work_schedule(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<Json<WorkScheduleResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_USERS_EDIT).await?;

    let schedule = sqlx::query_as::<_, WorkScheduleRow>(
        r#"
        SELECT
            user_id,
            monday,
            tuesday,
            wednesday,
            thursday,
            friday,
            saturday,
            sunday,
            hours_per_week,
            ignore_weekends,
            ignore_public_holidays
        FROM employee_work_schedules
        WHERE user_id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load work schedule: {error}"),
        )
    })?;

    let response = match schedule {
        Some(row) => to_response(row),
        None => default_schedule(id),
    };

    Ok(Json(response))
}

pub(crate) async fn update_work_schedule(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateWorkScheduleRequest>,
) -> Result<Json<WorkScheduleResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_USERS_EDIT).await?;
    ensure_user_exists(&state.db, id).await?;

    let has_any_workday = payload.monday
        || payload.tuesday
        || payload.wednesday
        || payload.thursday
        || payload.friday
        || payload.saturday
        || payload.sunday;
    if !has_any_workday {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "At least one weekday must be enabled",
        ));
    }

    if let Some(hours_per_week) = payload.hours_per_week {
        if hours_per_week <= 0.0 {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Hours per week must be greater than 0",
            ));
        }
    }

    let saved = sqlx::query_as::<_, WorkScheduleRow>(
        r#"
        INSERT INTO employee_work_schedules (
            user_id,
            monday,
            tuesday,
            wednesday,
            thursday,
            friday,
            saturday,
            sunday,
            hours_per_week,
            ignore_weekends,
            ignore_public_holidays
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id)
        DO UPDATE SET
            monday = excluded.monday,
            tuesday = excluded.tuesday,
            wednesday = excluded.wednesday,
            thursday = excluded.thursday,
            friday = excluded.friday,
            saturday = excluded.saturday,
            sunday = excluded.sunday,
            hours_per_week = excluded.hours_per_week,
            ignore_weekends = excluded.ignore_weekends,
            ignore_public_holidays = excluded.ignore_public_holidays
        RETURNING
            user_id,
            monday,
            tuesday,
            wednesday,
            thursday,
            friday,
            saturday,
            sunday,
            hours_per_week,
            ignore_weekends,
            ignore_public_holidays
        "#,
    )
    .bind(id)
    .bind(payload.monday)
    .bind(payload.tuesday)
    .bind(payload.wednesday)
    .bind(payload.thursday)
    .bind(payload.friday)
    .bind(payload.saturday)
    .bind(payload.sunday)
    .bind(payload.hours_per_week)
    .bind(payload.ignore_weekends)
    .bind(payload.ignore_public_holidays)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update work schedule: {error}"),
        )
    })?;

    Ok(Json(to_response(saved)))
}
