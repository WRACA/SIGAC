mod errors;
mod handlers;
mod models;

use axum::{routing::post, Router};
use sqlx::{postgres::PgPoolOptions, PgPool};

use handlers::auth::{login, register};

#[derive(Clone)]
pub struct AppState {
    pub auth_pool: PgPool,
    pub api_pool: PgPool,
}

// ---------- main ----------
#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok(); // carga el archivo .env

    let url_auth = std::env::var("DB_URL_AUTH").expect("Falta DB_URL_AUTH en .env");
    let url_api = std::env::var("DB_URL_API").expect("Falta DB_URL_API en .env");

    let auth_pool = PgPoolOptions::new()
        .max_connections(3)
        .connect(&url_auth)
        .await
        .expect("No se pudo conectar a la base de datos con sigac_auth");

    let api_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&url_api)
        .await
        .expect("No se pudo conectar a la base de datos con sigac_api");

    println!("Conectado a Neon con múltiples roles :)");

    let state = AppState {
        auth_pool,
        api_pool,
    };

    let app = Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Servidor en http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}