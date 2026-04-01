use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::NaiveDate;

use crate::auth::{
    require_permission, PERM_PUBLIC_HOLIDAYS_CREATE, PERM_PUBLIC_HOLIDAYS_DELETE,
    PERM_PUBLIC_HOLIDAYS_EDIT, PERM_PUBLIC_HOLIDAYS_VIEW,
};
use crate::error::ApiError;
use crate::helpers::{ensure_location_exists, normalize_public_holiday_name};
use crate::models::PublicHolidayRow;
use crate::state::AppState;
use crate::types::requests::{
    CreatePublicHolidayRequest, PublicHolidayQuery, UpdatePublicHolidayRequest,
};
use crate::types::responses::PublicHolidayResponse;

pub(crate) async fn list_public_holidays(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<PublicHolidayQuery>,
) -> Result<Json<Vec<PublicHolidayResponse>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PUBLIC_HOLIDAYS_VIEW,
    )
    .await?;

    let holidays = if let Some(location_id) = query.location_id {
        sqlx::query_as::<_, PublicHolidayRow>(
            r#"
            SELECT id, holiday_date, name, location_id
            FROM public_holidays
            WHERE location_id = $1
            ORDER BY holiday_date ASC, id ASC
            "#,
        )
        .bind(location_id)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, PublicHolidayRow>(
            r#"
            SELECT id, holiday_date, name, location_id
            FROM public_holidays
            ORDER BY holiday_date ASC, id ASC
            "#,
        )
        .fetch_all(&state.db)
        .await
    }
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load public holidays: {error}"),
        )
    })?;

    Ok(Json(
        holidays
            .into_iter()
            .map(|holiday| PublicHolidayResponse {
                id: holiday.id,
                holiday_date: holiday.holiday_date.to_string(),
                name: holiday.name,
                location_id: holiday.location_id,
            })
            .collect(),
    ))
}



pub(crate) async fn create_public_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePublicHolidayRequest>,
) -> Result<(StatusCode, Json<PublicHolidayResponse>), ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PUBLIC_HOLIDAYS_CREATE,
    )
    .await?;

    let parsed_date = NaiveDate::parse_from_str(&payload.holiday_date, "%Y-%m-%d")
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "holidayDate must use YYYY-MM-DD"))?;
    let name = normalize_public_holiday_name(&payload.name)?;
    ensure_location_exists(&state.db, payload.location_id).await?;

    let holiday = sqlx::query_as::<_, PublicHolidayRow>(
        "INSERT INTO public_holidays (holiday_date, name, location_id) VALUES ($1, $2, $3) RETURNING id, holiday_date, name, location_id",
    )
    .bind(parsed_date)
    .bind(&name)
    .bind(payload.location_id)
    .fetch_one(&state.db)
    .await;

    let holiday = match holiday {
        Ok(holiday) => holiday,
        Err(error) => {
            if error
                .to_string()
                .contains("duplicate key value violates unique constraint")
            {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "A public holiday already exists for this date and location",
                ));
            }

            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create public holiday: {error}"),
            ));
        }
    };

    Ok((
        StatusCode::CREATED,
        Json(PublicHolidayResponse {
            id: holiday.id,
            holiday_date: holiday.holiday_date.to_string(),
            name: holiday.name,
            location_id: holiday.location_id,
        }),
    ))
}



pub(crate) async fn update_public_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePublicHolidayRequest>,
) -> Result<Json<PublicHolidayResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PUBLIC_HOLIDAYS_EDIT,
    )
    .await?;

    let parsed_date = NaiveDate::parse_from_str(&payload.holiday_date, "%Y-%m-%d")
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "holidayDate must use YYYY-MM-DD"))?;
    let name = normalize_public_holiday_name(&payload.name)?;
    ensure_location_exists(&state.db, payload.location_id).await?;

    let exists =
        sqlx::query_scalar::<_, i32>("SELECT 1 FROM public_holidays WHERE id = $1 LIMIT 1")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check public holiday: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Public holiday not found"));
    }

    let update_result = sqlx::query(
        "UPDATE public_holidays SET holiday_date = $1, name = $2, location_id = $3 WHERE id = $4",
    )
    .bind(parsed_date)
    .bind(&name)
    .bind(payload.location_id)
    .bind(id)
    .execute(&state.db)
    .await;

    if let Err(error) = update_result {
        if error
            .to_string()
            .contains("duplicate key value violates unique constraint")
        {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "A public holiday already exists for this date and location",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update public holiday: {error}"),
        ));
    }

    Ok(Json(PublicHolidayResponse {
        id,
        holiday_date: parsed_date.to_string(),
        name,
        location_id: payload.location_id,
    }))
}



pub(crate) async fn delete_public_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PUBLIC_HOLIDAYS_DELETE,
    )
    .await?;

    let delete_result = sqlx::query("DELETE FROM public_holidays WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete public holiday: {error}"),
            )
        })?;

    if delete_result.rows_affected() == 0 {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Public holiday not found"));
    }

    Ok(StatusCode::NO_CONTENT)
}

