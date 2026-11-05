// Obtiene el token JWT almacenado en localStorage
function getToken() {
  return localStorage.getItem("token");
}

/**
 * Busca socios por nombre o número de socio.
 * GET /api/recepcion/socios?q=<texto>
 * @param {string} texto - Término de búsqueda
 * @returns {Promise<Array>} Lista de socios que coinciden
 */
export async function buscarSocios(texto) {
  const respuesta = await fetch(
    `/api/recepcion/socios?q=${encodeURIComponent(texto)}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}));
    throw new Error(error.mensaje || "Error al buscar socios");
  }

  return respuesta.json();
}

/**
 * Obtiene las sesiones disponibles para inscripción.
 * GET /api/recepcion/actividades
 * @returns {Promise<Array>} Lista de sesiones disponibles
 */
export async function obtenerSesiones() {
  const respuesta = await fetch("/api/recepcion/actividades", {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}));
    throw new Error(error.mensaje || "Error al obtener las sesiones");
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
  const respuesta = await fetch("/api/recepcion/inscripciones", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      socio_id: socioId,
      sesion_id: sesionId,
      tipo_acceso: "membresia",
    }),
  });

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}));
    throw new Error(error.mensaje || "Error al registrar la inscripción");
  }

  return respuesta.json();
}
