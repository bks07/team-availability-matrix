use axum::{
    routing::{delete, get, post, put},
    Router,
};
use tower_http::{cors::CorsLayer, services::ServeDir};

use crate::handlers;
use crate::handlers::admin_teams;
use crate::handlers::teams::{
    accept_invitation, cancel_invitation, create_team, delete_team, get_team_detail,
    invite_to_team, leave_team, list_my_invitations, list_my_teams, reject_invitation,
    remove_member, search_users, transfer_ownership, update_member_role, update_team,
};
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
        .route("/api/matrix/export", get(handlers::matrix::export_matrix_csv))
        .route("/api/statuses/bulk", post(handlers::matrix::bulk_status))
        .route(
            "/api/statuses/:date",
            put(handlers::matrix::update_status).delete(handlers::matrix::delete_status),
        )
        .route("/api/teams", get(list_my_teams).post(create_team))
            .route("/api/teams/invitations", get(list_my_invitations))
            .route(
                "/api/teams/invitations/:id/accept",
                post(accept_invitation),
            )
            .route(
                "/api/teams/invitations/:id/reject",
                post(reject_invitation),
            )
            .route("/api/teams/invitations/:id", delete(cancel_invitation))
        .route(
            "/api/teams/:id",
            get(get_team_detail).put(update_team).delete(delete_team),
        )
            .route("/api/teams/:id/invitations", post(invite_to_team))
            .route(
                "/api/teams/:id/members/:user_id/role",
                put(update_member_role),
            )
            .route("/api/teams/:id/members/:user_id", delete(remove_member))
            .route("/api/teams/:id/leave", post(leave_team))
            .route(
                "/api/teams/:id/transfer-ownership",
                post(transfer_ownership),
            )
        .route("/api/users/search", get(search_users))
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
            "/api/admin/users/:id/permission-profile",
            get(handlers::permissions::get_user_profile)
                .put(handlers::permissions::assign_user_profile),
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
            "/api/admin/permission-catalog",
            get(handlers::permissions::list_permission_catalog),
        )
        .route(
            "/api/admin/permission-profiles",
            get(handlers::permissions::list_permission_profiles)
                .post(handlers::permissions::create_permission_profile),
        )
        .route(
            "/api/admin/permission-profiles/:id",
            get(handlers::permissions::get_permission_profile)
                .put(handlers::permissions::update_permission_profile)
                .delete(handlers::permissions::delete_permission_profile),
        )
        .route(
            "/api/admin/permission-audit-log",
            get(handlers::permissions::list_audit_log),
        )
        .route(
            "/api/admin/permission-audit-log/csv",
            get(handlers::permissions::export_audit_log_csv),
        )
        .route(
            "/api/admin/permission-usage-report",
            get(handlers::permissions::get_usage_report),
        )
        .route(
            "/api/admin/permission-usage-report/csv",
            get(handlers::permissions::export_usage_report_csv),
        )
        .route(
            "/api/admin/teams",
            get(admin_teams::list_admin_teams).post(admin_teams::create_admin_team),
        )
        .route(
            "/api/admin/teams/:id",
            put(admin_teams::update_admin_team).delete(admin_teams::delete_admin_team),
        )
        .route(
            "/api/admin/teams/:id/members",
            get(admin_teams::list_admin_team_members).post(admin_teams::assign_user_to_team),
        )
        .route(
            "/api/admin/teams/:id/members/:user_id",
            delete(admin_teams::remove_user_from_team),
        )
        .nest_service("/uploads", ServeDir::new(upload_dir))
        .layer(cors)
        .with_state(state)
}
