mod errors;
mod handlers;
mod models;

use axum::{routing::post, Router};
use sqlx::postgres::PgPoolOptions;

use handlers::auth::{login, register};

// ---------- main ----------
#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok(); // carga el archivo .env

    let database_url = std::env::var("DATABASE_URL").expect("Falta DATABASE_URL en .env");

    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("No se pudo conectar a la base de datos");

    println!("Conectado a Neon :)");

    let app = Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .with_state(db); // el pool de conexiones se comparte con los handlers

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Servidor en http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}