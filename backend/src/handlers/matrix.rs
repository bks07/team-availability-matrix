use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::{Datelike, NaiveDate, Utc};

use crate::auth::{authorize, get_user_permissions};
use crate::error::ApiError;
use crate::helpers::build_day_list;
use crate::models::{EmployeeRow, PublicHolidayRow, StatusRow, StatusValue, WorkScheduleRow};
use crate::state::AppState;
use crate::types::requests::{UpdateStatusRequest, YearQuery};
use crate::types::responses::{
    AvailabilityEntry, MatrixResponse, PublicHolidayResponse, PublicUser, WorkScheduleResponse,
};

pub(crate) async fn get_matrix(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<YearQuery>,
) -> Result<Json<MatrixResponse>, ApiError> {
    authorize(&headers, &state.jwt_secret)?;

    let year = query.year.unwrap_or_else(|| Utc::now().year());
    let start = NaiveDate::from_ymd_opt(year, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;
    let next_year_start = NaiveDate::from_ymd_opt(year + 1, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;

    let employees = sqlx::query_as::<_, EmployeeRow>(
        "SELECT id, email, display_name, location_id, photo_url FROM users ORDER BY LOWER(display_name) ASC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load employees: {error}"),
        )
    })?;

    let status_rows = sqlx::query_as::<_, StatusRow>(
        r#"
        SELECT user_id, status_date, status
        FROM availability_statuses
        WHERE status_date >= $1 AND status_date < $2
        ORDER BY status_date ASC, user_id ASC
        "#,
    )
    .bind(start)
    .bind(next_year_start)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load availability data: {error}"),
        )
    })?;

    let days = build_day_list(year)?;
    let entries = status_rows
        .into_iter()
        .map(|row| {
            Ok(AvailabilityEntry {
                user_id: row.user_id,
                date: row.status_date.to_string(),
                status: StatusValue::from_db_value(&row.status)?,
            })
        })
        .collect::<Result<Vec<_>, ApiError>>()?;

    let public_holiday_rows = sqlx::query_as::<_, PublicHolidayRow>(
        r#"
        SELECT id, holiday_date, name, location_id
        FROM public_holidays
        WHERE holiday_date >= $1 AND holiday_date < $2
        ORDER BY holiday_date ASC
        "#,
    )
    .bind(start)
    .bind(next_year_start)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load public holidays for matrix: {error}"),
        )
    })?;

    let public_holidays = public_holiday_rows
        .into_iter()
        .map(|holiday| PublicHolidayResponse {
            id: holiday.id,
            holiday_date: holiday.holiday_date.to_string(),
            name: holiday.name,
            location_id: holiday.location_id,
        })
        .collect();

    let schedule_rows = sqlx::query_as::<_, WorkScheduleRow>(
        "SELECT user_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, hours_per_week, ignore_weekends, ignore_public_holidays FROM employee_work_schedules",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load work schedules: {error}"),
        )
    })?;

    let mut work_schedules: Vec<WorkScheduleResponse> = schedule_rows
        .into_iter()
        .map(|row| WorkScheduleResponse {
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
        })
        .collect();

    let scheduled_user_ids: std::collections::HashSet<i64> =
        work_schedules.iter().map(|s| s.user_id).collect();
    for emp in &employees {
        if !scheduled_user_ids.contains(&emp.id) {
            work_schedules.push(WorkScheduleResponse {
                user_id: emp.id,
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
            });
        }
    }

    Ok(Json(MatrixResponse {
        year,
        days,
        employees: {
            let mut public_users = Vec::with_capacity(employees.len());
            for user in employees {
                let permissions = get_user_permissions(&state.db, user.id).await?;
                public_users.push(PublicUser {
                    id: user.id,
                    email: user.email,
                    display_name: user.display_name,
                    location_id: user.location_id,
                    photo_url: user.photo_url,
                    permissions,
                });
            }
            public_users
        },
        entries,
        public_holidays,
        work_schedules,
    }))
}



pub(crate) async fn update_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(date): Path<String>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<AvailabilityEntry>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;
    let parsed_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d")
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "Date must use YYYY-MM-DD"))?;

    sqlx::query(
        r#"
        INSERT INTO availability_statuses (user_id, status_date, status)
        VALUES ($1, $2, $3)
        ON CONFLICT(user_id, status_date)
        DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(claims.sub)
    .bind(parsed_date)
    .bind(payload.status.as_db_value())
    .execute(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to save availability status: {error}"),
        )
    })?;

    Ok(Json(AvailabilityEntry {
        user_id: claims.sub,
        date: parsed_date.to_string(),
        status: payload.status,
    }))
}

pub(crate) async fn delete_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(date): Path<String>,
) -> Result<StatusCode, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;
    let parsed_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d")
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "Date must use YYYY-MM-DD"))?;

    sqlx::query(
        r#"
        DELETE FROM availability_statuses
        WHERE user_id = $1 AND status_date = $2
        "#,
    )
    .bind(claims.sub)
    .bind(parsed_date)
    .execute(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to delete availability status: {error}"),
        )
    })?;

    Ok(StatusCode::NO_CONTENT)
}

