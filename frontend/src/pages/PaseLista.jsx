import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerInscritos, registrarAsistencia } from "../services/asistencias.js";
import { useSesionesInstructorSemana } from "../hooks/useSesionesInstructorSemana.js";
import SelectorSesion from "../components/SelectorSesion.jsx";
import {
  ESTADO_INSCRIPCION,
  formatearFecha,
  formatearHora,
  rangoHoras,
} from "../utils/formato.js";
import "../assets/PaseLista.css";
import LectorQRAsistencia from "../components/LectorQRAsistencia.jsx";

const { nombre: rol, opciones } = menus.instructor;

const etiquetaHora = (s) => rangoHoras(s.hora_inicio, s.hora_fin);

// Color de la etiqueta de asistencia según el estado de la inscripción
const CLASE_ESTADO = { asistio: "ok", inscrito: "aviso", falta: "error" };

// Indicador del momento de la sesión
const ESTADO_SESION = {
  en_curso: { clase: "durante", texto: "Clase en curso" },
  proxima: { clase: "antes", texto: "La clase aún no comienza" },
  finalizada: { clase: "despues", texto: "Clase finalizada" },
};

export default function PaseLista() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tieneSesionEnUrl = searchParams.has("sesionId");
  const semana = useSesionesInstructorSemana(searchParams.get("sesionId"));
  const { sesiones, listo, error: errorSesiones } = semana;

  // Evitar elegir arbitrariamente cuando hay sesiones simultáneas.
  // Sin sesión en la URL se usa la en curso o la próxima de la semana actual.
  // Un sesionId vacío en la URL significa "ninguna seleccionada".
  const sesionesEnCurso = sesiones.filter((s) => s.en_curso);
  const sesionPorDefecto =
  sesionesEnCurso.length > 1
    ? null
    : sesionesEnCurso[0] || sesiones.find((s) => s.estado_tiempo === "proxima");
const sesionId = tieneSesionEnUrl
  ? searchParams.get("sesionId")
  : sesionPorDefecto
  ? String(sesionPorDefecto.sesion_id)
  : "";

  const sesion = sesiones.find((s) => String(s.sesion_id) === sesionId);

  const [inscritos, setInscritos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [registrando, setRegistrando] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarInscritos = useCallback(async (id) => {
    const datos = await obtenerInscritos(id);
    return Array.isArray(datos) ? datos : [];
  }, []);

  // 1. Cargar las clases asignadas al instructor autenticado
  useEffect(() => {
    if (!sesionId) return;
    let activo = true;

    setCargando(true);
    setError("");
    cargarInscritos(sesionId)
      .then((datos) => activo && setInscritos(datos))
      .catch((err) => {
        if (!activo) return;
        setInscritos([]);
        setError(err.message);
      })
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [sesionId, cargarInscritos]);

  const cambiarSesion = (id) => {
    setSearchParams({ sesionId: id });
    setMensaje("");
    setError("");
    setFiltro("");
  };

  // Registro manual de asistencia (RF-16). La validación de horario,
  // inscripción y duplicados la hace el servidor.
  const marcarAsistencia = async (socio) => {
    setMensaje("");
    setError("");
    setRegistrando(socio.socio_id);

    try {
      const respuesta = await registrarAsistencia(sesionId, socio.socio_id);
      setMensaje(`${socio.nombre}: ${respuesta.mensaje}`);
      setInscritos(await cargarInscritos(sesionId));
    } catch (err) {
      setError(`${socio.nombre}: ${err.message}`);
    } finally {
      setRegistrando(null);
    }
  };

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return inscritos;
    return inscritos.filter(
      (s) => s.nombre.toLowerCase().includes(q) || String(s.numero_socio).includes(q)
    );
  }, [inscritos, filtro]);

  const asistieron = inscritos.filter((s) => s.estado === "asistio").length;
  const puedeRegistrar = Boolean(sesion?.en_curso);
  const estadoSesion = puedeRegistrar
    ? ESTADO_SESION.en_curso
    : ESTADO_SESION[sesion?.estado_tiempo] || ESTADO_SESION.proxima;

  return (
    <DashboardLayout titulo="Asistencia" rol={rol} opciones={opciones}>
      <section className="pase-lista">
        <div className="pase-lista-encabezado">
          <div>
            <span className="pase-lista-etiqueta">PANEL DE INSTRUCTOR</span>
            <h2>Asistencia de tus sesiones</h2>
            <p>
              Consulta los socios inscritos en tus sesiones y marca su asistencia
              durante la clase en curso.
            </p>
          </div>
        </div>

        {/* LECTOR QR: arriba para darle prioridad; disponible solo durante la sesión */}
        {sesion && puedeRegistrar && (
          <LectorQRAsistencia
            key={sesionId}
            sesionId={sesionId}
            onRegistrada={async () => {
              setInscritos(await cargarInscritos(sesionId));
            }}
          />
        )}

        {/* SELECTOR DE CLASE CON PRIORIZACIÓN */}
        <div className="pase-lista-panel">
          <label htmlFor="seleccionar-clase-clase">Seleccionar sesión</label>

          {sesionesEnCurso.length > 1 && !tieneSesionEnUrl && (
            <p className="pase-lista-error">
              Tienes varias clases en curso. Selecciona la sesión en la que deseas
              registrar asistencias.
              </p>
            )}

          {!listo && errorSesiones ? (
            <p className="pase-lista-error">{errorSesiones}</p>
          ) : !listo ? (
            <p className="dashboard-cargando">Cargando sesiones...</p>
          ) : semana.clases.length === 0 ? (
            <p className="dashboard-cargando">No tienes clases asignadas.</p>
          ) : (
            <SelectorSesion
              {...semana}
              sesionId={sesion ? sesionId : ""}
              onCambiar={cambiarSesion}
              etiquetaHora={etiquetaHora}
              idBase="seleccionar-clase"
            />
          )}
        </div>

        {sesion && (
          <>
            {/* PANEL INFORMATIVO DE LA SESIÓN */}
            <div className="pase-lista-panel">
              <div className="pase-lista-info">
                <div>
                  <h3>{sesion.actividad}</h3>
                  <p>
                    {formatearFecha(sesion.fecha)} · {formatearHora(sesion.hora_inicio)} –{" "}
                    {formatearHora(sesion.hora_fin)}
                    {sesion.lugar ? ` · ${sesion.lugar}` : ""}
                  </p>
                </div>

                <span className={`pase-lista-estado ${estadoSesion.clase}`}>
                  {estadoSesion.texto}
                </span>
              </div>

              <div className="pase-lista-resumen">
                <div>
                  <span>Socios inscritos</span>
                  <strong>{inscritos.length}</strong>
                </div>
                <div>
                  <span>Asistencias registradas</span>
                  <strong>{asistieron}</strong>
                </div>
                <div>
                  <span>Pendientes</span>
                  <strong>{inscritos.filter((s) => s.estado === "inscrito").length}</strong>
                </div>
              </div>
            </div>

            {/* TABLA DE SOCIOS INSCRITOS */}
            <div className="pase-lista-panel">
              <h3>Lista de participantes</h3>

              <input
                type="search"
                className="dashboard-input"
                placeholder="Buscar por nombre o número de socio"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                style={{ marginBottom: 16 }}
                aria-label="Buscar socio en la lista"
              />

              {mensaje && <p className="pase-lista-mensaje">{mensaje}</p>}
              {error && <p className="pase-lista-error">{error}</p>}

              {cargando ? (
                <p className="dashboard-cargando">Cargando inscritos...</p>
              ) : filtrados.length > 0 ? (
                <div className="pase-lista-tabla-contenedor">
                  <table className="pase-lista-tabla">
                    <thead>
                      <tr>
                        <th>No. socio</th>
                        <th>Nombre del socio</th>
                        <th>Asistencia</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((socio) => {
                        const registrada = socio.estado === "asistio";
                        const procesada = socio.estado !== "inscrito";

                        return (
                          <tr key={socio.socio_id}>
                            <td>{socio.numero_socio}</td>
                            <td>{socio.nombre}</td>
                            <td>
                              <span
                                className={`dashboard-badge ${CLASE_ESTADO[socio.estado] || ""}`}
                              >
                                {ESTADO_INSCRIPCION[socio.estado] || socio.estado}
                              </span>
                              {registrada && socio.fecha_asistencia && (
                                <span className="pase-lista-hora-asistencia">
                                  {socio.fecha_asistencia.slice(11, 16)}
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                disabled={!puedeRegistrar || procesada || registrando !== null}
                                onClick={() => marcarAsistencia(socio)}
                                className="pase-lista-boton"
                              >
                                {registrando === socio.socio_id
                                  ? "Registrando..."
                                  : registrada
                                  ? "Registrada"
                                  : "Marcar asistencia"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pase-lista-vacio">
                  <h3>{inscritos.length ? "Sin coincidencias" : "No hay socios inscritos"}</h3>
                  <p>
                    {inscritos.length
                      ? "Ningún socio coincide con la búsqueda."
                      : "No existen participantes para esta sesión."}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
