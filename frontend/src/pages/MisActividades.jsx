
import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { obtenerMisInscripciones } from "../services/socio.js";
import "../assets/MisActividades.css";

const opciones = [
  { nombre: "Inicio", ruta: "/socio" },
  { nombre: "Mis actividades", ruta: "/socio/actividades" },
  { nombre: "Mi horario", ruta: "/socio/horarios" },
  { nombre: "Mi perfil", ruta: "/socio/perfil" },
];

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return fecha;
  }

  return fechaValida.toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function MisActividades() {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarInscripciones() {
      try {
        const datos = await obtenerMisInscripciones();
        setInscripciones(datos);
      } catch (err) {
        setError(err.message || "No fue posible cargar tus actividades.");
      } finally {
        setCargando(false);
      }
    }

    cargarInscripciones();
  }, []);

  return (
    <DashboardLayout
      titulo="Mis actividades"
      rol="Socio"
      opciones={opciones}
    >
      <section className="mis-actividades">
        <div className="mis-actividades-encabezado">
          <span className="mis-actividades-etiqueta">
            ESPACIO PERSONAL
          </span>
          <p>
            Consulta las actividades y sesiones en las que estás inscrito.
          </p>
        </div>

        {cargando && (
          <div className="mis-actividades-estado">
            <p>Cargando tus actividades...</p>
          </div>
        )}

        {!cargando && error && (
          <div className="mis-actividades-estado error">
            <h3>No fue posible cargar tus actividades</h3>
            <p>{error}</p>
          </div>
        )}

        {!cargando && !error && inscripciones.length === 0 && (
          <div className="mis-actividades-estado">
            <h3>Aún no tienes actividades inscritas</h3>
            <p>
              Cuando realices una inscripción, aparecerá aquí la
              información de tu actividad.
            </p>
          </div>
        )}

        {!cargando && !error && inscripciones.length > 0 && (
          <div className="mis-actividades-lista">
            {inscripciones.map((inscripcion) => (
              <article
                className="mis-actividad-card"
                key={inscripcion.id}
              >
                <div className="mis-actividad-superior">
                  <span className="mis-actividad-categoria">
                    {inscripcion.tipo_acceso}
                  </span>
                  <span className="mis-actividad-estado">
                    {inscripcion.estado}
                  </span>
                </div>

                <h3>{inscripcion.actividad}</h3>

                <div className="mis-actividad-detalles">
                  <p>
                    <strong>Instructor:</strong> {inscripcion.coach}
                  </p>
                  <p>
                    <strong>Inicio:</strong>{" "}
                    {formatearFecha(inscripcion.inicio)}
                  </p>
                  <p>
                    <strong>Fin:</strong>{" "}
                    {formatearFecha(inscripcion.fin)}
                  </p>
                  <p>
                    <strong>Lugar:</strong>{" "}
                    {inscripcion.lugar || "No especificado"}
                  </p>
                  {inscripcion.fecha_asistencia && (
                    <p>
                      <strong>Fecha de asistencia:</strong>{" "}
                      {formatearFecha(inscripcion.fecha_asistencia)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
