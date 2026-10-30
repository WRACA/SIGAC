const API_URL = "/api";

// Busca socios por nombre o número.
// El endpoint debe implementarse en el backend.
export async function buscarSocios(texto) {
  const respuesta = await fetch(
    `${API_URL}/socios?busqueda=${encodeURIComponent(texto)}`
  );

  if (!respuesta.ok) {
    throw new Error("No fue posible buscar socios.");
  }

  return respuesta.json();
}

// Obtiene las actividades disponibles.
// El endpoint debe implementarse en el backend.
export async function obtenerActividades() {
  const respuesta = await fetch(`${API_URL}/actividades`);

  if (!respuesta.ok) {
    throw new Error("No fue posible cargar las actividades.");
  }

  return respuesta.json();
}

// Registra una inscripción.
// El endpoint debe implementarse en el backend.
export async function registrarInscripcion(socioId, actividadId) {
  const respuesta = await fetch(`${API_URL}/inscripciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      socio_id: socioId,
      actividad_id: Number(actividadId),
    }),
  });

  if (!respuesta.ok) {
    const error = await respuesta.text();
    throw new Error(error || "No fue posible registrar la inscripción.");
  }

  return respuesta.json();
}
