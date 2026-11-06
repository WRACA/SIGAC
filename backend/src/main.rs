mod errors;
mod handlers;
mod models;

use axum::{routing::{get,post}, Router};
use sqlx::{postgres::PgPoolOptions, PgPool};

use handlers::auth::{login, register};
use handlers::actividades::listar_actividades;
use handlers::recepcion::buscar_socios;
use handlers::recepcion::actividades_inscripcion;
use handlers::recepcion::registrar_inscripcion;
use handlers::perfil::obtener_perfil;
use handlers::instructor::consultar_sesiones;

#[derive(Clone)]
pub struct AppState {
    pub auth_pool: PgPool,
    pub api_pool: PgPool,
    pub public_pool:PgPool,
}

// ---------- main ----------
#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok(); // carga el archivo .env

    let url_auth = std::env::var("DB_URL_AUTH").expect("Falta DB_URL_AUTH en .env");
    let url_api = std::env::var("DB_URL_API").expect("Falta DB_URL_API en .env");
    let url_public = std::env::var("DB_URL_PUBLIC")
    .expect("FALTA DB_URL_PUBLIC en .env");


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

    let public_pool = PgPoolOptions::new()
    .max_connections(3)
    .connect(&url_public)
    .await
    .expect("No se pudo conectar a la base de datos con sigac_publico");

    println!("Conectado a Neon con múltiples roles :)");

    let state = AppState {
        auth_pool,
        api_pool,
        public_pool,
    };

   let app = Router::new()
    .route("/api/auth/register", post(register))
    .route("/api/auth/login", post(login))
    .route("/api/actividades", get(listar_actividades))
    .route("/api/recepcion/socios", get(buscar_socios))
    .route("/api/recepcion/actividades", get(actividades_inscripcion))
    .route("/api/recepcion/inscripciones", post(registrar_inscripcion))
    .route("/api/socio/perfil", get(obtener_perfil))
    .route("/api/instructor/sesiones", get(consultar_sesiones))
    .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Servidor en http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}