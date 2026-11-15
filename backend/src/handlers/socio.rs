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
    models::InscripcionSocio,
};

// GET /api/socio/inscripciones
pub async fn obtener_inscripciones(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<InscripcionSocio>>, ApiError> {

    // 1. Obtener el token JWT
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Token requerido".to_string(),
        ))?;

    // 2. Validar el token
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

    // 3. Comprobar que sea un socio
    if datos.claims.rol != "socio" {
        return Err((
            StatusCode::FORBIDDEN,
            "Esta función es exclusiva para socios".to_string(),
        ));
    }

    // 4. Consultar las inscripciones del socio autenticado
    let inscripciones = sqlx::query_as::<_, InscripcionSocio>(
        r#"
        SELECT
            i.id,
            s.id AS sesion_id,
            a.nombre AS actividad,
            s.inicio::text AS inicio,
            s.fin::text AS fin,
            CONCAT_WS(
                ' ',
                u.nombre,
                u.apellido_p,
                u.apellido_m
            ) AS coach,
            s.lugar,
            i.estado::text AS estado,
            i.tipo_acceso::text AS tipo_acceso,
            i.fecha_asistencia::text AS fecha_asistencia
        FROM inscripcion i
        JOIN sesion s ON i.sesion_id = s.id
        JOIN actividad a ON s.actividad_id = a.id
        JOIN coach c ON s.coach_id = c.id
        JOIN usuario u ON c.usuario_id = u.id
        WHERE i.socio_id = (
            SELECT id
            FROM socio
            WHERE usuario_id = $1
        )
        ORDER BY s.inicio DESC
        "#
    )
    .bind(datos.claims.id)
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    // 5. Devolver las inscripciones
    Ok(Json(inscripciones))
}