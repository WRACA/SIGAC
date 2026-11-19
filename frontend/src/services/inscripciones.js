import { apiFetch, parametrosRango } from "./api.js";

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
 * GET /api/recepcion/actividades[?desde=YYYY-MM-DD&hasta=YYYY-MM-DD]
 * @param {{desde?: string, hasta?: string}} [rango] - Fechas locales opcionales
 * @returns {Promise<Array>} Lista de sesiones disponibles
 */
export function obtenerSesiones(rango) {
  return apiFetch(`${API_URL}/actividades${parametrosRango(rango)}`, {
    mensajeError: "Error al obtener las sesiones",
  });
}

/**
 * Clases con sesiones disponibles y el día de su próxima sesión.
 * GET /api/recepcion/clases
 * @returns {Promise<Array<{actividad: string, fecha_sugerida: string}>>}
 */
export function obtenerClasesRecepcion() {
  return apiFetch(`${API_URL}/clases`, {
    mensajeError: "Error al obtener las clases",
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
 * Inscribe a un socio en una sesión a partir del contenido de su credencial QR.
 * POST /api/recepcionista/sesiones/{sesion_id}/inscripciones/qr
 * @param {number|string} sesionId - ID de la sesión seleccionada
 * @param {string} contenido - Texto leído del QR (SIGAC:SOCIO:1:<UUID>)
 * @returns {Promise<Object>} Inscripción creada, incluye `mensaje`
 */
export function inscribirPorQR(sesionId, contenido) {
  return apiFetch(`/api/recepcionista/sesiones/${sesionId}/inscripciones/qr`, {
    method: "POST",
    body: { contenido },
    mensajeError: "No se pudo inscribir al socio",
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
