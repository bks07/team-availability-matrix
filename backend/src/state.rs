use sqlx::PgPool;

#[derive(Clone)]
pub(crate) struct AppState {
    pub(crate) db: PgPool,
    pub(crate) jwt_secret: String,
    pub(crate) upload_dir: String,
}
