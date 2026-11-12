// Funciones de formato compartidas por las vistas.

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// 1 = lunes ... 7 = domingo
export function nombreDia(numero) {
  return DIAS[numero] || "";
}

// "08:00:00" -> "08:00"
export function formatearHora(hora) {
  if (!hora) return "";
  return hora.slice(0, 5);
}

// "2026-11-11" -> "mié 11 nov 2026"
export function formatearFecha(fecha) {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const d = new Date(anio, mes - 1, dia);
  return d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Convierte un timestamptz de PostgreSQL ("2026-11-11 08:00:00-06") a Date
// de forma compatible con todos los navegadores (Safari no acepta el formato original).
export function parsearFechaPg(valor) {
  if (!valor) return new Date(NaN);
  return new Date(
    valor
      .replace(" ", "T")
      .replace(/(\.\d{3})\d+/, "$1")
      .replace(/([+-]\d{2})$/, "$1:00")
  );
}

// Fecha/hora de PostgreSQL -> texto legible
export function formatearFechaHora(valor) {
  if (!valor) return "";
  const d = parsearFechaPg(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Une nombre y apellidos ignorando vacíos
export function nombreCompleto({ nombre, apellido_p, apellido_m } = {}) {
  return [nombre, apellido_p, apellido_m].filter(Boolean).join(" ");
}

// Textos legibles para el estado de una inscripción
export const ESTADO_INSCRIPCION = {
  inscrito: "Pendiente",
  asistio: "Asistió",
  falta: "Falta",
  cancelada: "Cancelada",
};
