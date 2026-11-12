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
      .then((datos) => {
        if (!activo) return;
        // El backend devuelve todas las sesiones; aquí solo interesan las vigentes
        const vigentes = (Array.isArray(datos) ? datos : []).filter(
          (s) => s.estado_tiempo === "en_curso" || s.estado_tiempo === "proxima"
        );
        setSesiones(vigentes);
      })
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
