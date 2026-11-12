import { apiFetch } from "./api.js";

/**
 * Catálogo público de actividades con sus horarios vigentes.
 * GET /api/actividades
 * @returns {Promise<Array<{id, actividad, descripcion, dia_semana, hora_inicio, hora_fin, lugar, coach}>>}
 */
export function obtenerActividades() {
  return apiFetch("/api/actividades", {
    auth: false,
    mensajeError: "Error al consultar las actividades",
  });
}

/**
 * Agrupa las filas (una por horario) en actividades con su lista de horarios.
 */
export function agruparPorActividad(filas) {
  const mapa = new Map();

  for (const fila of filas) {
    if (!mapa.has(fila.id)) {
      mapa.set(fila.id, {
        id: fila.id,
        actividad: fila.actividad,
        descripcion: fila.descripcion,
        horarios: [],
      });
    }
    mapa.get(fila.id).horarios.push(fila);
  }

  return [...mapa.values()];
}
