import { apiFetch } from "./api.js";

const API_URL = "/api/instructor";

/**
 * Sesiones vigentes (en curso y próximas) del instructor autenticado.
 * GET /api/instructor/sesiones
 */
export function obtenerSesionesInstructor() {
  return apiFetch(`${API_URL}/sesiones`, {
    mensajeError: "No se pudieron obtener tus sesiones",
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