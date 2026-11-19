/**
 * Utilidades para cálculo de estado temporal y ordenamiento prioritario de clases.
 */

/**
 * Convierte una fecha y hora o string ISO de una clase en un objeto Date válido.
 * @param {string} fechaStr - Fecha YYYY-MM-DD
 * @param {string} horaStr - Hora HH:MM
 * @param {string} [isoStr] - Timestamp ISO opcional
 * @returns {Date}
 */
export function parsearFechaHora(fechaStr, horaStr, isoStr) {
  if (isoStr) {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
  }
  if (fechaStr && horaStr) {
    // Si viene fecha YYYY-MM-DD y hora HH:MM
    const [año, mes, dia] = fechaStr.split("-").map(Number);
    const [hora, min] = horaStr.split(":").map(Number);
    return new Date(año, (mes || 1) - 1, dia || 1, hora || 0, min || 0, 0);
  }
  if (fechaStr) {
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Determina el estado temporal de una clase con base en la hora actual:
 * - 'cancelada': Si el estado en BD es cancelada
 * - 'en_curso': Si ahora >= inicio y ahora < fin
 * - 'proxima': Si ahora < inicio
 * - 'finalizada': Si ahora >= fin
 *
 * @param {Object} clase
 * @param {Date} [ahora=new Date()]
 * @returns {'en_curso' | 'proxima' | 'finalizada' | 'cancelada'}
 */
export function obtenerEstadoTiempoClase(clase, ahora = new Date()) {
  if (!clase) return "finalizada";
  if (clase.estado === "cancelada") return "cancelada";

  const fechaInicio = parsearFechaHora(clase.fecha, clase.hora_inicio, clase.inicio_iso);
  const fechaFin = parsearFechaHora(clase.fecha, clase.hora_fin, clase.fin_iso);

  const ahoraMs = ahora.getTime();
  const inicioMs = fechaInicio.getTime();
  const finMs = fechaFin.getTime();

  if (ahoraMs >= inicioMs && ahoraMs < finMs) {
    return "en_curso";
  } else if (ahoraMs < inicioMs) {
    return "proxima";
  } else {
    return "finalizada";
  }
}

/**
 * Ordena un arreglo de clases aplicando la priorización automática:
 * 1. Clases en curso van al principio del listado.
 * 2. Si hay múltiples clases simultáneas en curso, se ordenan entre sí por hora de inicio.
 * 3. Las demás clases mantienen un orden cronológico coherente (de más próximas a posteriores / finalizadas).
 *
 * @param {Array} clases - Lista de clases
 * @param {Date} [ahora=new Date()] - Fecha/hora de referencia
 * @returns {Array} Nueva lista ordenada con estado_tiempo actualizado
 */
export function ordenarClasesPriorizadas(clases, ahora = new Date()) {
  if (!Array.isArray(clases)) return [];

  // Mapeamos para garantizar que cada clase tenga su estado_tiempo actualizado en tiempo real
  const clasesConEstado = clases.map((clase) => {
    const estadoTiempoCalculado = obtenerEstadoTiempoClase(clase, ahora);
    return {
      ...clase,
      estado_tiempo: estadoTiempoCalculado,
    };
  });

  return clasesConEstado.sort((a, b) => {
    const esEnCursoA = a.estado_tiempo === "en_curso";
    const esEnCursoB = b.estado_tiempo === "en_curso";

    // 1. Clases en curso primero
    if (esEnCursoA && !esEnCursoB) return -1;
    if (!esEnCursoA && esEnCursoB) return 1;

    // 2. Si ambas están en curso, se desempatan por hora de inicio
    const fechaInicioA = parsearFechaHora(a.fecha, a.hora_inicio, a.inicio_iso).getTime();
    const fechaInicioB = parsearFechaHora(b.fecha, b.hora_inicio, b.inicio_iso).getTime();

    if (esEnCursoA && esEnCursoB) {
      return fechaInicioA - fechaInicioB;
    }

    // 3. Para las demás clases:
    // Agrupar 'proxima' antes de 'finalizada'/'cancelada', y ordenar cronológicamente
    const prioridadGrupo = (c) => {
      if (c.estado_tiempo === "proxima") return 1;
      if (c.estado_tiempo === "finalizada") return 2;
      return 3; // cancelada
    };

    const grupoA = prioridadGrupo(a);
    const grupoB = prioridadGrupo(b);

    if (grupoA !== grupoB) {
      return grupoA - grupoB;
    }

    // Dentro del mismo grupo, orden cronológico de inicio
    return fechaInicioA - fechaInicioB;
  });
}

/**
 * Formatea una fecha YYYY-MM-DD en español legible (ej. "Martes, 10 de nov de 2026")
 */
export function formatearFecha(fechaStr) {
  if (!fechaStr) return "Fecha no disponible";
  try {
    const partes = fechaStr.split("-");
    if (partes.length === 3) {
      const fecha = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
      );
      return fecha.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return fechaStr;
  }
}

/**
 * Formatea una hora HH:MM[:SS] a formato de 24 horas (ej. "08:00", "17:30")
 */
export function formatearHora(horaStr) {
  if (!horaStr) return "";
  const [h, m] = horaStr.split(":");
  if (h === undefined || m === undefined) return horaStr;
  return `${h.padStart(2, "0")}:${m.slice(0, 2)}`;
}

