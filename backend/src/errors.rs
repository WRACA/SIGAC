use axum::http::StatusCode;

// definimos un tipo para nuestros errores que se componen de un codigo http y una cadena
pub type ApiError = (StatusCode, String);

// ---------- Función auxiliar para errores de base de datos ----------
pub fn error_interno(e: sqlx::Error) -> ApiError {
    eprintln!("Error de base de datos: {e}"); // lo vemos en la terminal
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Error interno del servidor".to_string(),
    )
}