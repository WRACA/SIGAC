const API_URL = "/api/instructor";

// Obtiene el token JWT almacenado en localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Extrae el mensaje de error ya sea texto plano (Axum ApiError) o JSON
async function obtenerMensajeError(respuesta, mensajePorDefecto) {
  const texto = await respuesta.text().catch(() => "");
  if (!texto) return mensajePorDefecto;

  try {
    const json = JSON.parse(texto);
    return json.mensaje || json.error || mensajePorDefecto;
  } catch {
    return texto;
  }
}

/**
 * Consulta las clases/sesiones asignadas al instructor autenticado.
 * GET /api/instructor/sesiones
 * @returns {Promise<Array>} Lista de clases ordenadas cronológicamente
 */
export async function obtenerClasesInstructor() {
  const token = getToken();

  const respuesta = await fetch(`${API_URL}/sesiones`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      await obtenerMensajeError(
        respuesta,
        "No fue posible consultar las clases asignadas."
      )
    );
  }

  return respuesta.json();
}

/**
 * Consulta los detalles completos de una clase/sesión asignada al instructor.
 * GET /api/instructor/sesiones/{id}
 * @param {number|string} sesionId - ID de la sesión
 * @returns {Promise<Object>} Detalle de la sesión con lista de socios inscritos
 */
export async function obtenerDetalleClase(sesionId) {
  const token = getToken();

  const respuesta = await fetch(`${API_URL}/sesiones/${sesionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      await obtenerMensajeError(
        respuesta,
        "No fue posible consultar los detalles de la clase."
      )
    );
  }

  return respuesta.json();
}

