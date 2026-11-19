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

  const cargarSesiones = async () => {
    try {
      const datos = await obtenerSesionesInstructor();

      if (!activo) return;

      const vigentes = (Array.isArray(datos) ? datos : []).filter(
        (s) => s.estado_tiempo === "en_curso" || s.estado_tiempo === "proxima"
      );

      setSesiones(vigentes);
      setError("");
    } catch (err) {
      if (activo) setError(err.message);
    } finally {
      if (activo) setCargando(false);
    }
  };

  cargarSesiones();

  const intervalo = window.setInterval(cargarSesiones, 30000);

  return () => {
    activo = false;
    window.clearInterval(intervalo);
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
