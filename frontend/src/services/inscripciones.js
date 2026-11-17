import { apiFetch } from "./api.js";

const API_URL = "/api/recepcion";

/**
 * Da de alta un nuevo socio (solo recepcionista/administrador).
 * POST /api/auth/register
 * @param {{nombre: string, apellido_p: string, correo: string, password: string}} datos
 * @returns {Promise<{id, nombre, correo, rol}>} Usuario creado
 */
export function registrarSocio(datos) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: datos,
    mensajeError: "No se pudo dar de alta al socio",
  });
}

/**
 * Busca socios por nombre o número de socio.
 * GET /api/recepcion/socios?q=<texto>
 * @param {string} texto - Término de búsqueda
 * @returns {Promise<Array>} Lista de socios que coinciden
 */
export function buscarSocios(texto) {
  return apiFetch(`${API_URL}/socios?q=${encodeURIComponent(texto)}`, {
    mensajeError: "Error al buscar socios",
  });
}

/**
 * Obtiene las sesiones disponibles para inscripción.
 * GET /api/recepcion/actividades
 * @returns {Promise<Array>} Lista de sesiones disponibles
 */
export function obtenerSesiones() {
  return apiFetch(`${API_URL}/actividades`, {
    mensajeError: "Error al obtener las sesiones",
  });
}

/**
 * Registra la inscripción de un socio en una sesión.
 * POST /api/recepcion/inscripciones
 * @param {number} socioId   - ID del socio
 * @param {number} sesionId  - ID de la sesión
 * @returns {Promise<Object>} Respuesta del servidor con el ID de la inscripción
 */
export function registrarInscripcion(socioId, sesionId) {
  return apiFetch(`${API_URL}/inscripciones`, {
    method: "POST",
    body: {
      socio_id: socioId,
      sesion_id: Number(sesionId),
      tipo_acceso: "membresia",
    },
    mensajeError: "Error al registrar la inscripción",
  });
}

/**
 * Obtiene los planes y precios disponibles para dar de alta socios.
 * GET /api/recepcion/planes
 */
export function obtenerPlanes() {
  return apiFetch(`${API_URL}/planes`, {
    mensajeError: "Error al obtener los planes y precios",
  });
}
