import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerActividades } from "../services/actividades.js";
import { formatearHora, nombreDia } from "../utils/formato.js";
import "../assets/SociosInscritos.css";

const { nombre: rol, opciones } = menus.socio;

export default function HorariosSocio() {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerActividades()
      .then((datos) => activo && setHorarios(Array.isArray(datos) ? datos : []))
      .catch((err) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  // Agrupar por día de la semana (1 = lunes ... 7 = domingo)
  const porDia = useMemo(() => {
    const grupos = new Map();
    for (const h of horarios) {
      if (!grupos.has(h.dia_semana)) grupos.set(h.dia_semana, []);
      grupos.get(h.dia_semana).push(h);
    }
    return [...grupos.entries()]
      .sort(([a], [b]) => a - b)
      .map(([dia, lista]) => [
        dia,
        lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
      ]);
  }, [horarios]);

  return (
    <DashboardLayout titulo="Horarios" rol={rol} opciones={opciones}>
      <section className="socios-inscritos">
        <div className="socios-inscritos-encabezado">
          <span className="socios-inscritos-etiqueta">CALENDARIO SEMANAL</span>
          <h2>Horarios de actividades</h2>
          <p>Consulta los horarios vigentes de todas las actividades del club.</p>
        </div>

        {cargando && <p className="dashboard-cargando">Cargando horarios...</p>}
        {error && <p className="dashboard-error">{error}</p>}
        {!cargando && !error && porDia.length === 0 && (
          <p className="socios-inscritos-vacio">No hay horarios publicados.</p>
        )}

        {porDia.map(([dia, lista]) => (
          <div className="socios-inscritos-panel" key={dia}>
            <h3>{nombreDia(dia)}</h3>
            <div className="socios-inscritos-tabla-contenedor">
              <table className="socios-inscritos-tabla">
                <thead>
                  <tr>
                    <th>Horario</th>
                    <th>Actividad</th>
                    <th>Instructor</th>
                    <th>Lugar</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((h) => (
                    <tr key={`${h.id}-${h.dia_semana}-${h.hora_inicio}`}>
                      <td>
                        {formatearHora(h.hora_inicio)} – {formatearHora(h.hora_fin)}
                      </td>
                      <td>{h.actividad}</td>
                      <td>{h.coach}</td>
                      <td>{h.lugar || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </DashboardLayout>
  );
}
