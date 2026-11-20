import { apiFetch, parametrosRango } from "./api.js";

const API_URL = "/api/instructor";

/**
 * Sesiones del instructor autenticado (en curso, próximas, finalizadas y canceladas).
 * GET /api/instructor/sesiones[?desde=YYYY-MM-DD&hasta=YYYY-MM-DD]
 * @param {{desde?: string, hasta?: string}} [rango] - Fechas locales opcionales
 */
export function obtenerSesionesInstructor(rango) {
  return apiFetch(`${API_URL}/sesiones${parametrosRango(rango)}`, {
    mensajeError: "No se pudieron obtener tus sesiones",
  });
}

/**
 * Clases (actividades) del instructor con el día sugerido al elegirlas.
 * GET /api/instructor/clases
 * @returns {Promise<Array<{actividad: string, fecha_sugerida: string}>>}
 */
export function obtenerActividadesInstructor() {
  return apiFetch(`${API_URL}/clases`, {
    mensajeError: "No se pudieron obtener tus clases",
  });
}

/**
 * Detalle de una sesión del instructor (se usa para conocer su fecha).
 * GET /api/instructor/sesiones/{id}
 */
export function obtenerSesionInstructor(sesionId) {
  return apiFetch(`${API_URL}/sesiones/${encodeURIComponent(sesionId)}`, {
    mensajeError: "No se pudo obtener la sesión",
  });
}

/**
 * Socios inscritos en una sesión del instructor.
 * GET /api/instructor/sesiones/{id}/inscritos
 */
export function obtenerInscritos(sesionId) {
  return apiFetch(`${API_URL}/sesiones/${encodeURIComponent(sesionId)}/inscritos`, {
    mensajeError: "No se pudieron obtener los inscritos",
  });
}

/**
 * Registra la asistencia de un socio en una sesión.
 * PATCH /api/instructor/asistencia
 * @param {number} sesionId
 * @param {number} socioId - ID interno del socio (socio.id)
 */
export function registrarAsistencia(sesionId, socioId) {
  return apiFetch(`${API_URL}/asistencia`, {
    method: "PATCH",
    body: {
      sesion_id: Number(sesionId),
      socio_id: Number(socioId),
    },
    mensajeError: "No se pudo registrar la asistencia",
  });
}

/**
 * Registra la asistencia mediante el escaneo de una credencial QR.
 * POST /api/instructor/asistencia/qr
 * @param {number} sesionId
 * @param {string} contenido - Contenido leído del código QR.
 */
export function registrarAsistenciaQR(sesionId, contenido) {
  return apiFetch("/api/instructor/asistencia/qr", {
    method: "POST",
    body: {
      sesion_id: Number(sesionId),
      contenido,
    },
    mensajeError: "No se pudo registrar la asistencia mediante QR",
  });
}