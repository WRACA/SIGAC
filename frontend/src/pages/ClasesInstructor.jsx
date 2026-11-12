import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { useSesionesInstructor } from "../hooks/useSesionesInstructor.js";
import { formatearFecha, formatearHora } from "../utils/formato.js";
import "../assets/ClasesInstructor.css";

const { nombre: rol, opciones } = menus.instructor;

export default function ClasesInstructor() {
  const navigate = useNavigate();
  const { sesiones, cargando, error } = useSesionesInstructor();

  return (
    <DashboardLayout titulo="Mis clases" rol={rol} opciones={opciones}>
      <section className="clases-instructor">
        <div className="clases-instructor-encabezado">
          <div>
            <span className="clases-instructor-etiqueta">PANEL DE INSTRUCTOR</span>
            <h2>Mis clases asignadas</h2>
            <p>
              Consulta tus sesiones en curso y próximas, revisa los socios
              inscritos y pasa lista durante la clase.
            </p>
          </div>

          <div className="clases-instructor-total">
            <span>Sesiones vigentes</span>
            <strong>{cargando ? "…" : sesiones.length}</strong>
          </div>
        </div>

        {cargando && <p className="dashboard-cargando">Cargando sesiones...</p>}
        {error && <p className="dashboard-error">{error}</p>}
        {!cargando && !error && sesiones.length === 0 && (
          <p className="dashboard-cargando">No tienes sesiones programadas.</p>
        )}

        <div className="clases-instructor-grid">
          {sesiones.map((sesion) => (
            <article className="clase-instructor-card" key={sesion.sesion_id}>
              <div className="clase-instructor-card-superior">
                <span className="clase-instructor-icono">
                  <span>✦</span>
                </span>

                <span
                  className={`dashboard-badge ${sesion.en_curso ? "ok" : ""}`}
                >
                  {sesion.en_curso ? "En curso" : "Programada"}
                </span>
              </div>

              <h3>{sesion.actividad}</h3>

              <div className="clase-instructor-detalles">
                <p>
                  <span>Fecha</span>
                  {formatearFecha(sesion.fecha)}
                </p>
                <p>
                  <span>Horario</span>
                  {formatearHora(sesion.hora_inicio)} – {formatearHora(sesion.hora_fin)}
                </p>
                <p>
                  <span>Lugar</span>
                  {sesion.lugar || "—"}
                </p>
              </div>

              <button
                type="button"
                className="clase-instructor-boton"
                onClick={() => navigate(`/instructor/alumnos?sesionId=${sesion.sesion_id}`)}
              >
                Ver inscritos
                <span>→</span>
              </button>

              {sesion.en_curso && (
                <button
                  type="button"
                  className="clase-instructor-boton"
                  style={{ marginTop: 10 }}
                  onClick={() => navigate(`/instructor/asistencia?sesionId=${sesion.sesion_id}`)}
                >
                  Pasar lista
                  <span>→</span>
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
