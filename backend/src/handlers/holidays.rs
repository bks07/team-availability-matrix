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
use crate::models::{HolidayLocationRow, PublicHolidayRow};
use crate::state::AppState;
use crate::types::requests::{
    AddLocationToHolidayRequest, CreatePublicHolidayRequest, PublicHolidayQuery,
    UpdatePublicHolidayRequest,
};
use crate::types::responses::PublicHolidayResponse;

const DUPLICATE_HOLIDAY_DATE_AND_NAME_MESSAGE: &str =
    "A public holiday already exists for this date and name";

fn aggregate_location_ids(rows: &[HolidayLocationRow]) -> std::collections::HashMap<i64, Vec<i64>> {
    let mut map: std::collections::HashMap<i64, Vec<i64>> = std::collections::HashMap::new();
    for row in rows {
        map.entry(row.holiday_id).or_default().push(row.location_id);
    }
    map
}

async fn fetch_public_holiday_response(
    state: &AppState,
    holiday_id: i64,
) -> Result<PublicHolidayResponse, ApiError> {
    let holiday = sqlx::query_as::<_, PublicHolidayRow>(
        "SELECT id, holiday_date, name FROM public_holidays WHERE id = $1",
    )
    .bind(holiday_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load public holiday: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "Public holiday not found"))?;

    let location_rows = sqlx::query_as::<_, HolidayLocationRow>(
        "SELECT holiday_id, location_id FROM public_holiday_locations WHERE holiday_id = $1",
    )
    .bind(holiday_id)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load public holiday locations: {error}"),
        )
    })?;

    let location_map = aggregate_location_ids(&location_rows);

    Ok(PublicHolidayResponse {
        id: holiday.id,
        holiday_date: holiday.holiday_date.to_string(),
        name: holiday.name,
        location_ids: location_map.get(&holiday.id).cloned().unwrap_or_default(),
    })
}

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
            SELECT DISTINCT ph.id, ph.holiday_date, ph.name
            FROM public_holidays ph
            INNER JOIN public_holiday_locations phl ON phl.holiday_id = ph.id
            WHERE phl.location_id = $1
            ORDER BY holiday_date ASC, id ASC
            "#,
        )
        .bind(location_id)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, PublicHolidayRow>(
            r#"
            SELECT id, holiday_date, name
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

    let holiday_ids: Vec<i64> = holidays.iter().map(|holiday| holiday.id).collect();
    let location_rows = if holiday_ids.is_empty() {
        Vec::new()
    } else {
        sqlx::query_as::<_, HolidayLocationRow>(
            "SELECT holiday_id, location_id FROM public_holiday_locations WHERE holiday_id = ANY($1::BIGINT[])",
        )
        .bind(&holiday_ids)
        .fetch_all(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load public holiday locations: {error}"),
            )
        })?
    };

    let location_map = aggregate_location_ids(&location_rows);

    Ok(Json(
        holidays
            .into_iter()
            .map(|holiday| PublicHolidayResponse {
                id: holiday.id,
                holiday_date: holiday.holiday_date.to_string(),
                name: holiday.name,
                location_ids: location_map.get(&holiday.id).cloned().unwrap_or_default(),
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

    let holiday = sqlx::query_as::<_, PublicHolidayRow>(
        "INSERT INTO public_holidays (holiday_date, name) VALUES ($1, $2) RETURNING id, holiday_date, name",
    )
    .bind(parsed_date)
    .bind(&name)
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
                    DUPLICATE_HOLIDAY_DATE_AND_NAME_MESSAGE,
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
            location_ids: vec![],
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
        return Err(ApiError::new(
            StatusCode::NOT_FOUND,
            "Public holiday not found",
        ));
    }

    let update_result =
        sqlx::query("UPDATE public_holidays SET holiday_date = $1, name = $2 WHERE id = $3")
            .bind(parsed_date)
            .bind(&name)
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
                DUPLICATE_HOLIDAY_DATE_AND_NAME_MESSAGE,
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update public holiday: {error}"),
        ));
    }

    let location_rows = sqlx::query_as::<_, HolidayLocationRow>(
        "SELECT holiday_id, location_id FROM public_holiday_locations WHERE holiday_id = $1",
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load public holiday locations: {error}"),
        )
    })?;

    let location_map = aggregate_location_ids(&location_rows);
    let location_ids = location_map.get(&id).cloned().unwrap_or_default();

    Ok(Json(PublicHolidayResponse {
        id,
        holiday_date: parsed_date.to_string(),
        name,
        location_ids,
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
        return Err(ApiError::new(
            StatusCode::NOT_FOUND,
            "Public holiday not found",
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub(crate) async fn add_location_to_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<AddLocationToHolidayRequest>,
) -> Result<(StatusCode, Json<PublicHolidayResponse>), ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PUBLIC_HOLIDAYS_EDIT,
    )
    .await?;

    let holiday_exists =
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

    if !holiday_exists {
        return Err(ApiError::new(
            StatusCode::NOT_FOUND,
            "Public holiday not found",
        ));
    }

    ensure_location_exists(&state.db, payload.location_id).await?;

    let insert_result = sqlx::query(
        "INSERT INTO public_holiday_locations (holiday_id, location_id) VALUES ($1, $2)",
    )
    .bind(id)
    .bind(payload.location_id)
    .execute(&state.db)
    .await;

    if let Err(error) = insert_result {
        if error
            .to_string()
            .contains("duplicate key value violates unique constraint")
        {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "This location is already assigned to this public holiday",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to add location to public holiday: {error}"),
        ));
    }

    let response = fetch_public_holiday_response(&state, id).await?;
    Ok((StatusCode::OK, Json(response)))
}

pub(crate) async fn remove_location_from_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path((id, location_id)): Path<(i64, i64)>,
) -> Result<StatusCode, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_PUBLIC_HOLIDAYS_EDIT,
    )
    .await?;

    let delete_result = sqlx::query(
        "DELETE FROM public_holiday_locations WHERE holiday_id = $1 AND location_id = $2",
    )
    .bind(id)
    .bind(location_id)
    .execute(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to remove location from public holiday: {error}"),
        )
    })?;

    if delete_result.rows_affected() == 0 {
        return Err(ApiError::new(
            StatusCode::NOT_FOUND,
            "Location assignment not found",
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}

#[cfg(test)]
mod tests {
    use super::{aggregate_location_ids, DUPLICATE_HOLIDAY_DATE_AND_NAME_MESSAGE};
    use crate::models::HolidayLocationRow;

    #[test]
    fn aggregate_location_ids_returns_empty_map_for_empty_slice() {
        let rows: Vec<HolidayLocationRow> = vec![];
        let map = aggregate_location_ids(&rows);
        assert!(map.is_empty());
    }

    #[test]
    fn aggregate_location_ids_groups_rows_with_same_holiday_id() {
        let rows = vec![
            HolidayLocationRow {
                holiday_id: 10,
                location_id: 1,
            },
            HolidayLocationRow {
                holiday_id: 10,
                location_id: 2,
            },
        ];

        let map = aggregate_location_ids(&rows);
        assert_eq!(map.len(), 1);
        assert_eq!(map.get(&10), Some(&vec![1, 2]));
    }

    #[test]
    fn aggregate_location_ids_creates_distinct_keys_for_distinct_holidays() {
        let rows = vec![
            HolidayLocationRow {
                holiday_id: 10,
                location_id: 1,
            },
            HolidayLocationRow {
                holiday_id: 11,
                location_id: 2,
            },
        ];

        let map = aggregate_location_ids(&rows);
        assert_eq!(map.len(), 2);
        assert_eq!(map.get(&10), Some(&vec![1]));
        assert_eq!(map.get(&11), Some(&vec![2]));
    }

    #[test]
    fn duplicate_error_message_constant_matches_expected_text() {
        assert_eq!(
            DUPLICATE_HOLIDAY_DATE_AND_NAME_MESSAGE,
            "A public holiday already exists for this date and name"
        );
    }
}
