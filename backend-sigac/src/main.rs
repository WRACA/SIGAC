use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};

// rol por defecto que recibira cada usuario que se registre de momento
const ROL_POR_DEFECTO: &str = "estudiante";

// definimos un tipo para nuestros errores que se componen de un codigo http y una cadena
type ApiError = (StatusCode, String);

// ---------- Datos que llegan del cliente ----------
#[derive(Deserialize)]
struct RegisterRequest {
    nombre: String,
    correo: String,
    password: String,
}

#[derive(Deserialize)]
struct LoginRequest {
    correo: String,
    password: String,
}

// ---------- Datos que devolvemos (sin contraseña) ----------
#[derive(Serialize, sqlx::FromRow)]
struct Usuario {
    id: i32,
    nombre: String,
    correo: String,
    rol: String,
}

// Solo se usa internamente en el login, para comparar la contraseña.
#[derive(sqlx::FromRow)]
struct UsuarioLogin {
    id: i32,
    nombre: String,
    correo: String,
    rol: String,
    password: String, // aquí viene el hash guardado en la BD
}

// ---------- Función auxiliar para errores de base de datos ----------
fn error_interno(e: sqlx::Error) -> ApiError {
    eprintln!("Error de base de datos: {e}"); // lo vemos en la terminal
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Error interno del servidor".to_string(),
    )
}

// ---------- POST /auth/register ----------
async fn register(
    State(db): State<PgPool>,
    Json(body): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<Usuario>), ApiError> {
    let correo = body.correo.trim().to_lowercase();
    let nombre = body.nombre.trim().to_string();

    // validar que los datos tengan el formato apropiado
    if !correo.contains('@') || correo.len() > 150 {
        return Err((StatusCode::BAD_REQUEST, "Correo inválido".to_string()));
    }
    if nombre.is_empty() || nombre.len() > 100 {
        return Err((StatusCode::BAD_REQUEST, "Nombre inválido".to_string()));
    }
    if body.password.len() < 8 || body.password.len() > 72 {
        return Err((
            StatusCode::BAD_REQUEST,
            "La contraseña debe tener entre 8 y 72 caracteres".to_string(),
        ));
    }

    // revisa que el correo no exista ya
    let existe = sqlx::query_scalar::<_, i32>("SELECT 1 FROM usuarios WHERE correo = $1")
        .bind(&correo)
        .fetch_optional(&db)
        .await
        .map_err(error_interno)?;

    if existe.is_some() {
        return Err((StatusCode::CONFLICT, "Ese correo ya está registrado".to_string()));
    }

    // Encriptar la contraseña 
    let hash = bcrypt::hash(&body.password, bcrypt::DEFAULT_COST).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Error al procesar la contraseña".to_string(),
        )
    })?;

    // Guardar en la base de datos
    let usuario = sqlx::query_as::<_, Usuario>(
        r#"INSERT INTO usuarios (nombre, correo, "contraseña", rol)
           VALUES ($1, $2, $3, $4)
           RETURNING id, nombre, correo, rol"#,
    )
    .bind(&nombre)
    .bind(&correo)
    .bind(&hash)
    .bind(ROL_POR_DEFECTO)
    .fetch_one(&db)
    .await
    .map_err(error_interno)?;

    Ok((StatusCode::CREATED, Json(usuario)))
}

// ---------- POST /auth/login ----------
async fn login(
    State(db): State<PgPool>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<Usuario>, ApiError> {
    let correo = body.correo.trim().to_lowercase();
    let credenciales_malas = (
        StatusCode::UNAUTHORIZED,
        "Credenciales incorrectas".to_string(),
    );

    // buscar usuario por correo
    let encontrado = sqlx::query_as::<_, UsuarioLogin>(
        r#"SELECT id, nombre, correo, rol, "contraseña" AS password
           FROM usuarios WHERE correo = $1"#,
    )
    .bind(&correo)
    .fetch_optional(&db)
    .await
    .map_err(error_interno)?;

    let Some(u) = encontrado else {
        return Err(credenciales_malas);
    };

    // comparamos la contraseña escrita con el hash guardado
    let es_correcta = bcrypt::verify(&body.password, &u.password).unwrap_or(false);
    if !es_correcta {
        return Err(credenciales_malas);
    }

    // si todo esta correcto entonces devolvemos los datos del usuario (sin contraseña)
    Ok(Json(Usuario {
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
    }))
}

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
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .with_state(db); // el pool de conexiones se comparte con los handlers

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Servidor en http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}