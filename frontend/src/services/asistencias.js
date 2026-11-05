
// Datos de prueba para el pase de lista.
// Posteriormente se obtendrán desde el backend.

const asistenciasPorClase = {
  1: [],
  2: [],
  3: [],
  4: [],
};

// Consulta las asistencias registradas de una clase.
export async function obtenerAsistencias(claseId) {
  return asistenciasPorClase[claseId] || [];
}

// Registra la asistencia de un socio.
export async function registrarAsistencia(claseId, socioId) {
  const asistencias = asistenciasPorClase[claseId];

  if (!asistencias) {
    throw new Error("La clase seleccionada no existe.");
  }

  const yaRegistrada = asistencias.some(
    (asistencia) => asistencia.socioId === socioId
  );

  if (yaRegistrada) {
    throw new Error("La asistencia ya fue registrada.");
  }

  const nuevaAsistencia = {
    socioId,
    fecha: new Date().toISOString(),
  };

  asistencias.push(nuevaAsistencia);

  return nuevaAsistencia;
}
