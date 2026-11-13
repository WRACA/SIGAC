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
    models::CredencialQr,
    qr,
};

// GET /api/socio/credencial-qr
// Devuelve únicamente el contenido del QR de la credencial activa del socio autenticado.
pub async fn obtener_credencial_qr(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<CredencialQr>, ApiError> {

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

    // 4. Buscar la credencial activa del socio del JWT (nunca de otro socio)
    let token_qr = sqlx::query_scalar::<_, String>(
        r#"
        SELECT c.token::text
        FROM credencial_qr c
        JOIN socio s ON s.id = c.socio_id
        JOIN usuario u ON u.id = s.usuario_id
        WHERE u.id = $1
          AND u.rol = 'socio'
          AND u.activo = TRUE
          AND c.estado = 'activa'
        "#
    )
    .bind(datos.claims.id)
    .fetch_optional(&state.api_pool)
    .await
    .map_err(error_interno)?;

    // 5. Rechazar credenciales inexistentes, inactivas o revocadas
    let Some(token_qr) = token_qr else {
        return Err((
            StatusCode::NOT_FOUND,
            "No tienes una credencial QR activa. Acude a recepción para solicitarla".to_string(),
        ));
    };

    // 6. Devolver solo el contenido del QR (SIGAC:SOCIO:1:<UUID>)
    Ok(Json(CredencialQr {
        contenido: qr::generar_contenido(&token_qr),
    }))
}
