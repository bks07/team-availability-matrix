use axum::{
    routing::{delete, get, post, put},
    Router,
};
use tower_http::{cors::CorsLayer, services::ServeDir};

use crate::handlers;
use crate::state::AppState;

pub(crate) fn build_router(state: AppState, cors: CorsLayer, upload_dir: &str) -> Router {
    Router::new()
        .route("/api/health", get(handlers::health::health_check))
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/login", post(handlers::auth::login))
        .route(
            "/api/settings/self-registration",
            get(handlers::settings::get_self_registration_setting),
        )
        .route("/api/me", get(handlers::auth::me))
        .route("/api/profile", put(handlers::profile::update_profile))
        .route(
            "/api/profile/password",
            put(handlers::profile::change_password),
        )
        .route(
            "/api/profile/photo",
            post(handlers::profile::upload_profile_photo)
                .delete(handlers::profile::delete_profile_photo),
        )
        .route("/api/matrix", get(handlers::matrix::get_matrix))
        .route("/api/statuses/:date", put(handlers::matrix::update_status))
        .route(
            "/api/admin/locations",
            get(handlers::locations::list_locations).post(handlers::locations::create_location),
        )
        .route(
            "/api/admin/locations/:id",
            put(handlers::locations::update_location),
        )
        .route(
            "/api/admin/locations/:id",
            delete(handlers::locations::delete_location),
        )
        .route(
            "/api/admin/public-holidays",
            get(handlers::holidays::list_public_holidays)
                .post(handlers::holidays::create_public_holiday),
        )
        .route(
            "/api/admin/public-holidays/:id",
            put(handlers::holidays::update_public_holiday),
        )
        .route(
            "/api/admin/public-holidays/:id",
            delete(handlers::holidays::delete_public_holiday),
        )
        .route(
            "/api/admin/users",
            get(handlers::admin_users::list_admin_users).post(handlers::admin_users::admin_create_user),
        )
        .route(
            "/api/admin/users/bulk-location",
            put(handlers::admin_users::bulk_assign_location),
        )
        .route(
            "/api/admin/users/:id",
            put(handlers::admin_users::admin_update_user)
                .delete(handlers::admin_users::admin_delete_user),
        )
        .route(
            "/api/admin/users/:id/work-schedule",
            get(handlers::work_schedules::get_work_schedule)
                .put(handlers::work_schedules::update_work_schedule),
        )
        .route(
            "/api/admin/settings/self-registration",
            put(handlers::settings::update_self_registration_setting),
        )
        .route(
            "/api/admin/users/:id/permissions",
            get(handlers::permissions::get_user_permissions_handler)
                .put(handlers::permissions::update_user_permissions),
        )
        .nest_service("/uploads", ServeDir::new(upload_dir))
        .layer(cors)
        .with_state(state)
}
