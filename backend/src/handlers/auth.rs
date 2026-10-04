use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;

use crate::errors::{error_interno, ApiError};
use crate::models::{LoginRequest, RegisterRequest, Usuario, UsuarioLogin};

// rol por defecto que recibira cada usuario que se registre de momento
const ROL_POR_DEFECTO: &str = "estudiante";

// ---------- POST /auth/register ----------
pub async fn register(
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
pub async fn login(
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