use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, StatusCode},
    Json,
};

use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};

use crate::{
    AppState,
    errors::{error_interno, ApiError},
    handlers::auth::Claims,
    models::{BuscarSociosQuery, SocioBusqueda,ActividadInscripcion},
};



// GET /api/recepcion/socios
pub async fn buscar_socios(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<BuscarSociosQuery>,
) -> Result<Json<Vec<SocioBusqueda>>, ApiError> {

    // Obtener el token del encabezado Authorization
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Token requerido".to_string(),
        ))?;

    // Verificar la firma y expiración del JWT
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

    // Comprobar que la cuenta sigue activa y es recepcionista o administrador
    let autorizado = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM usuario
            WHERE id = $1
              AND rol IN ('recepcionista', 'administrador')
              AND activo = TRUE
        )
        "#,
    )
    .bind(datos.claims.id)
    .fetch_one(&state.api_pool)
    .await
    .map_err(error_interno)?;

    if !autorizado {
        return Err((
            StatusCode::FORBIDDEN,
            "No tienes permisos para consultar socios".to_string(),
        ));
    }

    // Obtener el texto de búsqueda
    let busqueda = params.q.trim();

    if busqueda.is_empty() || busqueda.len() > 100 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Proporciona una búsqueda válida".to_string(),
        ));
    }

    // Buscar socios por nombre completo o número de socio
    let socios = sqlx::query_as::<_, SocioBusqueda>(
        r#"
        SELECT
            s.id,
            s.numero_socio,
            u.nombre,
            u.apellido_p,
            u.apellido_m
        FROM socio s
        JOIN usuario u ON s.usuario_id = u.id
        WHERE u.activo = TRUE
          AND (
              s.numero_socio::text = $1
              OR CONCAT_WS(
                  ' ',
                  u.nombre,
                  u.apellido_p,
                  u.apellido_m
              ) ILIKE '%' || $1 || '%'
          )
        ORDER BY u.nombre, u.apellido_p
        LIMIT 20
        "#,
    )
    .bind(busqueda)
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    Ok(Json(socios))
}

// GET /api/recepcion/actividades
pub async fn actividades_inscripcion(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<ActividadInscripcion>>, ApiError> {

    // 1. Obtener el token JWT
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Token requerido".to_string(),
        ))?;

    // 2. Verificar el token
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

    // 3. Comprobar los permisos del recepcionista o administrador
    let autorizado = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM usuario
            WHERE id = $1
              AND rol IN ('recepcionista', 'administrador')
              AND activo = TRUE
        )
        "#,
    )
    .bind(datos.claims.id)
    .fetch_one(&state.api_pool)
    .await
    .map_err(error_interno)?;

    if !autorizado {
        return Err((
            StatusCode::FORBIDDEN,
            "No tienes permisos para consultar las actividades".to_string(),
        ));
    }

    // 4. Consultar sesiones disponibles
    let actividades = sqlx::query_as::<_, ActividadInscripcion>(
        r#"
        SELECT
            s.id AS sesion_id,
            a.nombre AS actividad,
            s.inicio::text AS inicio,
            s.fin::text AS fin,
            CONCAT_WS(' ', u.nombre, u.apellido_p, u.apellido_m) AS coach,
            s.lugar,
            s.cupo,
            s.cupo::bigint - COALESCE(i.ocupados, 0) AS cupos_disponibles
        FROM sesion s
        JOIN actividad a ON s.actividad_id = a.id
        JOIN coach c ON s.coach_id = c.id
        JOIN usuario u ON c.usuario_id = u.id
        LEFT JOIN (
            SELECT
                sesion_id,
                COUNT(*) AS ocupados
            FROM inscripcion
            WHERE estado IN ('inscrito', 'asistio')
            GROUP BY sesion_id
        ) i ON i.sesion_id = s.id
        WHERE s.estado = 'programada'
          AND s.inicio > NOW()
          AND a.eliminado_en IS NULL
          AND u.activo = TRUE
          AND s.cupo::bigint > COALESCE(i.ocupados, 0)
        ORDER BY s.inicio
        "#
    )
    .fetch_all(&state.api_pool)
    .await
    .map_err(error_interno)?;

    Ok(Json(actividades))
}

use crate::models::{InscripcionRequest, InscripcionResponse};

// Modelo interno para consultar la sesión
#[derive(sqlx::FromRow)]
struct SesionParaInscripcion {
    cupo: i16,
    nivel_minimo: i16,
    disponible: bool,
}

// POST /api/recepcion/inscripciones
pub async fn registrar_inscripcion(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<InscripcionRequest>,
) -> Result<(StatusCode, Json<InscripcionResponse>), ApiError> {

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

    // 3. Comprobar que sea un recepcionista o administrador activo
    let autorizado = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM usuario
            WHERE id = $1
              AND rol IN ('recepcionista', 'administrador')
              AND activo = TRUE
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
            "No tienes permiso para inscribir socios".to_string(),
        ));
    }

    // 4. Validar el tipo de acceso
    if body.tipo_acceso != "membresia" && body.tipo_acceso != "pago" {
        return Err((
            StatusCode::BAD_REQUEST,
            "El tipo de acceso debe ser membresia o pago".to_string(),
        ));
    }

    // El flujo de pago individual aún no está implementado
    if body.tipo_acceso == "pago" {
        return Err((
            StatusCode::CONFLICT,
            "La inscripción mediante pago individual aún no está disponible"
                .to_string(),
        ));
    }

    // 5. Iniciar transacción
    let mut tx = state.api_pool
        .begin()
        .await
        .map_err(error_interno)?;

    // 6. Verificar que el socio exista y esté activo
    let socio_existe = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM socio s
            JOIN usuario u ON s.usuario_id = u.id
            WHERE s.id = $1
              AND u.activo = TRUE
              AND u.rol = 'socio'
        )
        "#
    )
    .bind(body.socio_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(error_interno)?;

    if !socio_existe {
        return Err((
            StatusCode::NOT_FOUND,
            "El socio no existe o no está activo".to_string(),
        ));
    }

    // 7. Consultar y bloquear la sesión
    let sesion = sqlx::query_as::<_, SesionParaInscripcion>(
        r#"
        SELECT
            s.cupo,
            a.nivel_minimo,
            (
                s.estado = 'programada'
                AND s.inicio > NOW()
                AND a.eliminado_en IS NULL
            ) AS disponible
        FROM sesion s
        JOIN actividad a ON s.actividad_id = a.id
        WHERE s.id = $1
        FOR UPDATE OF s
        "#
    )
    .bind(body.sesion_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(error_interno)?;

    let Some(sesion) = sesion else {
        return Err((
            StatusCode::NOT_FOUND,
            "La sesión no existe".to_string(),
        ));
    };

    if !sesion.disponible {
        return Err((
            StatusCode::CONFLICT,
            "La sesión no está disponible".to_string(),
        ));
    }

    // 8. Evitar inscripciones duplicadas
    let duplicada = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM inscripcion
            WHERE socio_id = $1
              AND sesion_id = $2
        )
        "#
    )
    .bind(body.socio_id)
    .bind(body.sesion_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(error_interno)?;

    if duplicada {
        return Err((
            StatusCode::CONFLICT,
            "El socio ya tiene una inscripción en esta sesión".to_string(),
        ));
    }

    // 9. Comprobar cupos
    let ocupados = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM inscripcion
        WHERE sesion_id = $1
          AND estado IN ('inscrito', 'asistio')
        "#
    )
    .bind(body.sesion_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(error_interno)?;

    if ocupados >= i64::from(sesion.cupo) {
        return Err((
            StatusCode::CONFLICT,
            "No quedan cupos disponibles".to_string(),
        ));
    }

    // 10. Validar la membresía para la fecha de la sesión
    let membresia_valida = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM membresia m
            JOIN plan_membresia p ON m.plan_id = p.id
            JOIN sesion s ON s.id = $2
            WHERE m.socio_id = $1
              AND m.estado = 'activa'
              AND p.activo = TRUE
              AND p.nivel >= $3
              AND m.fecha_inicio <= (s.inicio AT TIME ZONE 'America/Mexico_City')::date
              AND m.fecha_fin >= (s.inicio AT TIME ZONE 'America/Mexico_City')::date
        )
        "#
    )
    .bind(body.socio_id)
    .bind(body.sesion_id)
    .bind(sesion.nivel_minimo)
    .fetch_one(&mut *tx)
    .await
    .map_err(error_interno)?;

    if !membresia_valida {
        return Err((
            StatusCode::CONFLICT,
            "El socio no tiene membresía válida para esta sesión".to_string(),
        ));
    }

    // 11. Registrar la inscripción
    let id = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO inscripcion (
            socio_id,
            sesion_id,
            tipo_acceso,
            estado,
            registrado_por
        )
        VALUES ($1, $2, 'membresia', 'inscrito', $3)
        RETURNING id
        "#
    )
    .bind(body.socio_id)
    .bind(body.sesion_id)
    .bind(datos.claims.id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(ref db_error) = e {
            if db_error.code().as_deref() == Some("23505") {
                return (
                    StatusCode::CONFLICT,
                    "El socio ya está inscrito".to_string(),
                );
            }
        }
        error_interno(e)
    })?;

    // 12. Confirmar cambios
    tx.commit().await.map_err(error_interno)?;

    Ok((
        StatusCode::CREATED,
        Json(InscripcionResponse {
            id,
            socio_id: body.socio_id,
            sesion_id: body.sesion_id,
            tipo_acceso: "membresia".to_string(),
            mensaje: "Inscripción registrada correctamente".to_string(),
        }),
    ))
}