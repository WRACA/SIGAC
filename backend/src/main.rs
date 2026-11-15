mod errors;
mod handlers;
mod models;
mod qr;
mod seed;

use axum::{routing::{get,post,patch}, Router};
use sqlx::{postgres::PgPoolOptions, PgPool};

use handlers::auth::{login, register};
use handlers::actividades::listar_actividades;
use handlers::recepcion::buscar_socios;
use handlers::recepcion::actividades_inscripcion;
use handlers::recepcion::registrar_inscripcion;
use handlers::perfil::obtener_perfil;
use handlers::credencial::obtener_credencial_qr;
use handlers::instructor::consultar_sesiones;
use handlers::instructor::consultar_detalle_sesion;
use handlers::instructor::registrar_asistencia;
use handlers::instructor::consultar_inscritos;
use handlers::socio::obtener_inscripciones;

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

    // ---------- Semilla de datos de prueba ----------
    // Escucha el teclado: al escribir la palabra clave (ver seed::PALABRA_CLAVE)
    // se cargan los datos de prueba. Solo se aplica una vez por base de datos.
    // Si existe DB_URL_SEED se usa ese usuario de BD; si no, el de la API.
    let seed_pool = match std::env::var("DB_URL_SEED") {
        Ok(url) => PgPoolOptions::new()
            .max_connections(1)
            .connect_lazy(&url)
            .expect("DB_URL_SEED no es una cadena de conexión válida"),
        Err(_) => state.api_pool.clone(),
    };
    tokio::spawn(seed::escuchar_teclado(seed_pool));

   let app = Router::new()
    .route("/api/auth/register", post(register))
    .route("/api/auth/login", post(login))
    .route("/api/actividades", get(listar_actividades))
    .route("/api/recepcion/socios", get(buscar_socios))
    .route("/api/recepcion/actividades", get(actividades_inscripcion))
    .route("/api/recepcion/inscripciones", post(registrar_inscripcion))
    .route("/api/socio/perfil", get(obtener_perfil))
    .route("/api/socio/credencial-qr", get(obtener_credencial_qr))
    .route("/api/socio/inscripciones", get(obtener_inscripciones))
    .route("/api/instructor/sesiones", get(consultar_sesiones))
    .route("/api/instructor/sesiones/{id}", get(consultar_detalle_sesion))
    .route("/api/instructor/sesiones/{id}/inscritos", get(consultar_inscritos))
    .route("/api/instructor/asistencia", patch(registrar_asistencia))
    .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Servidor en http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}