use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::{require_permission, PERMISSION_MANAGE_LOCATIONS};
use crate::error::ApiError;
use crate::helpers::{normalize_location_name, table_exists};
use crate::models::LocationRow;
use crate::state::AppState;
use crate::types::requests::{CreateLocationRequest, UpdateLocationRequest};
use crate::types::responses::LocationResponse;

pub(crate) async fn list_locations(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<LocationResponse>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_MANAGE_LOCATIONS,
    )
    .await?;

    let locations = sqlx::query_as::<_, LocationRow>(
        "SELECT id, name FROM locations ORDER BY LOWER(name) ASC",
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
        PERMISSION_MANAGE_LOCATIONS,
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
        }),
    ))
}



pub(crate) async fn update_location(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateLocationRequest>,
) -> Result<Json<LocationResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_MANAGE_LOCATIONS,
    )
    .await?;

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

    Ok(Json(LocationResponse { id, name }))
}



pub(crate) async fn delete_location(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_MANAGE_LOCATIONS,
    )
    .await?;

    let users_using_location = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM users WHERE location_id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check users for location usage: {error}"),
        )
    })?;

    if users_using_location > 0 {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "Location is in use by one or more users",
        ));
    }

    if table_exists(&state.db, "public_holidays").await? {
        let holidays_using_location = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM public_holidays WHERE location_id = $1",
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

