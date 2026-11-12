import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerSesiones } from "../services/inscripciones.js";
import { formatearFechaHora, parsearFechaPg } from "../utils/formato.js";
import "../assets/SociosInscritos.css";

// Clase visual según los cupos restantes
function claseCupo(disponibles, cupo) {
  if (disponibles <= 0) return "error";
  if (disponibles / cupo <= 0.2) return "aviso";
  return "ok";
}

export default function SesionesRecepcion() {
  const { nombre: rol, opciones } = menus.recepcionista;

  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerSesiones()
      .then((datos) => activo && setSesiones(Array.isArray(datos) ? datos : []))
      .catch((err) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return sesiones;
    return sesiones.filter(
      (s) =>
        s.actividad.toLowerCase().includes(q) ||
        s.coach.toLowerCase().includes(q) ||
        (s.lugar || "").toLowerCase().includes(q)
    );
  }, [sesiones, filtro]);

  return (
    <DashboardLayout titulo="Actividades" rol={rol} opciones={opciones}>
      <section className="socios-inscritos">
        <div className="socios-inscritos-encabezado">
          <span className="socios-inscritos-etiqueta">RECEPCIÓN</span>
          <h2>Próximas sesiones con cupo</h2>
          <p>Consulta las sesiones programadas y los lugares disponibles en cada una.</p>
        </div>

        <div className="socios-inscritos-panel">
          <label htmlFor="filtro-sesiones">Filtrar por actividad, instructor o lugar</label>
          <input
            id="filtro-sesiones"
            type="search"
            className="dashboard-input"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        <div className="socios-inscritos-panel">
          <h3>
            Sesiones disponibles{" "}
            {!cargando && <span className="dashboard-badge">{filtradas.length}</span>}
          </h3>

          {cargando ? (
            <p className="dashboard-cargando">Cargando sesiones...</p>
          ) : error ? (
            <p className="dashboard-error">{error}</p>
          ) : filtradas.length === 0 ? (
            <p className="socios-inscritos-vacio">No hay sesiones disponibles.</p>
          ) : (
            <div className="socios-inscritos-tabla-contenedor">
              <table className="socios-inscritos-tabla">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Instructor</th>
                    <th>Lugar</th>
                    <th>Cupos</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((s) => (
                    <tr key={s.sesion_id}>
                      <td>{s.actividad}</td>
                      <td>{formatearFechaHora(s.inicio)}</td>
                      <td>
                        {parsearFechaPg(s.fin).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{s.coach}</td>
                      <td>{s.lugar || "—"}</td>
                      <td>
                        <span className={`dashboard-badge ${claseCupo(s.cupos_disponibles, s.cupo)}`}>
                          {s.cupos_disponibles} / {s.cupo}
                        </span>
                      </td>
                      <td>
                        <Link to="/recepcion/inscripciones" className="dashboard-enlace-boton">
                          Inscribir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
