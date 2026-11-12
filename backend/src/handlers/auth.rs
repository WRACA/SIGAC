use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    Json,
};

use crate::AppState;
use crate::errors::{error_interno, ApiError};
use crate::models::{LoginRequest, RegisterRequest, Usuario, UsuarioLogin};

use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

// Rol por defecto
const ROL_POR_DEFECTO: &str = "socio";

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub id: i32,
    pub rol: String,
    pub exp: usize,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub usuario: Usuario,
    pub token: String,
}

// ---------- POST /auth/register ----------
// Solo un recepcionista o administrador activo puede dar de alta socios.
pub async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<Usuario>), ApiError> {
    let db = &state.api_pool;

    // Obtener y validar el JWT
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or((StatusCode::UNAUTHORIZED, "Token requerido".to_string()))?;

    let secret = std::env::var("JWT_SECRET").map_err(|_| (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Error de configuración del servidor".to_string(),
    ))?;

    let datos = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .map_err(|_| (StatusCode::UNAUTHORIZED, "Token inválido o expirado".to_string()))?;

    // Comprobar que sea un recepcionista o administrador activo
    let autorizado = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM usuario
            WHERE id = $1
              AND rol IN ('recepcionista', 'administrador')
              AND activo = TRUE
        )
        "#,
    )
    .bind(datos.claims.id)
    .fetch_one(db)
    .await
    .map_err(error_interno)?;

    if !autorizado {
        return Err((
            StatusCode::FORBIDDEN,
            "Solo recepción puede dar de alta socios".to_string(),
        ));
    }

    let correo = body.correo.trim().to_lowercase();
    let nombre = body.nombre.trim().to_string();
    let apellido_p = body.apellido_p.trim().to_string();

    if !correo.contains('@') || correo.len() > 150 {
        return Err((StatusCode::BAD_REQUEST, "Correo inválido.".to_string()));
    }
    if nombre.is_empty() || nombre.len() > 150 {
        return Err((StatusCode::BAD_REQUEST, "Nombre inválido".to_string()));
    }
    if body.password.len() < 8 || body.password.len() > 72 {
        return Err((
            StatusCode::BAD_REQUEST,
            "La contraseña debe tener entre 8 y 72 caracteres".to_string(),
        ));
    }

    let existe = sqlx::query_scalar::<_, i32>("SELECT 1 FROM usuario WHERE correo = $1")
        .bind(&correo)
        .fetch_optional(db)
        .await
        .map_err(error_interno)?;

    if existe.is_some() {
        return Err((StatusCode::CONFLICT, "Ese correo ya está registrado".to_string()));
    }

    let hash = bcrypt::hash(&body.password, bcrypt::DEFAULT_COST).map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Error al procesar la contraseña".to_string(),
        )
    })?;

    let usuario = sqlx::query_as::<_, Usuario>(
        r#"
        WITH nuevo_usuario AS (
            INSERT INTO usuario (nombre, apellido_p, correo, password_hash, rol)
            VALUES ($1, $2, $3, $4, $5::rol_usuario)
            RETURNING id, nombre, correo, rol
        ),
        nuevo_socio AS (
            INSERT INTO socio (usuario_id)
            SELECT id FROM nuevo_usuario
            RETURNING id
        ),
        -- SIG-95: credencial QR con token UUID aleatorio (DEFAULT gen_random_uuid())
        nueva_credencial AS (
            INSERT INTO credencial_qr (socio_id)
            SELECT id FROM nuevo_socio
        )
        SELECT id, nombre, correo, rol::text FROM nuevo_usuario
        "#
    )
    .bind(&nombre)
    .bind(&apellido_p)
    .bind(&correo)
    .bind(&hash)
    .bind(ROL_POR_DEFECTO)
    .fetch_one(db)
    .await
    .map_err(error_interno)?;

    Ok((StatusCode::CREATED, Json(usuario)))
}

// ---------- POST /auth/login ----------
pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, ApiError> {
    
    let db = &state.auth_pool; 

    let correo = body.correo.trim().to_lowercase();
    let credenciales_malas = (
        StatusCode::UNAUTHORIZED,
        "Credenciales incorrectas".to_string(),
    );

    let encontrado = sqlx::query_as::<_, UsuarioLogin>(
        r#"SELECT id, nombre, correo, rol::text, password_hash AS password
           FROM usuario WHERE correo = $1"# 
    )
    .bind(&correo)
    .fetch_optional(db)
    .await
    .map_err(error_interno)?;

    let Some(u) = encontrado else {
        return Err(credenciales_malas);
    };

    let es_correcta = bcrypt::verify(&body.password, &u.password).unwrap_or(false);
    if !es_correcta {
        return Err(credenciales_malas);
    }

    let expiracion = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error de reloj".to_string()))?
        .as_secs() as usize + (24 * 3600);

    let claims = Claims {
        id: u.id,
        rol: u.rol.clone(),
        exp: expiracion,
    };

    let secret = std::env::var("JWT_SECRET")
    .map_err(|_| (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Error de configuración del servidor".to_string()
    ))?;

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error al generar el token".to_string()))?;

    Ok(Json(LoginResponse {
        usuario: Usuario {
            id: u.id,
            nombre: u.nombre,
            correo: u.correo,
            rol: u.rol,
        },
        token,
    }))
}