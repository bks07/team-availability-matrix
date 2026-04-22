use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde::Deserialize;

use crate::auth::{
    require_permission, PERM_LOCATIONS_CREATE, PERM_LOCATIONS_DELETE, PERM_LOCATIONS_EDIT,
    PERM_LOCATIONS_VIEW,
};
use crate::error::ApiError;
use crate::helpers::{normalize_location_name, table_exists};
use crate::models::{LocationRow, LocationRowWithCount};
use crate::state::AppState;
use crate::types::requests::{CreateLocationRequest, UpdateLocationRequest};
use crate::types::responses::LocationResponse;

#[derive(Debug, Deserialize)]
pub(crate) struct DeleteLocationQuery {
    #[serde(default)]
    pub(crate) force: bool,
}

pub(crate) async fn list_locations(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<LocationResponse>>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_LOCATIONS_VIEW).await?;

    let locations = sqlx::query_as::<_, LocationRowWithCount>(
        "SELECT l.id, l.name, \
         COALESCE((SELECT COUNT(*) FROM users u WHERE u.location_id = l.id), 0) AS user_count \
         FROM locations l \
         ORDER BY LOWER(l.name) ASC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load locations: {error}"),
        )
    })?;

    Ok(Json(
        locations
            .into_iter()
            .map(|location| LocationResponse {
                id: location.id,
                name: location.name,
                user_count: location.user_count,
            })
            .collect(),
    ))
}

pub(crate) async fn create_location(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateLocationRequest>,
) -> Result<(StatusCode, Json<LocationResponse>), ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_LOCATIONS_CREATE,
    )
    .await?;

    let name = normalize_location_name(&payload.name)?;

    let location = sqlx::query_as::<_, LocationRow>(
        "INSERT INTO locations (name) VALUES ($1) RETURNING id, name",
    )
    .bind(&name)
    .fetch_one(&state.db)
    .await;

    let location = match location {
        Ok(location) => location,
        Err(error) => {
            if error
                .to_string()
                .contains("duplicate key value violates unique constraint")
            {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "A location with that name already exists",
                ));
            }

            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create location: {error}"),
            ));
        }
    };

    Ok((
        StatusCode::CREATED,
        Json(LocationResponse {
            id: location.id,
            name: location.name,
            user_count: 0,
        }),
    ))
}

pub(crate) async fn update_location(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateLocationRequest>,
) -> Result<Json<LocationResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERM_LOCATIONS_EDIT).await?;

    let name = normalize_location_name(&payload.name)?;

    let exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM locations WHERE id = $1 LIMIT 1")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check location: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Location not found"));
    }

    let update_result = sqlx::query("UPDATE locations SET name = $1 WHERE id = $2")
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
                "A location with that name already exists",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update location: {error}"),
        ));
    }

    let user_count =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE location_id = $1")
            .bind(id)
            .fetch_one(&state.db)
            .await
            .unwrap_or(0);

    Ok(Json(LocationResponse {
        id,
        name,
        user_count,
    }))
}

pub(crate) async fn delete_location(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Query(query): Query<DeleteLocationQuery>,
) -> Result<StatusCode, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERM_LOCATIONS_DELETE,
    )
    .await?;

    let users_using_location =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE location_id = $1")
            .bind(id)
            .fetch_one(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to check users for location usage: {error}"),
                )
            })?;

    if users_using_location > 0 && !query.force {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "Location is in use by one or more users",
        ));
    }

    if table_exists(&state.db, "public_holiday_locations").await? {
        let holidays_using_location = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM public_holiday_locations WHERE location_id = $1",
        )
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check public holidays for location usage: {error}"),
            )
        })?;

        if holidays_using_location > 0 {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "Location is in use by one or more public holidays",
            ));
        }
    }

    if users_using_location > 0 {
        sqlx::query("UPDATE users SET location_id = NULL WHERE location_id = $1")
            .bind(id)
            .execute(&state.db)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to unassign users from location: {error}"),
                )
            })?;
    }

    let delete_result = sqlx::query("DELETE FROM locations WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete location: {error}"),
            )
        })?;

    if delete_result.rows_affected() == 0 {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "Location not found"));
    }

    Ok(StatusCode::NO_CONTENT)
}
