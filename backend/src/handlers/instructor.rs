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
    models::SesionInstructor,
};

// GET /api/instructor/sesiones
pub async fn consultar_sesiones(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<SesionInstructor>>, ApiError> {

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

    // 3. Comprobar el rol del token
    if datos.claims.rol != "coach" {
        return Err((
            StatusCode::FORBIDDEN,
            "Esta función es exclusiva para instructores".to_string(),
        ));
    }

    // 4. Verificar que el instructor exista y esté activo
    let autorizado = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM coach c
            JOIN usuario u ON c.usuario_id = u.id
            WHERE u.id = $1
              AND u.rol = 'coach'
              AND u.activo = TRUE
        )
        "#
    )
    .bind(datos.claims.id)
    .fetch_one(&state.api_pool)
    .await
    .map_err(error_interno)?;

    if !autorizado {
        return Err((
            StatusCode::FORBIDDEN,
            "No tienes un perfil de instructor activo".to_string(),
        ));
    }

    // 5. Consultar exclusivamente las sesiones del instructor
    let sesiones = sqlx::query_as::<_, SesionInstructor>(
        r#"
        SELECT
            s.id AS sesion_id,
            a.nombre AS actividad,

            TO_CHAR(
                s.inicio AT TIME ZONE 'America/Mexico_City',
                'YYYY-MM-DD'
            ) AS fecha,

            TO_CHAR(
                s.inicio AT TIME ZONE 'America/Mexico_City',
                'HH24:MI:SS'
            ) AS hora_inicio,

            TO_CHAR(
                s.fin AT TIME ZONE 'America/Mexico_City',
                'HH24:MI:SS'
            ) AS hora_fin,

            s.lugar,
            s.estado::text AS estado,
            'America/Mexico_City'::text AS zona_horaria

        FROM sesion s
        JOIN actividad a ON s.actividad_id = a.id
        JOIN coach c ON s.coach_id = c.id

        WHERE c.usuario_id = $1
          AND s.estado = 'programada'
          AND s.inicio > NOW()
          AND a.eliminado_en IS NULL

        ORDER BY s.inicio
        "#
    )
    .bind(datos.claims.id)
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    // 6. Devolver las sesiones en JSON
    Ok(Json(sesiones))
}