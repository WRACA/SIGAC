// Utilidades de fechas locales en formato "YYYY-MM-DD" (sin zona horaria).

const dosDigitos = (n) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DD" usando la fecha local
export function aISO(fecha) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(
    fecha.getDate()
  )}`;
}

// "YYYY-MM-DD" -> Date local a medianoche
export function desdeISO(iso) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function hoyISO() {
  return aISO(new Date());
}

export function sumarDias(iso, dias) {
  const d = desdeISO(iso);
  d.setDate(d.getDate() + dias);
  return aISO(d);
}

// Lunes de la semana que contiene la fecha
export function inicioSemana(iso) {
  const dia = desdeISO(iso).getDay(); // 0 = domingo
  return sumarDias(iso, dia === 0 ? -6 : 1 - dia);
}

// Domingo de la semana que contiene la fecha
export function finSemana(iso) {
  return sumarDias(inicioSemana(iso), 6);
}

// Celdas de un mes en cuadrícula lunes–domingo.
// Devuelve fechas ISO o null para el relleno antes del día 1 y después del último.
export function diasDelMes(anio, mes) {
  const primero = new Date(anio, mes, 1);
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const relleno = (primero.getDay() + 6) % 7; // lunes = 0

  const celdas = Array(relleno).fill(null);
  for (let dia = 1; dia <= totalDias; dia++) {
    celdas.push(aISO(new Date(anio, mes, dia)));
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}
