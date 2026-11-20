use sqlx::PgPool;

// Cierra las sesiones ya terminadas antes de responder consultas que muestran estados:
//   1. Las inscripciones que siguen en 'inscrito' en sesiones terminadas (no canceladas)
//      pasan a 'falta'.
//   2. Las sesiones terminadas que siguen 'programada' o 'en_curso' pasan a 'realizada'.
//
// Es a mejor esfuerzo: si alguna sentencia falla (p. ej. por permisos del usuario de BD),
// se registra en consola y la consulta que la llamó responde normalmente.
// Las sentencias son independientes para que un fallo en la segunda no afecte a la primera.
pub async fn cerrar_sesiones_terminadas(pool: &PgPool) {
    let faltas = sqlx::query(
        r#"
        UPDATE inscripcion i
        SET estado = 'falta'
        FROM sesion s
        WHERE i.sesion_id = s.id
          AND i.estado = 'inscrito'
          AND s.estado <> 'cancelada'
          AND s.fin <= statement_timestamp()
        "#,
    )
    .execute(pool)
    .await;

    if let Err(e) = faltas {
        eprintln!("No se pudieron marcar las faltas de sesiones terminadas: {e}");
    }

    let realizadas = sqlx::query(
        r#"
        UPDATE sesion
        SET estado = 'realizada'
        WHERE estado IN ('programada', 'en_curso')
          AND fin <= statement_timestamp()
        "#,
    )
    .execute(pool)
    .await;

    if let Err(e) = realizadas {
        eprintln!("No se pudieron marcar las sesiones terminadas como realizadas: {e}");
    }
}
