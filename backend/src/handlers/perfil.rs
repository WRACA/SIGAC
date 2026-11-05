use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    Json,
};

use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};

use crate::{
    AppState,
    errors::{error_interno, ApiError},
    handlers::auth::Claims,
    models::PerfilSocio,
};

// GET /api/socio/perfil
pub async fn obtener_perfil(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<PerfilSocio>, ApiError> {

    // 1. Obtener el token del usuario
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Token requerido".to_string(),
        ))?;

    // 2. Verificar el JWT
    let secret = std::env::var("JWT_SECRET")
        .map_err(|_| (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Error de configuración del servidor".to_string(),
        ))?;

    let datos = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .map_err(|_| (
        StatusCode::UNAUTHORIZED,
        "Token inválido o expirado".to_string(),
    ))?;

    // 3. Comprobar el rol del token
    if datos.claims.rol != "socio" {
        return Err((
            StatusCode::FORBIDDEN,
            "Esta función es exclusiva para socios".to_string(),
        ));
    }

    // 4. Consultar el perfil usando el ID del JWT
    let perfil = sqlx::query_as::<_, PerfilSocio>(
        r#"
        SELECT
            s.id,
            s.numero_socio,
            u.nombre,
            u.apellido_p,
            u.apellido_m,
            u.correo,
            u.telefono,
            s.fecha_nacimiento::text AS fecha_nacimiento,
            s.fecha_alta::text AS fecha_alta
        FROM socio s
        JOIN usuario u ON s.usuario_id = u.id
        WHERE u.id = $1
          AND u.rol = 'socio'
          AND u.activo = TRUE
        "#
    )
    .bind(datos.claims.id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    // 5. Comprobar si el perfil existe
    let Some(perfil) = perfil else {
        return Err((
            StatusCode::NOT_FOUND,
            "No se encontró un perfil de socio activo".to_string(),
        ));
    };

    // 6. Devolver el perfil
    Ok(Json(perfil))
}