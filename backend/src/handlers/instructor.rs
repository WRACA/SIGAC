
use axum::{
    extract::{Path, State},
    http::{header, HeaderMap, StatusCode},
    Json,
};

use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};

use crate::{
    AppState,
    errors::{error_interno, ApiError},
    handlers::auth::Claims,
    models::{SesionInstructor, AsistenciaRequest, AsistenciaResponse, InscritoSesion},
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

    // 5. Consultar exclusivamente las sesiones del instructor organizadas cronológicamente
    let sesiones = sqlx::query_as::<_, SesionInstructor>(
        r#"
        SELECT
            s.id AS sesion_id,
            a.nombre AS actividad,
            a.descripcion,

            TO_CHAR(
                s.inicio AT TIME ZONE 'America/Mexico_City',
                'YYYY-MM-DD'
            ) AS fecha,

            TO_CHAR(
                s.inicio AT TIME ZONE 'America/Mexico_City',
                'HH24:MI'
            ) AS hora_inicio,

            TO_CHAR(
                s.fin AT TIME ZONE 'America/Mexico_City',
                'HH24:MI'
            ) AS hora_fin,

            s.lugar,
            s.estado::text AS estado,
            'America/Mexico_City'::text AS zona_horaria,
            (s.inicio <= NOW() AND NOW() < s.fin) AS en_curso

        FROM sesion s
        JOIN actividad a ON s.actividad_id = a.id
        JOIN coach c ON s.coach_id = c.id
        LEFT JOIN (
            SELECT
                sesion_id,
                COUNT(*) AS ocupados
            FROM inscripcion
            WHERE estado IN ('inscrito', 'asistio')
            GROUP BY sesion_id
        ) i ON i.sesion_id = s.id

        WHERE c.usuario_id = $1
          AND s.estado IN ('programada', 'en_curso')
          AND s.fin > NOW()
          AND a.eliminado_en IS NULL

        ORDER BY
            CASE
                WHEN s.inicio <= statement_timestamp() AND statement_timestamp() < s.fin AND s.estado != 'cancelada' THEN 0
                ELSE 1
            END ASC,
            s.inicio ASC
        "#
    )
    .bind(datos.claims.id)
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    // 6. Devolver las sesiones en JSON
    Ok(Json(sesiones))
}

// GET /api/instructor/sesiones/{id}
pub async fn consultar_detalle_sesion(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(sesion_id): Path<i64>,
) -> Result<Json<SesionDetalleInstructor>, ApiError> {

    // 1. Obtener y validar el token JWT
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Token requerido".to_string(),
        ))?;

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

    if datos.claims.rol != "coach" {
        return Err((
            StatusCode::FORBIDDEN,
            "Esta función es exclusiva para instructores".to_string(),
        ));
    }

    // 2. Consultar la sesión asignada al coach
    let sesion = sqlx::query_as::<_, SesionInstructor>(
        r#"
        SELECT
            s.id AS sesion_id,
            a.nombre AS actividad,
            a.descripcion,

            TO_CHAR(
                s.inicio AT TIME ZONE 'America/Mexico_City',
                'YYYY-MM-DD'
            ) AS fecha,

            TO_CHAR(
                s.inicio AT TIME ZONE 'America/Mexico_City',
                'HH24:MI'
            ) AS hora_inicio,

            TO_CHAR(
                s.fin AT TIME ZONE 'America/Mexico_City',
                'HH24:MI'
            ) AS hora_fin,

            s.lugar,
            s.estado::text AS estado,

            CASE
                WHEN s.estado = 'cancelada' THEN 'cancelada'
                WHEN s.inicio <= statement_timestamp() AND statement_timestamp() < s.fin THEN 'en_curso'
                WHEN s.inicio > statement_timestamp() THEN 'proxima'
                ELSE 'finalizada'
            END AS estado_tiempo,

            s.cupo,
            COALESCE(i.ocupados, 0)::bigint AS total_inscritos,
            (s.cupo::bigint - COALESCE(i.ocupados, 0)::bigint) AS cupos_disponibles,

            s.inicio::text AS inicio_iso,
            s.fin::text AS fin_iso,
            'America/Mexico_City'::text AS zona_horaria

        FROM sesion s
        JOIN actividad a ON s.actividad_id = a.id
        JOIN coach c ON s.coach_id = c.id
        LEFT JOIN (
            SELECT
                sesion_id,
                COUNT(*) AS ocupados
            FROM inscripcion
            WHERE estado IN ('inscrito', 'asistio')
            GROUP BY sesion_id
        ) i ON i.sesion_id = s.id

        WHERE s.id = $1
          AND c.usuario_id = $2
          AND a.eliminado_en IS NULL
        "#
    )
    .bind(sesion_id)
    .bind(datos.claims.id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(sesion) = sesion else {
        return Err((
            StatusCode::NOT_FOUND,
            "La clase no existe o no está asignada a tu perfil".to_string(),
        ));
    };

    // 3. Consultar alumnos inscritos en esta sesión
    let alumnos = sqlx::query_as::<_, AlumnoClase>(
        r#"
        SELECT
            so.id AS socio_id,
            so.numero_socio,
            u.nombre,
            u.apellido_p,
            u.apellido_m,
            i.estado::text AS estado_inscripcion
        FROM inscripcion i
        JOIN socio so ON i.socio_id = so.id
        JOIN usuario u ON so.usuario_id = u.id
        WHERE i.sesion_id = $1
          AND i.estado IN ('inscrito', 'asistio')
        ORDER BY u.nombre, u.apellido_p
        "#
    )
    .bind(sesion_id)
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    Ok(Json(SesionDetalleInstructor { sesion, alumnos }))
}

// GET /api/instructor/sesiones/{id}/inscritos
pub async fn consultar_inscritos_sesion(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(sesion_id): Path<i64>,
) -> Result<Json<Vec<SocioInscritoSesion>>, ApiError> {

    // 1. Obtener y validar el token JWT
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Token requerido".to_string(),
        ))?;

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

    if datos.claims.rol != "coach" {
        return Err((
            StatusCode::FORBIDDEN,
            "Esta función es exclusiva para instructores".to_string(),
        ));
    }

    // 2. Obtener el coach_id del usuario autenticado y comprobar que esté activo
    let coach_id = sqlx::query_scalar::<_, i32>(
        r#"
        SELECT c.id
        FROM coach c
        JOIN usuario u ON c.usuario_id = u.id
        WHERE u.id = $1
          AND u.rol = 'coach'
          AND u.activo = TRUE
        "#
    )
    .bind(datos.claims.id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(coach_id) = coach_id else {
        return Err((
            StatusCode::FORBIDDEN,
            "No tienes un perfil de instructor activo".to_string(),
        ));
    };

    // 3. Comprobar que la clase exista y pertenezca al instructor autenticado
    let sesion_coach = sqlx::query_scalar::<_, i32>(
        r#"
        SELECT coach_id
        FROM sesion
        WHERE id = $1
        "#
    )
    .bind(sesion_id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(sesion_coach_id) = sesion_coach else {
        return Err((
            StatusCode::NOT_FOUND,
            "La clase o sesión solicitada no existe".to_string(),
        ));
    };

    if sesion_coach_id != coach_id {
        return Err((
            StatusCode::FORBIDDEN,
            "No tienes asignada esta clase para consultar sus inscritos".to_string(),
        ));
    }

    // 4. Consultar los socios inscritos actualizados de la clase
    let inscritos = sqlx::query_as::<_, SocioInscritoSesion>(
        r#"
        SELECT
            so.id,
            so.numero_socio,
            u.nombre,
            u.apellido_p,
            u.apellido_m,
            i.estado::text AS estado
        FROM inscripcion i
        JOIN socio so ON i.socio_id = so.id
        JOIN usuario u ON so.usuario_id = u.id
        WHERE i.sesion_id = $1
          AND i.estado IN ('inscrito', 'asistio')
          AND u.activo = TRUE
        ORDER BY u.nombre, u.apellido_p
        "#
    )
    .bind(sesion_id)
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    // 5. Devolver la lista (o lista vacía si no hay inscritos)
    Ok(Json(inscritos))
}

// Información necesaria para validar la sesión
#[derive(sqlx::FromRow)]
struct SesionAsistencia {
    coach_id: i32,
    en_horario: bool,
    estado: String,
}

// PATCH /api/instructor/asistencia
pub async fn registrar_asistencia(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<AsistenciaRequest>,
) -> Result<Json<AsistenciaResponse>, ApiError> {

    // 1. Obtener el JWT
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
            "Error de configuración".to_string(),
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

    // 3. Comprobar el rol
    if datos.claims.rol != "coach" {
        return Err((
            StatusCode::FORBIDDEN,
            "Solo los instructores pueden registrar asistencias".to_string(),
        ));
    }

    // 4. Obtener el coach_id del usuario autenticado
    let coach_id = sqlx::query_scalar::<_, i32>(
        r#"
        SELECT c.id
        FROM coach c
        JOIN usuario u ON c.usuario_id = u.id
        WHERE u.id = $1
          AND u.rol = 'coach'
          AND u.activo = TRUE
        "#
    )
    .bind(datos.claims.id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(coach_id) = coach_id else {
        return Err((
            StatusCode::FORBIDDEN,
            "No tienes un perfil de instructor activo".to_string(),
        ));
    };

    // 5. Consultar la sesión y verificar el horario
    let sesion = sqlx::query_as::<_, SesionAsistencia>(
        r#"
        SELECT
            coach_id,
            (
                inicio <= statement_timestamp()
                AND statement_timestamp() < fin
            ) AS en_horario,
            estado::text AS estado
        FROM sesion
        WHERE id = $1
        "#
    )
    .bind(body.sesion_id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(sesion) = sesion else {
        return Err((
            StatusCode::NOT_FOUND,
            "La sesión no existe".to_string(),
        ));
    };

    // 6. Verificar que la sesión pertenezca al instructor
    if sesion.coach_id != coach_id {
        return Err((
            StatusCode::FORBIDDEN,
            "No puedes registrar asistencia en una clase ajena".to_string(),
        ));
    }

    // 7. Verificar el estado de la sesión
    if sesion.estado != "programada" && sesion.estado != "en_curso" {
        return Err((
            StatusCode::CONFLICT,
            "La sesión no permite registrar asistencias".to_string(),
        ));
    }

    // 8. Verificar que estemos dentro del horario
    if !sesion.en_horario {
        return Err((
            StatusCode::CONFLICT,
            "Solo puedes registrar asistencias durante el horario de la sesión"
                .to_string(),
        ));
    }

    // 9. Comprobar que el socio esté inscrito
    let inscripcion = sqlx::query_scalar::<_, String>(
        r#"
        SELECT estado::text
        FROM inscripcion
        WHERE socio_id = $1
          AND sesion_id = $2
        "#
    )
    .bind(body.socio_id)
    .bind(body.sesion_id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(estado) = inscripcion else {
        return Err((
            StatusCode::NOT_FOUND,
            "El socio no está inscrito en esta sesión".to_string(),
        ));
    };

    // 10. Evitar asistencias duplicadas o inscripciones canceladas
    if estado != "inscrito" {
        return Err((
            StatusCode::CONFLICT,
            "La inscripción ya fue procesada o no está activa".to_string(),
        ));
    }

    // 11. Registrar la asistencia con una actualización condicionada
    let id = sqlx::query_scalar::<_, i64>(
        r#"
        UPDATE inscripcion AS i
        SET
            estado = 'asistio',
            fecha_asistencia = statement_timestamp(),
            registrado_por = $3
        FROM sesion AS s
        WHERE i.socio_id = $1
          AND i.sesion_id = $2
          AND s.id = i.sesion_id
          AND i.estado = 'inscrito'
          AND s.coach_id = $4
          AND s.estado IN ('programada', 'en_curso')
          AND s.inicio <= statement_timestamp()
          AND statement_timestamp() < s.fin
          AND EXISTS (
              SELECT 1
              FROM coach c
              JOIN usuario u ON c.usuario_id = u.id
              WHERE c.id = s.coach_id
                AND u.id = $3
                AND u.rol = 'coach'
                AND u.activo = TRUE
          )
        RETURNING i.id
        "#
    )
    .bind(body.socio_id)
    .bind(body.sesion_id)
    .bind(datos.claims.id)
    .bind(coach_id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(inscripcion_id) = id else {
        return Err((
            StatusCode::CONFLICT,
            "No se pudo registrar: la asistencia ya fue marcada o la sesión dejó de estar disponible"
                .to_string(),
        ));
    };

    // 12. Respuesta de éxito
    Ok(Json(AsistenciaResponse {
        inscripcion_id,
        mensaje: "Asistencia registrada correctamente".to_string(),
    }))
}

// GET /api/instructor/sesiones/{id}/inscritos
pub async fn consultar_inscritos(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(sesion_id): Path<i64>,
) -> Result<Json<Vec<InscritoSesion>>, ApiError> {

    // 1. Obtener el JWT
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

    // 3. Comprobar el rol
    if datos.claims.rol != "coach" {
        return Err((
            StatusCode::FORBIDDEN,
            "Esta función es exclusiva para instructores".to_string(),
        ));
    }

    // 4. Obtener el coach_id del usuario autenticado
    let coach_id = sqlx::query_scalar::<_, i32>(
        r#"
        SELECT c.id
        FROM coach c
        JOIN usuario u ON c.usuario_id = u.id
        WHERE u.id = $1
          AND u.rol = 'coach'
          AND u.activo = TRUE
        "#
    )
    .bind(datos.claims.id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(coach_id) = coach_id else {
        return Err((
            StatusCode::FORBIDDEN,
            "No tienes un perfil de instructor activo".to_string(),
        ));
    };

    // 5. Verificar que la sesión exista y pertenezca al instructor
    let propietario = sqlx::query_scalar::<_, i32>(
        "SELECT coach_id FROM sesion WHERE id = $1"
    )
    .bind(sesion_id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    let Some(propietario) = propietario else {
        return Err((
            StatusCode::NOT_FOUND,
            "La sesión no existe".to_string(),
        ));
    };

    if propietario != coach_id {
        return Err((
            StatusCode::FORBIDDEN,
            "No puedes consultar una clase ajena".to_string(),
        ));
    }

    // 6. Consultar los socios inscritos
    let inscritos = sqlx::query_as::<_, InscritoSesion>(
        r#"
        SELECT
            s.id AS socio_id,
            s.numero_socio,
            CONCAT_WS(' ', u.nombre, u.apellido_p, u.apellido_m) AS nombre,
            i.estado::text AS estado,
            TO_CHAR(
                i.fecha_asistencia AT TIME ZONE 'America/Mexico_City',
                'YYYY-MM-DD HH24:MI:SS'
            ) AS fecha_asistencia
        FROM inscripcion i
        JOIN socio s ON i.socio_id = s.id
        JOIN usuario u ON s.usuario_id = u.id
        WHERE i.sesion_id = $1
          AND i.estado <> 'cancelada'
        ORDER BY u.nombre, u.apellido_p
        "#
    )
    .bind(sesion_id)
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    Ok(Json(inscritos))
}
