// Formato estándar de las credenciales QR de SIGAC.
//
// Contenido del QR: SIGAC:SOCIO:1:<UUID>
//   - SIGAC  -> sistema
//   - SOCIO  -> tipo de credencial
//   - 1      -> versión del formato
//   - UUID   -> token aleatorio guardado en credencial_qr.token
//
// El contenido no incluye datos personales ni identificadores secuenciales.

use sqlx::PgPool;

pub const PREFIJO_QR_SOCIO: &str = "SIGAC:SOCIO:1:";

/// Construye el contenido del QR a partir del token UUID.
#[allow(dead_code)]
pub fn generar_contenido(token: &str) -> String {
    format!("{PREFIJO_QR_SOCIO}{token}")
}

/// Recupera el token UUID a partir del contenido leído del QR.
/// Devuelve `None` si el sistema, tipo o versión no coinciden o si el UUID no es válido.
#[allow(dead_code)]
pub fn extraer_token(contenido: &str) -> Option<&str> {
    let token = contenido.trim().strip_prefix(PREFIJO_QR_SOCIO)?;
    es_uuid(token).then_some(token)
}

/// Busca el socio dueño de una credencial QR.
/// Solo las credenciales con estado 'activa' son válidas; las inactivas o revocadas devuelven `None`.
#[allow(dead_code)]
pub async fn buscar_socio_por_qr(pool: &PgPool, contenido: &str) -> Result<Option<i32>, sqlx::Error> {
    let Some(token) = extraer_token(contenido) else {
        return Ok(None);
    };

    sqlx::query_scalar::<_, i32>(
        r#"
        SELECT socio_id
        FROM credencial_qr
        WHERE token = $1::uuid
          AND estado = 'activa'
        "#
    )
    .bind(token)
    .fetch_optional(pool)
    .await
}

// Valida la forma canónica de un UUID: 8-4-4-4-12 caracteres hexadecimales.
fn es_uuid(valor: &str) -> bool {
    valor.len() == 36
        && valor.char_indices().all(|(i, c)| match i {
            8 | 13 | 18 | 23 => c == '-',
            _ => c.is_ascii_hexdigit(),
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    const UUID: &str = "3f2b8c1e-9a4d-4e7b-8c2f-1a2b3c4d5e6f";

    #[test]
    fn genera_formato_estandar() {
        assert_eq!(
            generar_contenido(UUID),
            "SIGAC:SOCIO:1:3f2b8c1e-9a4d-4e7b-8c2f-1a2b3c4d5e6f"
        );
    }

    #[test]
    fn recupera_el_token_del_contenido() {
        let contenido = generar_contenido(UUID);
        assert_eq!(extraer_token(&contenido), Some(UUID));
        assert_eq!(extraer_token(&format!("  {contenido}\n")), Some(UUID));
    }

    #[test]
    fn rechaza_sistema_tipo_o_version_incorrectos() {
        assert_eq!(extraer_token(&format!("OTRO:SOCIO:1:{UUID}")), None);
        assert_eq!(extraer_token(&format!("SIGAC:COACH:1:{UUID}")), None);
        assert_eq!(extraer_token(&format!("SIGAC:SOCIO:2:{UUID}")), None);
        assert_eq!(extraer_token(UUID), None);
    }

    #[test]
    fn rechaza_uuid_mal_formado() {
        assert_eq!(extraer_token("SIGAC:SOCIO:1:"), None);
        assert_eq!(extraer_token("SIGAC:SOCIO:1:123"), None);
        assert_eq!(extraer_token("SIGAC:SOCIO:1:3f2b8c1e9a4d4e7b8c2f1a2b3c4d5e6f"), None);
        assert_eq!(extraer_token("SIGAC:SOCIO:1:zf2b8c1e-9a4d-4e7b-8c2f-1a2b3c4d5e6f"), None);
        assert_eq!(extraer_token(&format!("SIGAC:SOCIO:1:{UUID}x")), None);
    }
}
