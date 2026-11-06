const API_URL = "/api/recepcion";

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
 * Busca socios por nombre o número de socio.
 * GET /api/recepcion/socios?q=<texto>
 * @param {string} texto - Término de búsqueda
 * @returns {Promise<Array>} Lista de socios que coinciden
 */
export async function buscarSocios(texto) {
  const respuesta = await fetch(
    `${API_URL}/socios?q=${encodeURIComponent(texto)}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  if (!respuesta.ok) {
    throw new Error(
      await obtenerMensajeError(respuesta, "Error al buscar socios")
    );
  }

  return respuesta.json();
}

/**
 * Obtiene las sesiones disponibles para inscripción.
 * GET /api/recepcion/actividades
 * @returns {Promise<Array>} Lista de sesiones disponibles
 */
export async function obtenerSesiones() {
  const respuesta = await fetch(`${API_URL}/actividades`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      await obtenerMensajeError(respuesta, "Error al obtener las sesiones")
    );
  }

  return respuesta.json();
}

/**
 * Registra la inscripción de un socio en una sesión.
 * POST /api/recepcion/inscripciones
 * @param {number} socioId   - ID del socio
 * @param {number} sesionId  - ID de la sesión
 * @returns {Promise<Object>} Respuesta del servidor con el ID de la inscripción
 */
export async function registrarInscripcion(socioId, sesionId) {
  const respuesta = await fetch(`${API_URL}/inscripciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      socio_id: socioId,
      sesion_id: Number(sesionId),
      tipo_acceso: "membresia",
    }),
  });

  if (!respuesta.ok) {
    throw new Error(
      await obtenerMensajeError(respuesta, "Error al registrar la inscripción")
    );
  }

  return respuesta.json();
}
