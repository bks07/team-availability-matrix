use std::{env, net::SocketAddr, str::FromStr};

use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post, put},
    Json, Router,
};
use chrono::{Datelike, Duration, NaiveDate, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    FromRow, SqlitePool,
};
use tower_http::cors::CorsLayer;
use tracing::info;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    jwt_secret: String,
}

const PERMISSION_ADMIN: &str = "admin";
const PERMISSION_MANAGE_LOCATIONS: &str = "manage_locations";
const PERMISSION_MANAGE_PUBLIC_HOLIDAYS: &str = "manage_public_holidays";
const PERMISSION_SUPER_ADMIN: &str = "super_admin";
const FIRST_USER_PERMISSIONS: [&str; 4] = [
    PERMISSION_ADMIN,
    PERMISSION_MANAGE_LOCATIONS,
    PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    PERMISSION_SUPER_ADMIN,
];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorResponse {
    error: String,
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(ErrorResponse { error: self.message })).into_response()
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RegisterRequest {
    display_name: String,
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateStatusRequest {
    status: StatusValue,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateLocationRequest {
    name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateLocationRequest {
    name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreatePublicHolidayRequest {
    holiday_date: String,
    name: String,
    location_id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdatePublicHolidayRequest {
    holiday_date: String,
    name: String,
    location_id: i64,
}

#[derive(Debug, Deserialize)]
struct PublicHolidayQuery {
    location_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct YearQuery {
    year: Option<i32>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AuthResponse {
    token: String,
    user: PublicUser,
    permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PublicUser {
    id: i64,
    email: String,
    display_name: String,
    permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AvailabilityEntry {
    user_id: i64,
    date: String,
    status: StatusValue,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct MatrixResponse {
    year: i32,
    days: Vec<String>,
    employees: Vec<PublicUser>,
    entries: Vec<AvailabilityEntry>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocationResponse {
    id: i64,
    name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PublicHolidayResponse {
    id: i64,
    holiday_date: String,
    name: String,
    location_id: i64,
}

#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
enum StatusValue {
    #[serde(rename = "W")]
    Working,
    #[serde(rename = "V")]
    Vacation,
    #[serde(rename = "A")]
    Absence,
}

impl StatusValue {
    fn as_db_value(self) -> &'static str {
        match self {
            Self::Working => "W",
            Self::Vacation => "V",
            Self::Absence => "A",
        }
    }

    fn from_db_value(value: &str) -> Result<Self, ApiError> {
        match value {
            "W" => Ok(Self::Working),
            "V" => Ok(Self::Vacation),
            "A" => Ok(Self::Absence),
            _ => Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Stored availability status is invalid",
            )),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: i64,
    exp: usize,
}

#[derive(Debug, FromRow)]
struct UserRecord {
    id: i64,
    email: String,
    display_name: String,
    password_hash: String,
}

#[derive(Debug, FromRow)]
struct EmployeeRow {
    id: i64,
    email: String,
    display_name: String,
}

#[derive(Debug, FromRow)]
struct StatusRow {
    user_id: i64,
    status_date: String,
    status: String,
}

#[derive(Debug, FromRow)]
struct LocationRow {
    id: i64,
    name: String,
}

#[derive(Debug, FromRow)]
struct PublicHolidayRow {
    id: i64,
    holiday_date: String,
    name: String,
    location_id: i64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "availability_matrix=info,tower_http=info".into()),
        )
        .init();

    tokio::fs::create_dir_all("data").await?;

    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://data/app.db".to_string());
    let connect_options = SqliteConnectOptions::from_str(&database_url)?
        .create_if_missing(true)
        .foreign_keys(true);

    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await?;

    initialize_database(&db).await?;

    let frontend_origin = env::var("FRONTEND_ORIGIN").unwrap_or_else(|_| "http://localhost:4200".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "change-me-in-production".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());

    let cors = CorsLayer::new()
        .allow_origin(frontend_origin.parse::<axum::http::HeaderValue>()?)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([axum::http::header::AUTHORIZATION, axum::http::header::CONTENT_TYPE]);

    let state = AppState { db, jwt_secret };

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/me", get(me))
        .route("/api/matrix", get(get_matrix))
        .route("/api/statuses/:date", put(update_status))
        .route("/api/admin/locations", get(list_locations).post(create_location))
        .route("/api/admin/locations/:id", put(update_location).delete(delete_location))
        .route(
            "/api/admin/public-holidays",
            get(list_public_holidays).post(create_public_holiday),
        )
        .route(
            "/api/admin/public-holidays/:id",
            put(update_public_holiday).delete(delete_public_holiday),
        )
        .layer(cors)
        .with_state(state);

    let addr: SocketAddr = format!("{host}:{port}").parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("listening on http://{}", listener.local_addr()?);

    axum::serve(listener, app).await?;
    Ok(())
}

async fn initialize_database(db: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
        "#,
    )
    .execute(db)
    .await?;

    let add_location_id_result = sqlx::query(
        "ALTER TABLE users ADD COLUMN location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL",
    )
    .execute(db)
    .await;

    if let Err(error) = add_location_id_result {
        let message = error.to_string();
        if !message.contains("duplicate column name") {
            return Err(error);
        }
    }

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS availability_statuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            status_date TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('W', 'V', 'A')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, status_date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS user_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            permission TEXT NOT NULL,
            UNIQUE(user_id, permission),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS public_holidays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            holiday_date TEXT NOT NULL,
            name TEXT NOT NULL,
            location_id INTEGER NOT NULL,
            UNIQUE(holiday_date, location_id),
            FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_availability_statuses_date ON availability_statuses(status_date);",
    )
    .execute(db)
    .await?;

    Ok(())
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let email = normalize_email(&payload.email)?;
    let display_name = normalize_display_name(&payload.display_name)?;
    validate_password(&payload.password)?;

    let password_hash = hash_password(&payload.password)?;

    let insert_result = sqlx::query(
        "INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)",
    )
    .bind(&email)
    .bind(&display_name)
    .bind(password_hash)
    .execute(&state.db)
    .await;

    let insert_result = match insert_result {
        Ok(result) => result,
        Err(error) => {
            if error.to_string().contains("UNIQUE constraint failed") {
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
        "SELECT id, email, display_name, password_hash FROM users WHERE email = ?",
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

    if insert_result.last_insert_rowid() == 1 {
        for permission in FIRST_USER_PERMISSIONS {
            sqlx::query("INSERT OR IGNORE INTO user_permissions (user_id, permission) VALUES (?, ?)")
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
            permissions: permissions.clone(),
        },
        permissions,
    }))
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let email = normalize_email(&payload.email)?;

    let user = sqlx::query_as::<_, UserRecord>(
        "SELECT id, email, display_name, password_hash FROM users WHERE email = ?",
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
    let token = issue_token(user.id, &state.jwt_secret)?;

    Ok(Json(AuthResponse {
        token,
        user: PublicUser {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            permissions: permissions.clone(),
        },
        permissions,
    }))
}

async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<PublicUser>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;
    let user = find_public_user(&state.db, claims.sub).await?;
    Ok(Json(user))
}

async fn get_matrix(
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
        "SELECT id, email, display_name FROM users ORDER BY display_name COLLATE NOCASE ASC",
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
        WHERE status_date >= ? AND status_date < ?
        ORDER BY status_date ASC, user_id ASC
        "#,
    )
    .bind(start.to_string())
    .bind(next_year_start.to_string())
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
                date: row.status_date,
                status: StatusValue::from_db_value(&row.status)?,
            })
        })
        .collect::<Result<Vec<_>, ApiError>>()?;

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
                    permissions,
                });
            }
            public_users
        },
        entries,
    }))
}

async fn update_status(
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
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, status_date)
        DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(claims.sub)
    .bind(parsed_date.to_string())
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

async fn list_locations(
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
        "SELECT id, name FROM locations ORDER BY name COLLATE NOCASE ASC",
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

async fn create_location(
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

    let insert_result = sqlx::query("INSERT INTO locations (name) VALUES (?)")
        .bind(&name)
        .execute(&state.db)
        .await;

    let insert_result = match insert_result {
        Ok(result) => result,
        Err(error) => {
            if error.to_string().contains("UNIQUE constraint failed") {
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

    let row = sqlx::query_as::<_, LocationRow>("SELECT id, name FROM locations WHERE id = ?")
        .bind(insert_result.last_insert_rowid())
        .fetch_one(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to load location after create: {error}"),
            )
        })?;

    Ok((
        StatusCode::CREATED,
        Json(LocationResponse {
            id: row.id,
            name: row.name,
        }),
    ))
}

async fn update_location(
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

    let exists = sqlx::query_scalar::<_, i64>("SELECT 1 FROM locations WHERE id = ? LIMIT 1")
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

    let update_result = sqlx::query("UPDATE locations SET name = ? WHERE id = ?")
        .bind(&name)
        .bind(id)
        .execute(&state.db)
        .await;

    if let Err(error) = update_result {
        if error.to_string().contains("UNIQUE constraint failed") {
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

async fn delete_location(
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
        "SELECT COUNT(*) FROM users WHERE location_id = ?",
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
            "SELECT COUNT(*) FROM public_holidays WHERE location_id = ?",
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

    let delete_result = sqlx::query("DELETE FROM locations WHERE id = ?")
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

async fn list_public_holidays(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<PublicHolidayQuery>,
) -> Result<Json<Vec<PublicHolidayResponse>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    )
    .await?;

    let holidays = if let Some(location_id) = query.location_id {
        sqlx::query_as::<_, PublicHolidayRow>(
            r#"
            SELECT id, holiday_date, name, location_id
            FROM public_holidays
            WHERE location_id = ?
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
                holiday_date: holiday.holiday_date,
                name: holiday.name,
                location_id: holiday.location_id,
            })
            .collect(),
    ))
}

async fn create_public_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePublicHolidayRequest>,
) -> Result<(StatusCode, Json<PublicHolidayResponse>), ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    )
    .await?;

    let parsed_date = NaiveDate::parse_from_str(&payload.holiday_date, "%Y-%m-%d")
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "holidayDate must use YYYY-MM-DD"))?;
    let name = normalize_public_holiday_name(&payload.name)?;
    ensure_location_exists(&state.db, payload.location_id).await?;

    let insert_result = sqlx::query(
        "INSERT INTO public_holidays (holiday_date, name, location_id) VALUES (?, ?, ?)",
    )
    .bind(parsed_date.to_string())
    .bind(&name)
    .bind(payload.location_id)
    .execute(&state.db)
    .await;

    let insert_result = match insert_result {
        Ok(result) => result,
        Err(error) => {
            if error.to_string().contains("UNIQUE constraint failed") {
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

    let holiday = sqlx::query_as::<_, PublicHolidayRow>(
        "SELECT id, holiday_date, name, location_id FROM public_holidays WHERE id = ?",
    )
    .bind(insert_result.last_insert_rowid())
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load public holiday after create: {error}"),
        )
    })?;

    Ok((
        StatusCode::CREATED,
        Json(PublicHolidayResponse {
            id: holiday.id,
            holiday_date: holiday.holiday_date,
            name: holiday.name,
            location_id: holiday.location_id,
        }),
    ))
}

async fn update_public_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePublicHolidayRequest>,
) -> Result<Json<PublicHolidayResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    )
    .await?;

    let parsed_date = NaiveDate::parse_from_str(&payload.holiday_date, "%Y-%m-%d")
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "holidayDate must use YYYY-MM-DD"))?;
    let name = normalize_public_holiday_name(&payload.name)?;
    ensure_location_exists(&state.db, payload.location_id).await?;

    let exists = sqlx::query_scalar::<_, i64>("SELECT 1 FROM public_holidays WHERE id = ? LIMIT 1")
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
        "UPDATE public_holidays SET holiday_date = ?, name = ?, location_id = ? WHERE id = ?",
    )
    .bind(parsed_date.to_string())
    .bind(&name)
    .bind(payload.location_id)
    .bind(id)
    .execute(&state.db)
    .await;

    if let Err(error) = update_result {
        if error.to_string().contains("UNIQUE constraint failed") {
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

async fn delete_public_holiday(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    )
    .await?;

    let delete_result = sqlx::query("DELETE FROM public_holidays WHERE id = ?")
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

async fn find_public_user(db: &SqlitePool, user_id: i64) -> Result<PublicUser, ApiError> {
    let row = sqlx::query_as::<_, EmployeeRow>(
        "SELECT id, email, display_name FROM users WHERE id = ?",
    )
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load current user: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists"))?;

    let permissions = get_user_permissions(db, user_id).await?;
    Ok(PublicUser {
        id: row.id,
        email: row.email,
        display_name: row.display_name,
        permissions,
    })
}

async fn get_user_permissions(db: &SqlitePool, user_id: i64) -> Result<Vec<String>, ApiError> {
    sqlx::query_scalar::<_, String>(
        "SELECT permission FROM user_permissions WHERE user_id = ? ORDER BY permission ASC",
    )
    .bind(user_id)
    .fetch_all(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user permissions: {error}"),
        )
    })
}

#[allow(dead_code)]
async fn require_permission(
    headers: &HeaderMap,
    db: &SqlitePool,
    jwt_secret: &str,
    permission: &str,
) -> Result<Claims, ApiError> {
    let claims = authorize(headers, jwt_secret)?;

    let has_permission = sqlx::query_scalar::<_, i64>(
        "SELECT 1 FROM user_permissions WHERE user_id = ? AND permission = ? LIMIT 1",
    )
    .bind(claims.sub)
    .bind(permission)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to verify user permission: {error}"),
        )
    })?
    .is_some();

    if !has_permission {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Insufficient permissions",
        ));
    }

    Ok(claims)
}

fn normalize_email(email: &str) -> Result<String, ApiError> {
    let normalized = email.trim().to_lowercase();
    if normalized.is_empty() || !normalized.contains('@') {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "A valid email address is required",
        ));
    }

    Ok(normalized)
}

fn normalize_display_name(display_name: &str) -> Result<String, ApiError> {
    let normalized = display_name.trim();
    if normalized.len() < 2 || normalized.len() > 80 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Display name must be between 2 and 80 characters",
        ));
    }

    Ok(normalized.to_string())
}

fn normalize_location_name(name: &str) -> Result<String, ApiError> {
    let normalized = name.trim();
    if normalized.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Location name is required",
        ));
    }

    Ok(normalized.to_string())
}

fn normalize_public_holiday_name(name: &str) -> Result<String, ApiError> {
    let normalized = name.trim();
    if normalized.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Public holiday name is required",
        ));
    }

    Ok(normalized.to_string())
}

async fn ensure_location_exists(db: &SqlitePool, location_id: i64) -> Result<(), ApiError> {
    let exists = sqlx::query_scalar::<_, i64>("SELECT 1 FROM locations WHERE id = ? LIMIT 1")
        .bind(location_id)
        .fetch_optional(db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check location: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::BAD_REQUEST, "Location not found"));
    }

    Ok(())
}

async fn table_exists(db: &SqlitePool, table_name: &str) -> Result<bool, ApiError> {
    let exists = sqlx::query_scalar::<_, i64>(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    )
    .bind(table_name)
    .fetch_optional(db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to check table existence: {error}"),
        )
    })?
    .is_some();

    Ok(exists)
}

fn validate_password(password: &str) -> Result<(), ApiError> {
    if password.len() < 8 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Password must be at least 8 characters long",
        ));
    }

    Ok(())
}

fn hash_password(password: &str) -> Result<String, ApiError> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to hash password: {error}"),
            )
        })
}

fn verify_password(password: &str, password_hash: &str) -> Result<(), ApiError> {
    let parsed_hash = PasswordHash::new(password_hash).map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Stored password hash is invalid: {error}"),
        )
    })?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| ApiError::new(StatusCode::UNAUTHORIZED, "Invalid email or password"))
}

fn issue_token(user_id: i64, jwt_secret: &str) -> Result<String, ApiError> {
    let expiration = Utc::now() + Duration::days(7);
    let claims = Claims {
        sub: user_id,
        exp: expiration.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to issue auth token: {error}"),
        )
    })
}

fn authorize(headers: &HeaderMap, jwt_secret: &str) -> Result<Claims, ApiError> {
    let bearer = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Missing Authorization header"))?;

    let token = bearer
        .strip_prefix("Bearer ")
        .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Authorization header must use Bearer token"))?;

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| ApiError::new(StatusCode::UNAUTHORIZED, "Authentication token is invalid or expired"))
}

fn build_day_list(year: i32) -> Result<Vec<String>, ApiError> {
    let start = NaiveDate::from_ymd_opt(year, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;
    let next_year_start = NaiveDate::from_ymd_opt(year + 1, 1, 1)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Year is invalid"))?;

    let total_days = (next_year_start - start).num_days();
    Ok((0..total_days)
        .map(|offset| (start + Duration::days(offset)).to_string())
        .collect())
}
