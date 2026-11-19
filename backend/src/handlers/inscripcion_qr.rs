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
    models::{InscripcionQrRequest, InscripcionQrResponse},
    qr,
};

// Credencial encontrada a partir del token del QR
#[derive(sqlx::FromRow)]
struct CredencialEncontrada {
    socio_id: i32,
    estado: String,       // activa | inactiva | revocada
    cuenta_activa: bool,  // usuario.activo y rol = socio
}

// Datos de la sesión necesarios para validar la inscripción
#[derive(sqlx::FromRow)]
struct SesionParaInscripcionQr {
    cupo: i16,
    nivel_minimo: i16,
    precio_sin_membresia: Option<String>, // NULL = no se vende por sesión suelta
    disponible: bool,
}

// POST /api/recepcionista/sesiones/{sesion_id}/inscripciones/qr
// Inscribe a un socio en una sesión a partir del contenido de su credencial QR.
pub async fn inscribir_socio_por_qr(
    State(state): State<AppState>,
    Path(sesion_id): Path<i64>,
    headers: HeaderMap,
    Json(body): Json<InscripcionQrRequest>,
) -> Result<(StatusCode, Json<InscripcionQrResponse>), ApiError> {

    // ================= TAREA 1: endpoint, rol y credencial =================

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

    // 3. Comprobar en la BD que sea un recepcionista activo
    //    (no confiamos solo en el rol del JWT: la cuenta pudo desactivarse después)
    let es_recepcionista = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM usuario
            WHERE id = $1
              AND rol = 'recepcionista'
              AND activo = TRUE
        )
        "#
    )
    .bind(datos.claims.id)
    .fetch_one(&state.api_pool)
    .await
    .map_err(error_interno)?;

    if !es_recepcionista {
        return Err((
            StatusCode::FORBIDDEN,
            "Solo un recepcionista puede inscribir socios con QR".to_string(),
        ));
    }

    // 4. Extraer el token de la credencial desde el contenido del QR
    //    Formato esperado: SIGAC:SOCIO:1:<UUID>
    let Some(token_qr) = qr::extraer_token(&body.contenido) else {
        return Err((
            StatusCode::BAD_REQUEST,
            "El código QR no es una credencial válida de SIGAC".to_string(),
        ));
    };

    // 5. Iniciar transacción: todas las validaciones y el registro ocurren juntos
    let mut tx = state.api_pool
        .begin()
        .await
        .map_err(error_interno)?;

    // 6. Identificar al socio mediante el token de su credencial
    let credencial = sqlx::query_as::<_, CredencialEncontrada>(
        r#"
        SELECT
            c.socio_id,
            c.estado::text AS estado,
            (u.activo = TRUE AND u.rol = 'socio') AS cuenta_activa
        FROM credencial_qr c
        JOIN socio s ON s.id = c.socio_id
        JOIN usuario u ON u.id = s.usuario_id
        WHERE c.token = $1::uuid
        "#
    )
    .bind(token_qr)
    .fetch_optional(&mut *tx)
    .await
    .map_err(error_interno)?;

    // 7. Rechazar credenciales inválidas, inactivas o revocadas
    let Some(credencial) = credencial else {
        return Err((
            StatusCode::NOT_FOUND,
            "Credencial inválida: no pertenece a ningún socio".to_string(),
        ));
    };

    if credencial.estado != "activa" {
        let mensaje = if credencial.estado == "revocada" {
            "La credencial fue revocada"
        } else {
            "La credencial está inactiva"
        };
        return Err((StatusCode::CONFLICT, mensaje.to_string()));
    }

    let socio_id = credencial.socio_id;

    // ================= TAREA 2: validaciones de inscripción =================

    // 8. El socio y su cuenta deben estar activos
    if !credencial.cuenta_activa {
        return Err((
            StatusCode::CONFLICT,
            "La cuenta del socio no está activa".to_string(),
        ));
    }

    // 9. Consultar y bloquear la sesión (FOR UPDATE evita que dos recepcionistas
    //    ocupen el último lugar al mismo tiempo)
    let sesion = sqlx::query_as::<_, SesionParaInscripcionQr>(
        r#"
        SELECT
            s.cupo,
            a.nivel_minimo,
            a.precio_sin_membresia::text AS precio_sin_membresia,
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
    .bind(sesion_id)
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

    // 10. Rechazar inscripciones duplicadas
    let duplicada = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1 FROM inscripcion
            WHERE socio_id = $1
              AND sesion_id = $2
        )
        "#
    )
    .bind(socio_id)
    .bind(sesion_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(error_interno)?;

    if duplicada {
        return Err((
            StatusCode::CONFLICT,
            "El socio ya tiene una inscripción en esta sesión".to_string(),
        ));
    }

    // 11. Comprobar que quede cupo
    let ocupados = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM inscripcion
        WHERE sesion_id = $1
          AND estado IN ('inscrito', 'asistio')
        "#
    )
    .bind(sesion_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(error_interno)?;

    if ocupados >= i64::from(sesion.cupo) {
        return Err((
            StatusCode::CONFLICT,
            "No quedan cupos disponibles".to_string(),
        ));
    }

    // 12. Nivel más alto entre las membresías activas y vigentes el día de la sesión.
    //     MAX devuelve NULL (None) si el socio no tiene ninguna.
    let nivel_membresia = sqlx::query_scalar::<_, Option<i16>>(
        r#"
        SELECT MAX(p.nivel)
        FROM membresia m
        JOIN plan_membresia p ON m.plan_id = p.id
        JOIN sesion s ON s.id = $2
        WHERE m.socio_id = $1
          AND m.estado = 'activa'
          AND p.activo = TRUE
          AND m.fecha_inicio <= (s.inicio AT TIME ZONE 'America/Mexico_City')::date
          AND m.fecha_fin >= (s.inicio AT TIME ZONE 'America/Mexico_City')::date
        "#
    )
    .bind(socio_id)
    .bind(sesion_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(error_interno)?;

    // 13. ¿La membresía cubre el nivel mínimo de la actividad?
    let cubierta_por_membresia = match nivel_membresia {
        Some(nivel) => nivel >= sesion.nivel_minimo,
        None => false,
    };

    if !cubierta_por_membresia {
        let motivo = match nivel_membresia {
            Some(_) => "El nivel de la membresía del socio no alcanza el nivel mínimo de la actividad",
            None => "El socio no tiene una membresía activa y vigente para la fecha de la sesión",
        };

        // Si la actividad se vende por sesión, se requiere un pago adicional:
        // no se inscribe aquí, se informa que debe hacerse el proceso de pago.
        return Err(match sesion.precio_sin_membresia {
            Some(precio) => (
                StatusCode::PAYMENT_REQUIRED,
                format!(
                    "{motivo}. Se requiere un pago adicional de ${precio} por la sesión: \
                     realiza el proceso de pago correspondiente para completar la inscripción"
                ),
            ),
            None => (
                StatusCode::CONFLICT,
                format!("{motivo}, y esta actividad no admite pago por sesión"),
            ),
        });
    }

    // ================= TAREA 3: registrar la inscripción =================

    // 14. Crear el registro: estado 'inscrito', acceso por membresía,
    //     fecha de inscripción y recepcionista responsable en inscrito_por
    let (id, fecha_inscripcion) = sqlx::query_as::<_, (i64, String)>(
        r#"
        INSERT INTO inscripcion (
            socio_id,
            sesion_id,
            tipo_acceso,
            estado,
            fecha_inscripcion,
            inscrito_por
        )
        VALUES ($1, $2, 'membresia', 'inscrito', NOW(), $3)
        RETURNING id, fecha_inscripcion::text
        "#
    )
    .bind(socio_id)
    .bind(sesion_id)
    .bind(datos.claims.id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        // 23505 = violación de UNIQUE (socio_id, sesion_id): otra petición lo inscribió antes
        if let sqlx::Error::Database(ref db_error) = e {
            if db_error.code().as_deref() == Some("23505") {
                return (
                    StatusCode::CONFLICT,
                    "El socio ya tiene una inscripción en esta sesión".to_string(),
                );
            }
        }
        error_interno(e)
    })?;

    // 15. Confirmar cambios
    tx.commit().await.map_err(error_interno)?;

    Ok((
        StatusCode::CREATED,
        Json(InscripcionQrResponse {
            id,
            socio_id,
            sesion_id,
            tipo_acceso: "membresia".to_string(),
            estado: "inscrito".to_string(),
            fecha_inscripcion,
            inscrito_por: datos.claims.id,
            mensaje: "Inscripción registrada correctamente".to_string(),
        }),
    ))
}