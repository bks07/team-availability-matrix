use std::{env, net::SocketAddr, time::{SystemTime, UNIX_EPOCH}};

use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::{Multipart, Path, Query, State},
    http::{HeaderMap, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use chrono::{Datelike, Duration, NaiveDate, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, FromRow, PgPool};
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tracing::info;

#[derive(Clone)]
struct AppState {
    db: PgPool,
    jwt_secret: String,
}

const PERMISSION_ADMIN: &str = "admin";
const PERMISSION_MANAGE_LOCATIONS: &str = "manage_locations";
const PERMISSION_MANAGE_PUBLIC_HOLIDAYS: &str = "manage_public_holidays";
const PERMISSION_SUPER_ADMIN: &str = "super_admin";
const KNOWN_PERMISSIONS: [&str; 4] = [
    PERMISSION_ADMIN,
    PERMISSION_MANAGE_LOCATIONS,
    PERMISSION_MANAGE_PUBLIC_HOLIDAYS,
    PERMISSION_SUPER_ADMIN,
];
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
#[serde(rename_all = "camelCase")]
struct UpdatePermissionsRequest {
    permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChangePasswordRequest {
    current_password: String,
    new_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateProfileRequest {
    email: String,
    display_name: String,
    location_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdminCreateUserRequest {
    email: String,
    display_name: String,
    password: String,
    location_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AdminUpdateUserRequest {
    email: String,
    display_name: String,
    location_id: Option<i64>,
    password: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BulkAssignLocationRequest {
    user_ids: Vec<i64>,
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
    location_id: Option<i64>,
    photo_url: Option<String>,
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
    public_holidays: Vec<PublicHolidayResponse>,
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct UserPermissionsResponse {
    user_id: i64,
    permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AdminUserResponse {
    id: i64,
    email: String,
    display_name: String,
    location_id: Option<i64>,
    photo_url: Option<String>,
    permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BulkAssignLocationResponse {
    updated_count: i64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct SelfRegistrationSettingResponse {
    enabled: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateSelfRegistrationRequest {
    enabled: bool,
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
    location_id: Option<i64>,
    photo_url: Option<String>,
    password_hash: String,
}

#[derive(Debug, FromRow)]
struct EmployeeRow {
    id: i64,
    email: String,
    display_name: String,
    location_id: Option<i64>,
    photo_url: Option<String>,
}

#[derive(Debug, FromRow)]
struct SystemSettingRow {
    key: String,
    value: String,
}

#[derive(Debug, FromRow)]
struct StatusRow {
    user_id: i64,
    status_date: NaiveDate,
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
    holiday_date: NaiveDate,
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

    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgres@localhost:5432/availability_matrix".to_string()
    });

    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
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
        .route(
            "/api/settings/self-registration",
            get(get_self_registration_setting),
        )
        .route("/api/me", get(me))
        .route("/api/profile", put(update_profile))
        .route("/api/profile/password", put(change_password))
        .route(
            "/api/profile/photo",
            post(upload_profile_photo).delete(delete_profile_photo),
        )
        .route("/api/matrix", get(get_matrix))
        .route("/api/statuses/:date", put(update_status))
        .route("/api/admin/locations", get(list_locations).post(create_location))
        .route("/api/admin/locations/:id", put(update_location))
        .route("/api/admin/locations/:id", delete(delete_location))
        .route(
            "/api/admin/public-holidays",
            get(list_public_holidays).post(create_public_holiday),
        )
        .route(
            "/api/admin/public-holidays/:id",
            put(update_public_holiday),
        )
        .route(
            "/api/admin/public-holidays/:id",
            delete(delete_public_holiday),
        )
        .route("/api/admin/users", get(list_admin_users).post(admin_create_user))
        .route(
            "/api/admin/users/bulk-location",
            put(bulk_assign_location),
        )
        .route(
            "/api/admin/users/:id",
            put(admin_update_user).delete(admin_delete_user),
        )
        .route(
            "/api/admin/settings/self-registration",
            put(update_self_registration_setting),
        )
        .route(
            "/api/admin/users/:id/permissions",
            get(get_user_permissions_handler).put(update_user_permissions),
        )
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(cors)
        .with_state(state);

    let addr: SocketAddr = format!("{host}:{port}").parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("listening on http://{}", listener.local_addr()?);

    axum::serve(listener, app).await?;
    Ok(())
}

async fn initialize_database(db: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS locations (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL",
    )
    .execute(db)
    .await?;

    sqlx::query("ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT")
        .execute(db)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS availability_statuses (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status_date DATE NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('W', 'V', 'A')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, status_date)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS user_permissions (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            permission TEXT NOT NULL,
            UNIQUE(user_id, permission)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS public_holidays (
            id BIGSERIAL PRIMARY KEY,
            holiday_date DATE NOT NULL,
            name TEXT NOT NULL,
            location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
            UNIQUE(holiday_date, location_id)
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        "#,
    )
    .execute(db)
    .await?;

    sqlx::query(
        "INSERT INTO system_settings (key, value) VALUES ('self_registration_enabled', 'true') ON CONFLICT (key) DO NOTHING",
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
    let display_name = normalize_display_name(&payload.display_name)?;
    validate_password(&payload.password)?;

    let password_hash = hash_password(&payload.password)?;

    let inserted_id = sqlx::query_scalar::<_, i64>(
        "INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id",
    )
    .bind(&email)
    .bind(&display_name)
    .bind(password_hash)
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
        "SELECT id, email, display_name, location_id, photo_url, password_hash FROM users WHERE email = $1",
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
            location_id: user.location_id,
            photo_url: user.photo_url,
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
        "SELECT id, email, display_name, location_id, photo_url, password_hash FROM users WHERE email = $1",
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
            location_id: user.location_id,
            photo_url: user.photo_url,
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

async fn update_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<PublicUser>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;
    let email = normalize_email(&payload.email)?;
    let display_name = normalize_display_name(&payload.display_name)?;

    if let Some(location_id) = payload.location_id {
        ensure_location_exists(&state.db, location_id).await?;
    }

    let updated = sqlx::query_as::<_, EmployeeRow>(
        "UPDATE users SET email = $1, display_name = $2, location_id = $3 WHERE id = $4 RETURNING id, email, display_name, location_id, photo_url",
    )
    .bind(&email)
    .bind(&display_name)
    .bind(payload.location_id)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await;

    let updated = match updated {
        Ok(Some(user)) => user,
        Ok(None) => {
            return Err(ApiError::new(
                StatusCode::UNAUTHORIZED,
                "Current user no longer exists",
            ))
        }
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
                format!("Failed to update profile: {error}"),
            ));
        }
    };

    let permissions = get_user_permissions(&state.db, claims.sub).await?;
    Ok(Json(PublicUser {
        id: updated.id,
        email: updated.email,
        display_name: updated.display_name,
        location_id: updated.location_id,
        photo_url: updated.photo_url,
        permissions,
    }))
}

async fn upload_profile_photo(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Result<Json<PublicUser>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let field = multipart
        .next_field()
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Failed to read uploaded file: {error}"),
            )
        })?
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "No file was provided"))?;

    let content_type = field
        .content_type()
        .map(str::to_string)
        .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Uploaded file is missing content type"))?;

    let extension = match content_type.as_str() {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif",
        _ => {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Unsupported image format. Supported formats: JPEG, PNG, WebP, GIF",
            ))
        }
    };

    let bytes = field.bytes().await.map_err(|error| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("Failed to read uploaded file bytes: {error}"),
        )
    })?;

    if bytes.len() > 2 * 1024 * 1024 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "File size exceeds the 2MB limit",
        ));
    }

    let existing_photo_url = sqlx::query_scalar::<_, Option<String>>(
        "SELECT photo_url FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load current profile photo: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists"))?;

    tokio::fs::create_dir_all("uploads/photos")
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to prepare upload directory: {error}"),
            )
        })?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to generate upload timestamp: {error}"),
            )
        })?
        .as_millis();
    let filename = format!("{}_{}.{}", claims.sub, timestamp, extension);
    let file_path = format!("uploads/photos/{filename}");
    let photo_url = format!("/uploads/photos/{filename}");

    tokio::fs::write(&file_path, &bytes).await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to store uploaded file: {error}"),
        )
    })?;

    sqlx::query("UPDATE users SET photo_url = $1 WHERE id = $2")
        .bind(&photo_url)
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to save profile photo reference: {error}"),
            )
        })?;

    if let Some(previous) = existing_photo_url {
        delete_photo_file_best_effort(&previous).await;
    }

    let user = find_public_user(&state.db, claims.sub).await?;
    Ok(Json(user))
}

async fn delete_profile_photo(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<StatusCode, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let existing_photo_url = sqlx::query_scalar::<_, Option<String>>(
        "SELECT photo_url FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load current profile photo: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists"))?;

    if let Some(photo_url) = existing_photo_url {
        delete_photo_file_best_effort(&photo_url).await;
    }

    sqlx::query("UPDATE users SET photo_url = NULL WHERE id = $1")
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear profile photo: {error}"),
            )
        })?;

    Ok(StatusCode::NO_CONTENT)
}

async fn change_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let claims = authorize(&headers, &state.jwt_secret)?;

    let current_password_hash = sqlx::query_scalar::<_, String>(
        "SELECT password_hash FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load current password: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::UNAUTHORIZED, "Current user no longer exists"))?;

    if let Err(error) = verify_password(&payload.current_password, &current_password_hash) {
        if error.status == StatusCode::UNAUTHORIZED {
            return Err(ApiError::new(
                StatusCode::UNAUTHORIZED,
                "Current password is incorrect",
            ));
        }
        return Err(error);
    }

    validate_password(&payload.new_password)?;
    let new_password_hash = hash_password(&payload.new_password)?;

    sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
        .bind(new_password_hash)
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to update password: {error}"),
            )
        })?;

    Ok(Json(
        serde_json::json!({ "message": "Password changed successfully" }),
    ))
}

async fn get_self_registration_setting(
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

async fn update_self_registration_setting(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateSelfRegistrationRequest>,
) -> Result<Json<SelfRegistrationSettingResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_SUPER_ADMIN,
    )
    .await?;

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

async fn list_admin_users(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<AdminUserResponse>>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_ADMIN,
    )
    .await?;

    let users = sqlx::query_as::<_, EmployeeRow>(
        "SELECT id, email, display_name, location_id, photo_url FROM users ORDER BY LOWER(display_name) ASC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load users: {error}"),
        )
    })?;

    let mut response = Vec::with_capacity(users.len());
    for user in users {
        let permissions = get_user_permissions(&state.db, user.id).await?;
        response.push(AdminUserResponse {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            location_id: user.location_id,
            photo_url: user.photo_url,
            permissions,
        });
    }

    Ok(Json(response))
}

async fn admin_create_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AdminCreateUserRequest>,
) -> Result<(StatusCode, Json<AdminUserResponse>), ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    let email = normalize_email(&payload.email)?;
    let display_name = normalize_display_name(&payload.display_name)?;
    validate_password(&payload.password)?;

    if let Some(location_id) = payload.location_id {
        ensure_location_exists(&state.db, location_id).await?;
    }

    let password_hash = hash_password(&payload.password)?;

    let created_user = sqlx::query_as::<_, EmployeeRow>(
        "INSERT INTO users (email, display_name, password_hash, location_id) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, location_id, photo_url, created_at",
    )
    .bind(&email)
    .bind(&display_name)
    .bind(password_hash)
    .bind(payload.location_id)
    .fetch_one(&state.db)
    .await;

    let created_user = match created_user {
        Ok(user) => user,
        Err(error) => {
            if error
                .to_string()
                .contains("duplicate key value violates unique constraint")
            {
                return Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "A user with this email already exists",
                ));
            }

            return Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to create user: {error}"),
            ));
        }
    };

    let permissions = get_user_permissions(&state.db, created_user.id).await?;

    Ok((
        StatusCode::CREATED,
        Json(AdminUserResponse {
            id: created_user.id,
            email: created_user.email,
            display_name: created_user.display_name,
            location_id: created_user.location_id,
            photo_url: created_user.photo_url,
            permissions,
        }),
    ))
}

async fn admin_update_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
    Json(payload): Json<AdminUpdateUserRequest>,
) -> Result<Json<AdminUserResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    ensure_user_exists(&state.db, id).await?;

    let email = normalize_email(&payload.email)?;
    let display_name = normalize_display_name(&payload.display_name)?;

    if let Some(location_id) = payload.location_id {
        ensure_location_exists(&state.db, location_id).await?;
    }

    let update_result = if let Some(password) = &payload.password {
        validate_password(password)?;
        let password_hash = hash_password(password)?;

        sqlx::query(
            "UPDATE users SET email = $1, display_name = $2, location_id = $3, password_hash = $4 WHERE id = $5",
        )
        .bind(&email)
        .bind(&display_name)
        .bind(payload.location_id)
        .bind(password_hash)
        .bind(id)
        .execute(&state.db)
        .await
    } else {
        sqlx::query("UPDATE users SET email = $1, display_name = $2, location_id = $3 WHERE id = $4")
            .bind(&email)
            .bind(&display_name)
            .bind(payload.location_id)
            .bind(id)
            .execute(&state.db)
            .await
    };

    if let Err(error) = update_result {
        if error
            .to_string()
            .contains("duplicate key value violates unique constraint")
        {
            return Err(ApiError::new(
                StatusCode::CONFLICT,
                "A user with this email already exists",
            ));
        }

        return Err(ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to update user: {error}"),
        ));
    }

    let user = sqlx::query_as::<_, EmployeeRow>(
        "SELECT id, email, display_name, location_id, photo_url FROM users WHERE id = $1",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load updated user: {error}"),
        )
    })?;

    let permissions = get_user_permissions(&state.db, id).await?;

    Ok(Json(AdminUserResponse {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        location_id: user.location_id,
        photo_url: user.photo_url,
        permissions,
    }))
}

async fn admin_delete_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    let claims = require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    if claims.sub == id {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Cannot delete your own account",
        ));
    }

    let existing_photo_url = sqlx::query_scalar::<_, Option<String>>(
        "SELECT photo_url FROM users WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to load user photo for cleanup: {error}"),
        )
    })?
    .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "User not found"))?;

    sqlx::query("DELETE FROM availability_statuses WHERE user_id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete user availability statuses: {error}"),
            )
        })?;

    sqlx::query("DELETE FROM user_permissions WHERE user_id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete user permissions: {error}"),
            )
        })?;

    let delete_result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to delete user: {error}"),
            )
        })?;

    if delete_result.rows_affected() == 0 {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "User not found"));
    }

    if let Some(photo_url) = existing_photo_url {
        delete_photo_file_best_effort(&photo_url).await;
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn bulk_assign_location(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<BulkAssignLocationRequest>,
) -> Result<Json<BulkAssignLocationResponse>, ApiError> {
    require_permission(&headers, &state.db, &state.jwt_secret, PERMISSION_ADMIN).await?;

    if payload.user_ids.is_empty() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "At least one user must be selected",
        ));
    }

    ensure_location_exists(&state.db, payload.location_id).await?;

    let update_result = sqlx::query("UPDATE users SET location_id = $1 WHERE id = ANY($2)")
        .bind(payload.location_id)
        .bind(&payload.user_ids[..])
        .execute(&state.db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to assign location in bulk: {error}"),
            )
        })?;

    Ok(Json(BulkAssignLocationResponse {
        updated_count: update_result.rows_affected() as i64,
    }))
}

async fn get_user_permissions_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(user_id): Path<i64>,
) -> Result<Json<UserPermissionsResponse>, ApiError> {
    require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_SUPER_ADMIN,
    )
    .await?;

    ensure_user_exists(&state.db, user_id).await?;
    let permissions = get_user_permissions(&state.db, user_id).await?;

    Ok(Json(UserPermissionsResponse {
        user_id,
        permissions,
    }))
}

async fn update_user_permissions(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(user_id): Path<i64>,
    Json(payload): Json<UpdatePermissionsRequest>,
) -> Result<Json<UserPermissionsResponse>, ApiError> {
    let claims = require_permission(
        &headers,
        &state.db,
        &state.jwt_secret,
        PERMISSION_SUPER_ADMIN,
    )
    .await?;

    for permission in &payload.permissions {
        if !is_known_permission(permission) {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                format!("Unknown permission: {permission}"),
            ));
        }
    }

    if claims.sub == user_id
        && !payload
            .permissions
            .iter()
            .any(|permission| permission == PERMISSION_SUPER_ADMIN)
    {
        return Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "Cannot remove your own super admin permission",
        ));
    }

    let mut unique_permissions = Vec::new();
    for permission in &payload.permissions {
        if !unique_permissions.iter().any(|item| item == permission) {
            unique_permissions.push(permission.clone());
        }
    }

    let mut tx = state.db.begin().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to start permission update transaction: {error}"),
        )
    })?;

    let user_exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM users WHERE id = $1 LIMIT 1")
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check user: {error}"),
            )
        })?
        .is_some();

    if !user_exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "User not found"));
    }

    sqlx::query("DELETE FROM user_permissions WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to clear user permissions: {error}"),
            )
        })?;

    for permission in &unique_permissions {
        sqlx::query("INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)")
            .bind(user_id)
            .bind(permission)
            .execute(&mut *tx)
            .await
            .map_err(|error| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to save user permissions: {error}"),
                )
            })?;
    }

    tx.commit().await.map_err(|error| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to commit permission update transaction: {error}"),
        )
    })?;

    let permissions = get_user_permissions(&state.db, user_id).await?;
    Ok(Json(UserPermissionsResponse {
        user_id,
        permissions,
    }))
}

async fn find_public_user(db: &PgPool, user_id: i64) -> Result<PublicUser, ApiError> {
    let row = sqlx::query_as::<_, EmployeeRow>(
        "SELECT id, email, display_name, location_id, photo_url FROM users WHERE id = $1",
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
        location_id: row.location_id,
        photo_url: row.photo_url,
        permissions,
    })
}

async fn delete_photo_file_best_effort(photo_url: &str) {
    let relative_path = if let Some(path) = photo_url.strip_prefix("/uploads/") {
        path
    } else if let Some(path) = photo_url.strip_prefix("uploads/") {
        path
    } else {
        return;
    };

    let full_path = std::path::Path::new("uploads").join(relative_path);
    let _ = tokio::fs::remove_file(full_path).await;
}

async fn get_user_permissions(db: &PgPool, user_id: i64) -> Result<Vec<String>, ApiError> {
    sqlx::query_scalar::<_, String>(
        "SELECT permission FROM user_permissions WHERE user_id = $1 ORDER BY permission ASC",
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
    db: &PgPool,
    jwt_secret: &str,
    permission: &str,
) -> Result<Claims, ApiError> {
    let claims = authorize(headers, jwt_secret)?;

    let has_permission = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission = $2 LIMIT 1",
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

async fn ensure_location_exists(db: &PgPool, location_id: i64) -> Result<(), ApiError> {
    let exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM locations WHERE id = $1 LIMIT 1")
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

async fn table_exists(db: &PgPool, table_name: &str) -> Result<bool, ApiError> {
    let exists = sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1",
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

async fn ensure_user_exists(db: &PgPool, user_id: i64) -> Result<(), ApiError> {
    let exists = sqlx::query_scalar::<_, i32>("SELECT 1 FROM users WHERE id = $1 LIMIT 1")
        .bind(user_id)
        .fetch_optional(db)
        .await
        .map_err(|error| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to check user: {error}"),
            )
        })?
        .is_some();

    if !exists {
        return Err(ApiError::new(StatusCode::NOT_FOUND, "User not found"));
    }

    Ok(())
}

fn is_known_permission(permission: &str) -> bool {
    KNOWN_PERMISSIONS.contains(&permission)
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
