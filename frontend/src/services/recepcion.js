import { apiFetch } from "./api.js";

// Obtiene toda la información del panel de recepción
export function obtenerDashboardRecepcion() {
  return apiFetch("/api/recepcion/dashboard", {
    mensajeError: "No se pudo cargar el dashboard de recepción",
  });
}
