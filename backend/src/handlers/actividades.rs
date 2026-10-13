use axum::{
    extract::State,
    http::StatusCode,
    Json,
};

use crate::{AppState, models::Actividad};

pub async fn listar_actividades(
    State(state): State<AppState>,
) -> Result<Json<Vec<Actividad>>, (StatusCode, String)> {

    let actividades = sqlx::query_as::<_, Actividad>(
        r#"
        SELECT
            a.id,
            a.nombre AS actividad,
            a.descripcion,
            h.dia_semana,
            h.hora_inicio::text AS hora_inicio,
            h.hora_fin::text AS hora_fin,
            h.lugar,
            CONCAT_WS(' ', c.nombre, c.apellido_p, c.apellido_m) AS coach
        FROM actividad a
        JOIN horario_actividad h
            ON a.id = h.actividad_id
        JOIN vista_coaches_publico c
            ON h.coach_id = c.coach_id
        WHERE a.eliminado_en IS NULL
          AND h.vigente = TRUE
        ORDER BY a.nombre, h.dia_semana, h.hora_inicio
        "#
    )
    .fetch_all(&state.public_pool)
    .await
    .map_err(|e| {
        eprintln!("Error consultando actividades: {e}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Error al consultar las actividades".to_string(),
        )
    })?;

    Ok(Json(actividades))
}