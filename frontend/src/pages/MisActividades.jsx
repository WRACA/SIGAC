
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerMisInscripciones } from "../services/socio.js";
import { parsearFechaPg } from "../utils/formato.js";
import "../assets/MisActividades.css";

const { nombre: rol, opciones } = menus.socio;

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

  // Solo las próximas: inscripciones pendientes cuya sesión aún no termina
  // (incluye las que están en curso), de la más cercana a la más lejana.
  // El historial completo está en "Mis inscripciones".
  const proximas = useMemo(() => {
    const ahora = new Date();
    return (Array.isArray(inscripciones) ? inscripciones : [])
      .filter((i) => i.estado === "inscrito" && parsearFechaPg(i.fin) > ahora)
      .sort((a, b) => parsearFechaPg(a.inicio) - parsearFechaPg(b.inicio));
  }, [inscripciones]);

  return (
    <DashboardLayout
      titulo="Mis actividades"
      rol={rol}
      opciones={opciones}
    >
      <section className="mis-actividades">
        <div className="mis-actividades-encabezado">
          <span className="mis-actividades-etiqueta">
            ESPACIO PERSONAL
          </span>
          <p>
            Consulta tus próximas actividades y sesiones. Tu historial
            completo está en <Link to="/socio/inscripciones">Mis inscripciones</Link>.
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

        {!cargando && !error && proximas.length === 0 && (
          <div className="mis-actividades-estado">
            <h3>No tienes actividades próximas</h3>
            <p>
              Cuando realices una inscripción, aparecerá aquí la
              información de tu actividad. Puedes revisar tus sesiones
              anteriores en{" "}
              <Link to="/socio/inscripciones">Mis inscripciones</Link>.
            </p>
          </div>
        )}

        {!cargando && !error && proximas.length > 0 && (
          <div className="mis-actividades-lista">
            {proximas.map((inscripcion) => (
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
