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
