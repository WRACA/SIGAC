import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import {
  obtenerClasesInstructor,
  obtenerInscritosClase,
} from "../services/instructor.js";
import { registrarAsistencia } from "../services/asistencias.js";
import {
  formatearFecha,
  formatearHora,
  obtenerEstadoTiempoClase,
  ordenarClasesPriorizadas,
} from "../utils/clasesUtils.js";
import "../assets/PaseLista.css";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Pase de lista", ruta: "/instructor/asistencia" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

export default function PaseLista() {
  const [searchParams, setSearchParams] = useSearchParams();
  const claseIdParam = searchParams.get("claseId");

  // Reloj local para evaluación en tiempo real
  const [fechaActual, setFechaActual] = useState(() => new Date());

  // Clases del instructor
  const [clases, setClases] = useState([]);
  const [cargandoClases, setCargandoClases] = useState(true);

  // Participantes / Inscritos de la clase seleccionada
  const [socios, setSocios] = useState([]);
  const [cargandoSocios, setCargandoSocios] = useState(false);

  // Mensajes de feedback
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardandoId, setGuardandoId] = useState(null);

  // Actualizar el reloj cada 10 segundos para recálculo de horario en vivo
  useEffect(() => {
    const intervalo = setInterval(() => {
      setFechaActual(new Date());
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  // 1. Cargar las clases asignadas al instructor autenticado
  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargandoClases(true);
      setError("");
      try {
        const datos = await obtenerClasesInstructor();
        if (activo) {
          const lista = Array.isArray(datos) ? datos : [];
          setClases(lista);
        }
      } catch (err) {
        if (activo) {
          setError(
            err.message || "No fue posible cargar las clases del instructor."
          );
        }
      } finally {
        if (activo) setCargandoClases(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  // Clases priorizadas: las sesiones en curso se sitúan primero
  const clasesPriorizadas = useMemo(() => {
    return ordenarClasesPriorizadas(clases, fechaActual);
  }, [clases, fechaActual]);

  // Determinar la clase seleccionada:
  // Si viene en el query param, buscarla; si no, seleccionar la primera clase en curso o la primera de la lista
  const claseSeleccionada = useMemo(() => {
    if (!clasesPriorizadas.length) return null;

    if (claseIdParam) {
      const encontrada = clasesPriorizadas.find(
        (c) => String(c.sesion_id) === String(claseIdParam)
      );
      if (encontrada) return encontrada;
    }

    // Si no se especificó o no se encontró, seleccionar la primera prioritaria
    return clasesPriorizadas[0];
  }, [clasesPriorizadas, claseIdParam]);

  // Sincronizar el query param si no estaba definido o cambió por defecto
  useEffect(() => {
    if (claseSeleccionada && String(claseIdParam) !== String(claseSeleccionada.sesion_id)) {
      setSearchParams({ claseId: String(claseSeleccionada.sesion_id) }, { replace: true });
    }
  }, [claseSeleccionada, claseIdParam, setSearchParams]);

  // 2. Cargar socios inscritos de la clase seleccionada
  useEffect(() => {
    if (!claseSeleccionada?.sesion_id) {
      setSocios([]);
      return;
    }

    let activo = true;
    async function cargarParticipantes() {
      setCargandoSocios(true);
      setMensaje("");
      setError("");
      try {
        const inscritos = await obtenerInscritosClase(claseSeleccionada.sesion_id);
        if (activo) {
          setSocios(Array.isArray(inscritos) ? inscritos : []);
        }
      } catch (err) {
        if (activo) {
          setError(
            err.message || "No fue posible cargar la lista de inscritos."
          );
        }
      } finally {
        if (activo) setCargandoSocios(false);
      }
    }

    cargarParticipantes();

    return () => {
      activo = false;
    };
  }, [claseSeleccionada?.sesion_id]);

  // Estado temporal de la clase seleccionada
  const estadoClase = claseSeleccionada
    ? obtenerEstadoTiempoClase(claseSeleccionada, fechaActual)
    : "finalizada";

  const puedeRegistrar = estadoClase === "en_curso";

  // Manejador para cambiar de clase desde el selector
  const cambiarClase = (event) => {
    const id = event.target.value;
    setSearchParams({ claseId: id });
    setMensaje("");
    setError("");
  };

  // Registrar asistencia en el backend
  const marcarAsistencia = async (socioId) => {
    setMensaje("");
    setError("");

    if (!puedeRegistrar) {
      setError("El registro de asistencia solo está disponible durante la clase.");
      return;
    }

    setGuardandoId(socioId);
    try {
      await registrarAsistencia(claseSeleccionada.sesion_id, socioId);

      // Actualizar estado del socio localmente a 'asistio'
      setSocios((actuales) =>
        actuales.map((s) =>
          s.id === socioId ? { ...s, estado: "asistio" } : s
        )
      );

      setMensaje("Asistencia registrada correctamente.");
    } catch (err) {
      setError(err.message || "Error al registrar la asistencia.");
    } finally {
      setGuardandoId(null);
    }
  };

  // Conteo de asistencias
  const asistenciasRegistradas = socios.filter((s) => s.estado === "asistio").length;
  const asistenciasPendientes = socios.length - asistenciasRegistradas;

  const estadoTexto = {
    proxima: "La clase aún no comienza",
    en_curso: "Clase en curso",
    finalizada: "La clase ha finalizado",
    cancelada: "Clase cancelada",
  };

  return (
    <DashboardLayout
      titulo="Pase de lista"
      rol="Instructor"
      opciones={opciones}
    >
      <section className="pase-lista">
        <div className="pase-lista-encabezado">
          <div>
            <span className="pase-lista-etiqueta">
              Panel de Instructor
            </span>
            <h2>Registro de asistencia</h2>
            <p>
              Marca la asistencia de los socios inscritos en tus clases en curso.
            </p>
          </div>
        </div>

        {/* SELECTOR DE CLASE CON PRIORIZACIÓN */}
        <div className="pase-lista-panel">
          <label htmlFor="seleccionar-clase">
            Seleccionar clase
          </label>

          {cargandoClases ? (
            <p style={{ color: "#888", fontSize: "14px" }}>Cargando clases asignadas...</p>
          ) : clasesPriorizadas.length === 0 ? (
            <p style={{ color: "#888", fontSize: "14px" }}>No tienes clases programadas.</p>
          ) : (
            <select
              id="seleccionar-clase"
              value={claseSeleccionada ? String(claseSeleccionada.sesion_id) : ""}
              onChange={cambiarClase}
            >
              {clasesPriorizadas.map((clase) => {
                const esActiva = clase.estado_tiempo === "en_curso";
                return (
                  <option key={clase.sesion_id} value={String(clase.sesion_id)}>
                    {esActiva ? "✦ [EN CURSO] " : ""}
                    {clase.actividad} — {formatearFecha(clase.fecha)} (
                    {formatearHora(clase.hora_inicio)} -{" "}
                    {formatearHora(clase.hora_fin)})
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {claseSeleccionada && (
          <>
            {/* PANEL INFORMATIVO DE LA SESIÓN */}
            <div className="pase-lista-panel">
              <div className="pase-lista-info">
                <div>
                  <h3>{claseSeleccionada.actividad}</h3>
                  <p>
                    Fecha: {formatearFecha(claseSeleccionada.fecha)} | Horario:{" "}
                    {formatearHora(claseSeleccionada.hora_inicio)} -{" "}
                    {formatearHora(claseSeleccionada.hora_fin)}
                  </p>
                  <p style={{ color: "#777", fontSize: "12px", marginTop: "4px" }}>
                    Lugar: {claseSeleccionada.lugar || "Espacio general"}
                  </p>
                </div>

                <span
                  className={`pase-lista-estado ${
                    estadoClase === "en_curso"
                      ? "durante"
                      : estadoClase === "proxima"
                        ? "antes"
                        : "despues"
                  }`}
                >
                  {estadoTexto[estadoClase] || "Fuera de horario"}
                </span>
              </div>

              <div className="pase-lista-resumen">
                <div>
                  <span>Socios inscritos</span>
                  <strong>{socios.length}</strong>
                </div>

                <div>
                  <span>Asistencias registradas</span>
                  <strong>{asistenciasRegistradas}</strong>
                </div>

                <div>
                  <span>Pendientes</span>
                  <strong>{asistenciasPendientes}</strong>
                </div>
              </div>
            </div>

            {/* TABLA DE SOCIOS INSCRITOS */}
            <div className="pase-lista-panel">
              <h3>Lista de participantes</h3>

              {cargandoSocios ? (
                <p style={{ color: "#888", fontSize: "14px" }}>
                  Cargando socios inscritos en esta clase...
                </p>
              ) : socios.length > 0 ? (
                <div className="pase-lista-tabla-contenedor">
                  <table className="pase-lista-tabla">
                    <thead>
                      <tr>
                        <th style={{ width: "60px", textAlign: "center" }}>#</th>
                        <th>Número de socio</th>
                        <th>Nombre completo</th>
                        <th>Asistencia</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {socios.map((socio, index) => {
                        const registrada = socio.estado === "asistio";
                        const guardando = guardandoId === socio.id;
                        const nombreCompleto = [
                          socio.nombre,
                          socio.apellido_p,
                          socio.apellido_m,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <tr key={socio.id}>
                            <td style={{ textAlign: "center", color: "#888" }}>
                              {index + 1}
                            </td>
                            <td style={{ color: "#ff5a00", fontWeight: "600" }}>
                              {socio.numero_socio || `SOC-${socio.id}`}
                            </td>
                            <td>{nombreCompleto}</td>
                            <td>
                              <span
                                className={
                                  registrada
                                    ? "asistencia-ok"
                                    : "asistencia-pendiente"
                                }
                              >
                                {registrada ? "Registrada" : "Pendiente"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                disabled={!puedeRegistrar || registrada || guardando}
                                onClick={() => marcarAsistencia(socio.id)}
                                className="pase-lista-boton"
                              >
                                {guardando
                                  ? "Guardando..."
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
                  <h3>No hay socios inscritos</h3>
                  <p>
                    Actualmente no existen socios registrados en esta clase.
                  </p>
                </div>
              )}

              {mensaje && (
                <p className="pase-lista-mensaje">{mensaje}</p>
              )}

              {error && (
                <p className="pase-lista-error">{error}</p>
              )}
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
