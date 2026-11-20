import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { useSesionesInstructor } from "../hooks/useSesionesInstructor.js";
import { formatearFecha, formatearHora } from "../utils/formato.js";
import { getUsuario } from "../services/api.js";

const { nombre: rol, opciones } = menus.instructor;

// Sesiones dentro de los próximos 7 días
function sesionesDeLaSemana(sesiones) {
  const limite = new Date();
  limite.setDate(limite.getDate() + 7);
  return sesiones.filter((s) => {
    const [anio, mes, dia] = s.fecha.split("-").map(Number);
    return new Date(anio, mes - 1, dia) <= limite;
  }).length;
}

export default function Instructor() {
  const { sesiones, cargando, error } = useSesionesInstructor();
  const nombre = getUsuario()?.nombre;

  const enCurso = sesiones.find((s) => s.en_curso);
  const proxima = sesiones.find((s) => !s.en_curso);

  return (
    <DashboardLayout titulo="Panel de Instructor" rol={rol} opciones={opciones}>
      <h2>{nombre ? `¡Hola, ${nombre}!` : "¡Bienvenido, instructor!"}</h2>

      <p>
        Consulta tus clases asignadas, revisa a los alumnos inscritos
        y pasa lista durante tus sesiones.
      </p>

      {cargando && <p className="dashboard-cargando">Cargando información...</p>}
      {error && <p className="dashboard-error">{error}</p>}

      {!cargando && !error && (
        <div className="dashboard-tarjetas">
          <div className="dashboard-tarjeta">
            <h3>Sesiones vigentes</h3>
            <p>{sesiones.length}</p>
          </div>

          <div className="dashboard-tarjeta">
            <h3>Próximos 7 días</h3>
            <p>{sesionesDeLaSemana(sesiones)}</p>
          </div>

          <div className="dashboard-tarjeta">
            <h3>Próxima clase</h3>
            <p className="dashboard-tarjeta-texto">
              {proxima
                ? `${proxima.actividad} · ${formatearFecha(proxima.fecha)} ${formatearHora(
                    proxima.hora_inicio
                  )}`
                : "Sin clases próximas"}
            </p>
          </div>

          <div className="dashboard-tarjeta">
            <h3>Clase en curso</h3>
            {enCurso ? (
              <>
                <p className="dashboard-tarjeta-texto">{enCurso.actividad}</p>
                <Link
                  to={`/instructor/asistencia?sesionId=${enCurso.sesion_id}`}
                  className="dashboard-enlace-boton"
                  style={{ marginTop: 12 }}
                >
                  Asistencia
                </Link>
              </>
            ) : (
              <p className="dashboard-tarjeta-texto">Ninguna</p>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
