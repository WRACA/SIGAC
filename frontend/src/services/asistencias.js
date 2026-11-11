const API_URL = "/api/instructor";

function getToken() {
  return localStorage.getItem("token");
}

async function obtenerMensajeError(respuesta, mensajePorDefecto) {
  const texto = await respuesta.text().catch(() => "");
  if (!texto) return mensajePorDefecto;

  try {
    const json = JSON.parse(texto);
    return json.mensaje || json.error || mensajePorDefecto;
  } catch {
    return texto;
  }
}

/**
 * Consulta las asistencias o inscripciones de una clase.
 * @param {number|string} claseId - ID de la sesión
 * @returns {Promise<Array>} Lista de inscritos con estado
 */
export async function obtenerAsistencias(claseId) {
  const token = getToken();

  const respuesta = await fetch(`${API_URL}/sesiones/${claseId}/inscritos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      await obtenerMensajeError(
        respuesta,
        "No fue posible consultar las asistencias de la clase."
      )
    );
  }

  const inscritos = await respuesta.json();
  // Formatear al formato que espera PaseLista: { socioId, nombre, registrada: estado === 'asistio' }
  return (Array.isArray(inscritos) ? inscritos : [])
    .filter((socio) => socio.estado === "asistio")
    .map((socio) => ({
      socioId: String(socio.id),
      fecha: new Date().toISOString(),
    }));
}

/**
 * Registra la asistencia de un socio a la clase en el backend.
 * PATCH /api/instructor/asistencia
 * @param {number|string} claseId - ID de la sesión
 * @param {number|string} socioId - ID del socio
 * @returns {Promise<Object>}
 */
export async function registrarAsistencia(claseId, socioId) {
  const token = getToken();

  const respuesta = await fetch(`${API_URL}/asistencia`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sesion_id: Number(claseId),
      socio_id: Number(socioId),
    }),
  });

  if (!respuesta.ok) {
    throw new Error(
      await obtenerMensajeError(
        respuesta,
        "No fue posible registrar la asistencia."
      )
    );
  }

  return {
    socioId: String(socioId),
    fecha: new Date().toISOString(),
  };
}
