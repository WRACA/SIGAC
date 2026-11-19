import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerMisInscripciones } from "../services/socio.js";
import {
  ESTADO_INSCRIPCION,
  HORA_24,
  TIPO_ACCESO,
  formatearFechaHora,
  parsearFechaPg,
} from "../utils/formato.js";
import "../assets/MisActividades.css";
import "../assets/MisInscripciones.css";

const { nombre: rol, opciones } = menus.socio;

// Filtros disponibles: "" = todos
const FILTROS = ["", "inscrito", "asistio", "falta", "cancelada"];

const CLASE_ESTADO = { asistio: "ok", inscrito: "aviso", falta: "error" };

// Historial completo de inscripciones del socio
export default function MisInscripciones() {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerMisInscripciones()
      .then((datos) => activo && setInscripciones(Array.isArray(datos) ? datos : []))
      .catch((err) => activo && setError(err.message || "No fue posible cargar tus inscripciones."))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, []);

  // De la más reciente a la más antigua
  const filtradas = useMemo(
    () =>
      inscripciones
        .filter((i) => !filtro || i.estado === filtro)
        .sort((a, b) => parsearFechaPg(b.inicio) - parsearFechaPg(a.inicio)),
    [inscripciones, filtro]
  );

  return (
    <DashboardLayout titulo="Mis inscripciones" rol={rol} opciones={opciones}>
      <section className="mis-actividades">
        <div className="mis-actividades-encabezado">
          <span className="mis-actividades-etiqueta">ESPACIO PERSONAL</span>
          <p>Consulta el historial de todas tus inscripciones y asistencias.</p>
        </div>

        {cargando && (
          <div className="mis-actividades-estado">
            <p>Cargando tus inscripciones...</p>
          </div>
        )}

        {!cargando && error && (
          <div className="mis-actividades-estado error">
            <h3>No fue posible cargar tus inscripciones</h3>
            <p>{error}</p>
          </div>
        )}

        {!cargando && !error && (
          <>
            <div className="mis-inscripciones-filtros" role="group" aria-label="Filtrar por estado">
              {FILTROS.map((estado) => (
                <button
                  key={estado || "todos"}
                  type="button"
                  className={filtro === estado ? "activo" : ""}
                  aria-pressed={filtro === estado}
                  onClick={() => setFiltro(estado)}
                >
                  {estado ? ESTADO_INSCRIPCION[estado] : "Todos"}
                </button>
              ))}
            </div>

            {filtradas.length === 0 ? (
              <div className="mis-actividades-estado">
                <h3>
                  {inscripciones.length ? "Sin inscripciones con ese estado" : "Aún no tienes inscripciones"}
                </h3>
                <p>
                  {inscripciones.length
                    ? "Prueba con otro filtro."
                    : "Cuando realices una inscripción, aparecerá aquí."}
                </p>
              </div>
            ) : (
              <div className="mis-inscripciones-tabla-contenedor">
                <table className="mis-inscripciones-tabla">
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>Fecha y horario</th>
                      <th>Instructor</th>
                      <th>Lugar</th>
                      <th>Acceso</th>
                      <th>Estado</th>
                      <th>Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((i) => (
                      <tr key={i.id}>
                        <td>{i.actividad}</td>
                        <td>
                          {formatearFechaHora(i.inicio)} –{" "}
                          {parsearFechaPg(i.fin).toLocaleTimeString("es-MX", HORA_24)}
                        </td>
                        <td>{i.coach || "—"}</td>
                        <td>{i.lugar || "—"}</td>
                        <td>{TIPO_ACCESO[i.tipo_acceso] || i.tipo_acceso}</td>
                        <td>
                          <span className={`dashboard-badge ${CLASE_ESTADO[i.estado] || ""}`}>
                            {ESTADO_INSCRIPCION[i.estado] || i.estado}
                          </span>
                        </td>
                        <td>{i.fecha_asistencia ? formatearFechaHora(i.fecha_asistencia) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
