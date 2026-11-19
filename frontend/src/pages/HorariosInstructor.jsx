import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import HorarioSemanal, { obtenerInicioSemana, sumarDias } from "../components/HorarioSemanal.jsx";
import { menus } from "../components/menus.js";
import { obtenerSesionesInstructor } from "../services/asistencias.js";
import { parsearFechaPg } from "../utils/formato.js";
import { aISO } from "../utils/fechas.js";
import "../assets/MiHorario.css";

const { nombre: rol, opciones } = menus.instructor;

// Vista semanal de las sesiones del instructor. Solo se pide al backend la
// semana visible; las sesiones canceladas se muestran marcadas.
export default function HorariosInstructor() {
  const [semana, setSemana] = useState(() => obtenerInicioSemana(new Date()));
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setError("");
    obtenerSesionesInstructor({
      desde: aISO(semana),
      hasta: aISO(sumarDias(semana, 6)),
    })
      .then((datos) => activo && setSesiones(Array.isArray(datos) ? datos : []))
      .catch((err) => activo && setError(err.message || "No fue posible cargar tus horarios."))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [semana]);

  const eventos = useMemo(
    () =>
      sesiones.map((s) => ({
        id: s.sesion_id,
        titulo: s.actividad,
        inicio: parsearFechaPg(s.inicio_iso),
        fin: parsearFechaPg(s.fin_iso),
        cancelada: s.estado_tiempo === "cancelada",
        detalles: s.lugar ? [s.lugar] : [],
      })),
    [sesiones]
  );

  return (
    <DashboardLayout titulo="Mis horarios" rol={rol} opciones={opciones}>
      <section className="mi-horario">
        <header className="mi-horario-encabezado">
          <span className="mi-horario-etiqueta">PANEL DE INSTRUCTOR</span>
          <p>Consulta los días y horarios de las sesiones que impartes.</p>
        </header>

        <HorarioSemanal
          semana={semana}
          onCambiarSemana={setSemana}
          eventos={eventos}
          cargando={cargando}
          error={error}
          textoCargando="Cargando tus horarios..."
          textoError="No fue posible cargar tus horarios"
          textoVacio="No tienes sesiones esta semana"
          detalleVacio="Prueba consultando otra semana."
        />
      </section>
    </DashboardLayout>
  );
}
