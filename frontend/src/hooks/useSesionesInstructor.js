import { useEffect, useState } from "react";
import { obtenerSesionesInstructor } from "../services/asistencias.js";
import { formatearFecha, formatearHora } from "../utils/formato.js";

// Carga las sesiones vigentes del instructor autenticado.
export function useSesionesInstructor() {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerSesionesInstructor()
      .then((datos) => activo && setSesiones(Array.isArray(datos) ? datos : []))
      .catch((err) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  return { sesiones, cargando, error };
}

// Texto corto para identificar una sesión en un selector
export function etiquetaSesion(sesion) {
  const enCurso = sesion.en_curso ? " · EN CURSO" : "";
  return `${sesion.actividad} — ${formatearFecha(sesion.fecha)} ${formatearHora(
    sesion.hora_inicio
  )}–${formatearHora(sesion.hora_fin)}${enCurso}`;
}
