import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerInscritos } from "../services/asistencias.js";
import { useSesionesInstructor, etiquetaSesion } from "../hooks/useSesionesInstructor.js";
import { ESTADO_INSCRIPCION } from "../utils/formato.js";
import "../assets/SociosInscritos.css";

const { nombre: rol, opciones } = menus.instructor;

const CLASE_ESTADO = { asistio: "ok", inscrito: "aviso", falta: "error" };

export default function SociosInscritos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sesiones, cargando: cargandoSesiones, error: errorSesiones } = useSesionesInstructor();

  // Sesión elegida: la de la URL o, por defecto, la primera disponible
  const sesionId = searchParams.get("sesionId") || (sesiones[0] ? String(sesiones[0].sesion_id) : "");
  const sesionSeleccionada = sesiones.find((s) => String(s.sesion_id) === sesionId);

  const [inscritos, setInscritos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sesionId) return;
    let activo = true;

    setCargando(true);
    setError("");
    obtenerInscritos(sesionId)
      .then((datos) => activo && setInscritos(Array.isArray(datos) ? datos : []))
      .catch((err) => {
        if (!activo) return;
        setInscritos([]);
        setError(err.message);
      })
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [sesionId]);

  return (
    <DashboardLayout titulo="Socios inscritos" rol={rol} opciones={opciones}>
      <section className="socios-inscritos">
        <div className="socios-inscritos-encabezado">
          <div>
            <span className="socios-inscritos-etiqueta">PANEL DE INSTRUCTOR</span>
            <h2>Socios inscritos por clase</h2>
            <p>Consulta los participantes registrados en cada una de tus sesiones.</p>
          </div>
        </div>

        <div className="socios-inscritos-panel">
          <h3>Seleccionar sesión</h3>
          <label htmlFor="clase-inscritos">Sesión</label>

          {cargandoSesiones ? (
            <p className="dashboard-cargando">Cargando sesiones...</p>
          ) : errorSesiones ? (
            <p className="dashboard-error">{errorSesiones}</p>
          ) : sesiones.length === 0 ? (
            <p className="dashboard-cargando">No tienes sesiones vigentes.</p>
          ) : (
            <select
              id="clase-inscritos"
              value={sesionSeleccionada ? sesionId : ""}
              onChange={(e) => setSearchParams({ sesionId: e.target.value })}
            >
              {!sesionSeleccionada && <option value="">Selecciona una sesión</option>}
              {sesiones.map((s) => (
                <option key={s.sesion_id} value={s.sesion_id}>
                  {etiquetaSesion(s)}
                </option>
              ))}
            </select>
          )}
        </div>

        {sesionId && (
          <div className="socios-inscritos-panel">
            <h3>
              Lista de participantes{" "}
              {!cargando && !error && (
                <span className="dashboard-badge">
                  {inscritos.length} {inscritos.length === 1 ? "socio" : "socios"}
                </span>
              )}
            </h3>

            {cargando ? (
              <p className="dashboard-cargando">Cargando inscritos...</p>
            ) : error ? (
              <p className="dashboard-error">{error}</p>
            ) : inscritos.length === 0 ? (
              <div className="socios-inscritos-vacio">
                <h3>No hay socios inscritos</h3>
                <p>Actualmente no hay participantes registrados en esta sesión.</p>
              </div>
            ) : (
              <div className="socios-inscritos-tabla-contenedor">
                <table className="socios-inscritos-tabla">
                  <thead>
                    <tr>
                      <th>No. socio</th>
                      <th>Nombre del socio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscritos.map((socio) => (
                      <tr key={socio.socio_id}>
                        <td>{socio.numero_socio}</td>
                        <td>{socio.nombre}</td>
                        <td>
                          <span className={`dashboard-badge ${CLASE_ESTADO[socio.estado] || ""}`}>
                            {ESTADO_INSCRIPCION[socio.estado] || socio.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
