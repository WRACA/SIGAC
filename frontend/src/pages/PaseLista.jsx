import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerInscritos, registrarAsistencia } from "../services/asistencias.js";
import { useSesionesInstructor, etiquetaSesion } from "../hooks/useSesionesInstructor.js";
import { formatearFecha, formatearHora } from "../utils/formato.js";
import "../assets/PaseLista.css";

const { nombre: rol, opciones } = menus.instructor;

export default function PaseLista() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sesiones, cargando: cargandoSesiones, error: errorSesiones } = useSesionesInstructor();

  // Sesión elegida: la de la URL o, por defecto, la que está en curso
  const sesionPorDefecto = sesiones.find((s) => s.en_curso) || sesiones[0];
  const sesionId =
    searchParams.get("sesionId") || (sesionPorDefecto ? String(sesionPorDefecto.sesion_id) : "");
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

  const cambiarSesion = (e) => {
    setSearchParams({ sesionId: e.target.value });
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

  return (
    <DashboardLayout titulo="Pase de lista" rol={rol} opciones={opciones}>
      <section className="pase-lista">
        <div className="pase-lista-encabezado">
          <div>
            <span className="pase-lista-etiqueta">PANEL DE INSTRUCTOR</span>
            <h2>Registro de asistencia</h2>
            <p>Marca la asistencia de los socios inscritos en tu clase en curso.</p>
          </div>
        </div>

        <div className="pase-lista-panel">
          <label htmlFor="seleccionar-clase">Seleccionar sesión</label>

          {cargandoSesiones ? (
            <p className="dashboard-cargando">Cargando sesiones...</p>
          ) : errorSesiones ? (
            <p className="pase-lista-error">{errorSesiones}</p>
          ) : sesiones.length === 0 ? (
            <p className="dashboard-cargando">No tienes sesiones vigentes.</p>
          ) : (
            <select
              id="seleccionar-clase"
              value={sesion ? sesionId : ""}
              onChange={cambiarSesion}
            >
              {!sesion && <option value="">Selecciona una sesión</option>}
              {sesiones.map((s) => (
                <option key={s.sesion_id} value={s.sesion_id}>
                  {etiquetaSesion(s)}
                </option>
              ))}
            </select>
          )}
        </div>

        {sesion && (
          <>
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

                <span className={`pase-lista-estado ${puedeRegistrar ? "durante" : "antes"}`}>
                  {puedeRegistrar ? "Clase en curso" : "La clase aún no comienza"}
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
                                className={registrada ? "asistencia-ok" : "asistencia-pendiente"}
                              >
                                {registrada
                                  ? `Registrada ${socio.fecha_asistencia?.slice(11, 16) || ""}`
                                  : procesada
                                  ? "Falta"
                                  : "Pendiente"}
                              </span>
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
