use axum::{
    extract::{Multipart, Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::{Datelike, NaiveDate, Utc, Weekday};
use std::collections::HashMap;

use crate::auth::{
    authorize, get_user_permissions, get_user_profile_name, require_permission, PERM_USERS_EDIT,
};
use crate::error::ApiError;
use crate::helpers::build_day_list;
use crate::models::{EmployeeRow, PublicHolidayRow, StatusRow, StatusValue, WorkScheduleRow};
use crate::state::AppState;
use crate::types::requests::{BulkStatusRequest, UpdateStatusRequest, YearQuery};
use crate::types::responses::{
    AvailabilityEntry, BulkStatusResponse, MatrixResponse, PublicHolidayResponse, PublicUser,
    WorkScheduleResponse,
};

pub(crate) async fn get_matrix(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<YearQuery>,
) -> Result<Json<MatrixResponse>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let year = query.year.unwrap_or_else(|| Utc::now().year());
    let start = NaiveDate::from_ymd_opt(year, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;
    let next_year_start = NaiveDate::from_ymd_opt(year + 1, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;

    let employees = if let Some(team_id) = query.team_id {
        let member_check = sqlx::query_scalar::<_, i32>(
            "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
        )
        .bind(team_id)
        .bind(claims.sub)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to verify team membership: {error}"),
            )
        })?;

        if member_check.is_none() {
            return Err(ApiError::new(
                StatusCode::FORBIDDEN,
                "Not a member of this team",
            ));
        }

        sqlx::query_as::<_, EmployeeRow>(
            "SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.default_team_id, u.location_id, u.photo_url, l.name AS location_name FROM users u INNER JOIN team_members tm ON tm.user_id = u.id LEFT JOIN locations l ON u.location_id = l.id WHERE tm.team_id = $1 ORDER BY LOWER(u.display_name) ASC",
        )
        .bind(team_id)
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load employees: {error}"),
            )
        })?
    } else {
        sqlx::query_as::<_, EmployeeRow>(
            "SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.default_team_id, u.location_id, u.photo_url, l.name AS location_name FROM users u LEFT JOIN locations l ON u.location_id = l.id WHERE u.id = $1",
        )
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load employees: {error}"),
            )
        })?
    };

    let employee_ids: Vec<i64> = employees.iter().map(|employee| employee.id).collect();

    let status_rows = if employee_ids.is_empty() {
        Vec::new()
    } else {
        sqlx::query_as::<_, StatusRow>(
            r#"
            SELECT user_id, status_date, status
            FROM availability_statuses
            WHERE status_date >= $1 AND status_date < $2 AND user_id = ANY($3::BIGINT[])
            ORDER BY status_date ASC, user_id ASC
            "#,
        )
        .bind(start)
        .bind(next_year_start)
        .bind(&employee_ids[..])
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load availability data: {error}"),
            )
        })?
    };

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

    let location_ids: Vec<i64> = employees
        .iter()
        .filter_map(|employee| employee.location_id)
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    let public_holiday_rows = if location_ids.is_empty() {
        Vec::new()
    } else {
        sqlx::query_as::<_, PublicHolidayRow>(
            r#"
            SELECT id, holiday_date, name, location_id
            FROM public_holidays
            WHERE holiday_date >= $1 AND holiday_date < $2 AND location_id = ANY($3::BIGINT[])
            ORDER BY holiday_date ASC
            "#,
        )
        .bind(start)
        .bind(next_year_start)
        .bind(&location_ids[..])
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load public holidays for matrix: {error}"),
            )
        })?
    };

    let public_holidays = public_holiday_rows
        .into_iter()
        .map(|holiday| PublicHolidayResponse {
            id: holiday.id,
            holiday_date: holiday.holiday_date.to_string(),
            name: holiday.name,
            location_id: holiday.location_id,
        })
        .collect();

    let schedule_rows = if employee_ids.is_empty() {
        Vec::new()
    } else {
        sqlx::query_as::<_, WorkScheduleRow>(
            "SELECT user_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, hours_per_week, ignore_weekends, ignore_public_holidays FROM employee_work_schedules WHERE user_id = ANY($1::BIGINT[])",
        )
        .bind(&employee_ids[..])
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load work schedules: {error}"),
            )
        })?
    };

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
                let permission_profile_name = get_user_profile_name(&state.db, user.id).await?;
                public_users.push(PublicUser {
                    id: user.id,
                    email: user.email,
                    display_name: user.display_name,
                    title: user.title,
                    first_name: user.first_name,
                    middle_name: user.middle_name,
                    last_name: user.last_name,
                    default_team_id: user.default_team_id,
                    location_id: user.location_id,
                    location_name: user.location_name,
                    photo_url: user.photo_url,
                    permissions,
                    permission_profile_name,
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

pub(crate) async fn bulk_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<BulkStatusRequest>,
) -> Result<Json<BulkStatusResponse>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let parsed_dates = body
        .dates
        .iter()
        .map(|date| {
            NaiveDate::parse_from_str(date, "%Y-%m-%d")
                .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "Date must use YYYY-MM-DD"))
        })
        .collect::<Result<Vec<_>, ApiError>>()?;

    let mut filtered_dates = parsed_dates;
    if body.skip_weekends {
        filtered_dates.retain(|date| date.weekday() != Weekday::Sat && date.weekday() != Weekday::Sun);
    }

    if body.skip_public_holidays && !filtered_dates.is_empty() {
        let location_id = sqlx::query_scalar::<_, Option<i64>>(
            "SELECT location_id FROM users WHERE id = $1",
        )
        .bind(claims.sub)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load user location for bulk status update: {error}"),
            )
        })?
        .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists"))?;

        if let Some(location_id) = location_id {
            let holiday_dates = sqlx::query_scalar::<_, NaiveDate>(
                "SELECT holiday_date FROM public_holidays WHERE location_id = $1 AND holiday_date = ANY($2::date[])",
            )
            .bind(location_id)
            .bind(&filtered_dates[..])
            .fetch_all(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to load public holidays for bulk status update: {error}"),
                )
            })?;

            let holiday_dates: std::collections::HashSet<NaiveDate> = holiday_dates.into_iter().collect();
            filtered_dates.retain(|date| !holiday_dates.contains(date));
        }
    }

    if filtered_dates.is_empty() {
        return Ok(Json(BulkStatusResponse { updated_count: 0 }));
    }

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Transaction failed: {error}"),
        )
    })?;

    let result = if let Some(status) = body.status {
        sqlx::query(
            r#"
            INSERT INTO availability_statuses (user_id, status_date, status)
            SELECT $1, unnest($2::date[]), $3
            ON CONFLICT (user_id, status_date)
            DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(claims.sub)
        .bind(&filtered_dates[..])
        .bind(status.as_db_value())
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to save bulk availability statuses: {error}"),
            )
        })?
    } else {
        sqlx::query(
            r#"
            DELETE FROM availability_statuses
            WHERE user_id = $1 AND status_date = ANY($2::date[])
            "#,
        )
        .bind(claims.sub)
        .bind(&filtered_dates[..])
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear bulk availability statuses: {error}"),
            )
        })?
    };

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Transaction commit failed: {error}"),
        )
    })?;

    Ok(Json(BulkStatusResponse {
        updated_count: result.rows_affected() as i64,
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

// GET /api/matrix/export
pub(crate) async fn export_matrix_csv(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<YearQuery>,
) -> Result<impl axum::response::IntoResponse, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let year = query.year.unwrap_or_else(|| Utc::now().year());
    let start = NaiveDate::from_ymd_opt(year, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;
    let next_year_start = NaiveDate::from_ymd_opt(year + 1, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;

    let employees = if let Some(team_id) = query.team_id {
        let member_check = sqlx::query_scalar::<_, i32>(
            "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 LIMIT 1",
        )
        .bind(team_id)
        .bind(claims.sub)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to verify team membership: {error}"),
            )
        })?;

        if member_check.is_none() {
            return Err(ApiError::new(
                StatusCode::FORBIDDEN,
                "Not a member of this team",
            ));
        }

        sqlx::query_as::<_, EmployeeRow>(
            "SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.default_team_id, u.location_id, u.photo_url, l.name AS location_name FROM users u INNER JOIN team_members tm ON tm.user_id = u.id LEFT JOIN locations l ON u.location_id = l.id WHERE tm.team_id = $1 ORDER BY LOWER(u.display_name) ASC",
        )
        .bind(team_id)
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load employees: {error}"),
            )
        })?
    } else {
        sqlx::query_as::<_, EmployeeRow>(
            "SELECT u.id, u.email, u.display_name, u.title, u.first_name, u.middle_name, u.last_name, u.default_team_id, u.location_id, u.photo_url, l.name AS location_name FROM users u LEFT JOIN locations l ON u.location_id = l.id WHERE u.id = $1",
        )
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load employees: {error}"),
            )
        })?
    };

    let employee_ids: Vec<i64> = employees.iter().map(|employee| employee.id).collect();

    let status_rows = if employee_ids.is_empty() {
        Vec::new()
    } else {
        sqlx::query_as::<_, StatusRow>(
            "SELECT user_id, status_date, status FROM availability_statuses WHERE status_date >= $1 AND status_date < $2 AND user_id = ANY($3::BIGINT[]) ORDER BY status_date ASC, user_id ASC",
        )
        .bind(start)
        .bind(next_year_start)
        .bind(&employee_ids[..])
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load availability data: {error}"),
            )
        })?
    };

    let mut status_map: HashMap<(i64, String), String> = HashMap::new();
    for row in &status_rows {
        status_map.insert((row.user_id, row.status_date.to_string()), row.status.clone());
    }

    let days = build_day_list(year)?;

    let mut csv = String::from("Date");
    for employee in &employees {
        csv.push(',');
        csv.push_str(&escape_csv_field(&employee.display_name));
    }
    csv.push('\n');

    for day in &days {
        csv.push_str(day);
        for employee in &employees {
            csv.push(',');
            let status = status_map
                .get(&(employee.id, day.clone()))
                .map(|value| value.as_str())
                .unwrap_or("W");
            csv.push_str(status);
        }
        csv.push('\n');
    }

    let filename = format!("availability-matrix-{year}.csv");
    Ok((
        StatusCode::OK,
        [
            (axum::http::header::CONTENT_TYPE, "text/csv".to_string()),
            (
                axum::http::header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
        ],
        csv,
    ))
}

// POST /api/matrix/import
pub(crate) async fn import_matrix_csv(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Result<Json<ImportMatrixResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_USERS_EDIT).await?;

    let field = multipart
        .next_field()
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Failed to read upload: {error}"),
            )
        })?
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "No file uploaded"))?;

    let csv_bytes = field.bytes().await.map_err(|error| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("Failed to read file data: {error}"),
        )
    })?;

    let csv_text = String::from_utf8(csv_bytes.to_vec())
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "File is not valid UTF-8 text"))?;

    let mut lines = csv_text.lines();
    let header_line = lines
        .next()
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "CSV file is empty"))?;

    let header_fields = parse_csv_line(header_line)?;
    if header_fields.is_empty() || !header_fields[0].eq_ignore_ascii_case("Date") {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "CSV header must start with 'Date'",
        ));
    }

    let employee_names = &header_fields[1..];
    let all_users: Vec<(i64, String)> = sqlx::query_as(
        r#"
        SELECT DISTINCT u.id, u.display_name
        FROM users u
        INNER JOIN team_members tm ON tm.user_id = u.id
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load users: {error}"),
        )
    })?;

    let user_map: HashMap<String, i64> = all_users
        .into_iter()
        .map(|(id, name)| (name.to_lowercase(), id))
        .collect();

    let mut column_user_ids: Vec<Option<i64>> = Vec::with_capacity(employee_names.len());
    let mut warnings: Vec<String> = Vec::new();

    for name in employee_names {
        let lower_name = name.to_lowercase();
        if let Some(user_id) = user_map.get(&lower_name) {
            column_user_ids.push(Some(*user_id));
        } else {
            warnings.push(format!("Unknown employee: {name}"));
            column_user_ids.push(None);
        }
    }

    let mut updated_count = 0_i64;
    let mut skipped_count = 0_i64;
    let mut row_number = 1_u32;

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start transaction: {error}"),
        )
    })?;

    for line in lines {
        row_number += 1;
        if line.trim().is_empty() {
            continue;
        }

        let fields = match parse_csv_line(line) {
            Ok(parsed) => parsed,
            Err(_) => {
                warnings.push(format!("Row {row_number}: Invalid CSV format"));
                skipped_count += 1;
                continue;
            }
        };

        if fields.is_empty() || fields[0].trim().is_empty() {
            continue;
        }

        let date_str = fields[0].trim();
        let parsed_date = match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            Ok(date) => date,
            Err(_) => {
                warnings.push(format!("Row {row_number}: Invalid date '{date_str}'"));
                skipped_count += 1;
                continue;
            }
        };

        for (column_index, user_id) in column_user_ids.iter().enumerate() {
            let Some(user_id) = user_id else {
                continue;
            };

            let status = fields
                .get(column_index + 1)
                .map(|value| value.trim())
                .unwrap_or("");

            if status.is_empty() {
                continue;
            }

            if status != "W" && status != "V" && status != "A" {
                warnings.push(format!(
                    "Row {row_number}, column {}: Invalid status '{status}'",
                    column_index + 2
                ));
                skipped_count += 1;
                continue;
            }

            sqlx::query(
                r#"
                INSERT INTO availability_statuses (user_id, status_date, status)
                VALUES ($1, $2, $3)
                ON CONFLICT(user_id, status_date)
                DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
                "#,
            )
            .bind(*user_id)
            .bind(parsed_date)
            .bind(status)
            .execute(&mut *tx)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to upsert status: {error}"),
                )
            })?;

            updated_count += 1;
        }
    }

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit import: {error}"),
        )
    })?;

    Ok(Json(ImportMatrixResponse {
        updated_count,
        skipped_count,
        warnings,
    }))
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ImportMatrixResponse {
    pub(crate) updated_count: i64,
    pub(crate) skipped_count: i64,
    pub(crate) warnings: Vec<String>,
}

fn parse_csv_line(line: &str) -> Result<Vec<String>, ApiError> {
    let mut fields: Vec<String> = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '"' => {
                if in_quotes && chars.peek() == Some(&'"') {
                    current.push('"');
                    let _ = chars.next();
                } else {
                    in_quotes = !in_quotes;
                }
            }
            ',' if !in_quotes => {
                fields.push(current.trim().to_string());
                current.clear();
            }
            _ => current.push(ch),
        }
    }

    if in_quotes {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "CSV contains unbalanced quotes",
        ));
    }

    fields.push(current.trim().to_string());
    Ok(fields)
}

fn escape_csv_field(field: &str) -> String {
    if field.contains(',') || field.contains('"') || field.contains('\n') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
}

