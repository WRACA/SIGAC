import { apiFetch } from "./api.js";

/**
 * Perfil del socio autenticado.
 * GET /api/socio/perfil
 */
export function obtenerPerfil() {
  return apiFetch("/api/socio/perfil", {
    mensajeError: "No se pudo obtener el perfil",
  });
}

/**
 * Credencial QR activa del socio autenticado.
 * GET /api/socio/credencial-qr -> { contenido: "SIGAC:SOCIO:1:<UUID>" }
 */
export function obtenerCredencialQR() {
  return apiFetch("/api/socio/credencial-qr", {
    mensajeError: "No se pudo obtener tu credencial QR",
  });
}

/**
 * Obtiene las inscripciones del socio autenticado.
 * GET /api/socio/inscripciones
 */
export function obtenerMisInscripciones() {
  return apiFetch("/api/socio/inscripciones", {
    mensajeError: "No se pudieron obtener tus inscripciones",
  });
}