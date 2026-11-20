import { useEffect, useRef } from "react";
import {
  obtenerActividadesInstructor,
  obtenerSesionInstructor,
  obtenerSesionesInstructor,
} from "../services/asistencias.js";
import { useSesionesSemana } from "./useSesionesSemana.js";

const sinCanceladas = (s) => s.estado_tiempo !== "cancelada";

// Sesiones del instructor cargadas por semana (sin canceladas, refresco cada 30 s).
// Si al abrir la pantalla el `sesionId` de la URL pertenece a otra semana,
// salta a esa semana (solo en la primera carga; después la navegación la
// controla el selector).
export function useSesionesInstructorSemana(sesionId) {
  const datos = useSesionesSemana({
    cargarSesiones: obtenerSesionesInstructor,
    cargarClases: obtenerActividadesInstructor,
    filtrar: sinCanceladas,
    intervalo: 30000,
  });
  const { listo, sesiones, irAFecha } = datos;

  const revisado = useRef(false);
  useEffect(() => {
    if (!listo || revisado.current) return;
    revisado.current = true;
    if (!sesionId || sesiones.some((s) => String(s.sesion_id) === sesionId)) return;

    obtenerSesionInstructor(sesionId)
      .then((detalle) => detalle?.fecha && irAFecha(detalle.fecha))
      .catch(() => {});
  }, [listo, sesionId, sesiones, irAFecha]);

  return datos;
}
