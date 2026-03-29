use std::{env, net::SocketAddr};
mod auth;
mod db;
mod error;
mod handlers;
mod helpers;
mod models;
mod router;
mod state;
mod types;
use axum::http::Method;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::CorsLayer;
use tracing::info;
use crate::db::initialize_database;
use crate::router::build_router;
use crate::state::AppState;

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
    let frontend_origin =
        env::var("FRONTEND_ORIGIN").unwrap_or_else(|_| "http://localhost:4200".to_string());
    let jwt_secret =
        env::var("JWT_SECRET").unwrap_or_else(|_| "change-me-in-production".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let cors = CorsLayer::new()
        .allow_origin(frontend_origin.parse::<axum::http::HeaderValue>()?)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([axum::http::header::AUTHORIZATION, axum::http::header::CONTENT_TYPE]);
    let state = AppState { db, jwt_secret, upload_dir: "uploads".to_string() };
    let upload_dir = state.upload_dir.clone();
    let app = build_router(state, cors, &upload_dir);
    let addr: SocketAddr = format!("{host}:{port}").parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("listening on http://{}", listener.local_addr()?);
    axum::serve(listener, app).await?;
    Ok(())
}
