import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import {
  obtenerClasesInstructor,
  obtenerDetalleClase,
} from "../services/instructor.js";
import "../assets/ClasesInstructor.css";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

// Formatea una fecha YYYY-MM-DD en español legible (ej. "Martes, 10 de nov de 2026")
function formatearFecha(fechaStr) {
  if (!fechaStr) return "Fecha no disponible";
  try {
    const partes = fechaStr.split("-");
    if (partes.length === 3) {
      const fecha = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2])
      );
      return fecha.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return fechaStr;
  }
}

// Formatea la hora HH:MM a formato legible con AM/PM
function formatearHora(horaStr) {
  if (!horaStr) return "";
  const [h, m] = horaStr.split(":");
  if (h === undefined || m === undefined) return horaStr;
  const horas = parseInt(h, 10);
  const periodo = horas >= 12 ? "PM" : "AM";
  const horas12 = horas % 12 || 12;
  return `${horas12}:${m} ${periodo}`;
}

export default function Instructor() {
  const navigate = useNavigate();

  // Estados de datos
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtro de estado ("todas", "en_curso", "proxima", "finalizada")
  const [filtroEstado, setFiltroEstado] = useState("todas");

  // Estado de la clase seleccionada para ver detalles
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [detalleCompleto, setDetalleCompleto] = useState(null);

  // Cargar las clases del instructor desde el backend
  async function cargarClases() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerClasesInstructor();
      setClases(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(
        err.message || "Ocurrió un error al cargar las clases asignadas."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarClases();
  }, []);

  // Bloquear el scroll de la página de fondo cuando el modal de detalles está abierto
  useEffect(() => {
    if (claseSeleccionada) {
      const scrollOriginal = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = scrollOriginal;
      };
    }
  }, [claseSeleccionada]);

  // Seleccionar una clase y abrir sus detalles
  async function abrirDetallesClase(clase) {
    setClaseSeleccionada(clase);
    setDetalleCargando(true);
    setDetalleCompleto(null);

    try {
      const detalle = await obtenerDetalleClase(clase.sesion_id);
      setDetalleCompleto(detalle);
    } catch {
      // Si falla la consulta de detalle extendido, se muestran los datos de la clase base
      setDetalleCompleto({ sesion: clase, alumnos: [] });
    } finally {
      setDetalleCargando(false);
    }
  }

  function cerrarDetalles() {
    setClaseSeleccionada(null);
    setDetalleCompleto(null);
  }

  // Conteo de clases por estado temporal
  const totalClases = clases.length;
  const totalEnCurso = clases.filter(
    (c) => c.estado_tiempo === "en_curso"
  ).length;
  const totalProximas = clases.filter(
    (c) => c.estado_tiempo === "proxima"
  ).length;
  const totalFinalizadas = clases.filter(
    (c) => c.estado_tiempo === "finalizada"
  ).length;

  // Filtrado de clases según el tab seleccionado (manteniendo el orden cronológico)
  const clasesFiltradas = clases.filter((clase) => {
    if (filtroEstado === "todas") return true;
    return clase.estado_tiempo === filtroEstado;
  });

  return (
    <DashboardLayout
      titulo="Panel de Instructor"
      rol="Instructor"
      opciones={opciones}
    >
      <section className="clases-instructor">
        {/* ENCABEZADO */}
        <div className="clases-instructor-encabezado">
          <div>
            <span className="clases-instructor-etiqueta">
              Panel Principal
            </span>
            <h2>Mis clases asignadas</h2>
            <p>
              Consulta el listado cronológico de tus clases, revisa sus
              detalles y accede al control de participantes.
            </p>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN / ESTADÍSTICAS */}
        <div className="clases-stats-grid">
          <div className="clases-stat-card">
            <span>Total asignadas</span>
            <strong>{totalClases}</strong>
          </div>
          <div className="clases-stat-card stat-en-curso">
            <span>En curso ahora</span>
            <strong>{totalEnCurso}</strong>
          </div>
          <div className="clases-stat-card stat-proximas">
            <span>Próximas</span>
            <strong>{totalProximas}</strong>
          </div>
          <div className="clases-stat-card stat-finalizadas">
            <span>Finalizadas</span>
            <strong>{totalFinalizadas}</strong>
          </div>
        </div>

        {/* BARRA DE FILTROS CRONOLÓGICOS */}
        <div className="clases-filtros-bar">
          <div className="clases-filtros-tabs">
            <button
              type="button"
              className={`clases-filtro-btn ${filtroEstado === "todas" ? "activo" : ""
                }`}
              onClick={() => setFiltroEstado("todas")}
            >
              Todas
              <span className="clases-filtro-badge">{totalClases}</span>
            </button>

            <button
              type="button"
              className={`clases-filtro-btn ${filtroEstado === "en_curso" ? "activo" : ""
                }`}
              onClick={() => setFiltroEstado("en_curso")}
            >
              <span className="pulso-en-curso" />
              En curso
              <span className="clases-filtro-badge">{totalEnCurso}</span>
            </button>

            <button
              type="button"
              className={`clases-filtro-btn ${filtroEstado === "proxima" ? "activo" : ""
                }`}
              onClick={() => setFiltroEstado("proxima")}
            >
              Próximas
              <span className="clases-filtro-badge">{totalProximas}</span>
            </button>

            <button
              type="button"
              className={`clases-filtro-btn ${filtroEstado === "finalizada" ? "activo" : ""
                }`}
              onClick={() => setFiltroEstado("finalizada")}
            >
              Finalizadas
              <span className="clases-filtro-badge">{totalFinalizadas}</span>
            </button>
          </div>
        </div>

        {/* SKELETON LOADERS CUANDO SE ESTÁN CARGANDO LAS CLASES */}
        {cargando && (
          <div className="clases-instructor-grid">
            {[1, 2, 3, 4].map((item) => (
              <article key={item} className="clase-instructor-card skeleton-card">
                <div className="clase-instructor-card-superior">
                  <div className="skeleton-item skeleton-icono" />
                  <div className="skeleton-item skeleton-badge" />
                </div>
                <div className="skeleton-item skeleton-titulo" />
                <div className="clase-instructor-detalles skeleton-detalles">
                  <div className="skeleton-detalle-col">
                    <div className="skeleton-item skeleton-etiqueta" />
                    <div className="skeleton-item skeleton-valor" />
                  </div>
                  <div className="skeleton-detalle-col">
                    <div className="skeleton-item skeleton-etiqueta" />
                    <div className="skeleton-item skeleton-valor" />
                  </div>
                  <div className="skeleton-detalle-col">
                    <div className="skeleton-item skeleton-etiqueta" />
                    <div className="skeleton-item skeleton-valor" />
                  </div>
                  <div className="skeleton-detalle-col">
                    <div className="skeleton-item skeleton-etiqueta" />
                    <div className="skeleton-item skeleton-valor" />
                  </div>
                </div>
                <div className="clase-aforo-contenedor">
                  <div className="skeleton-item skeleton-barra-texto" />
                  <div className="skeleton-item skeleton-barra" />
                </div>
                <div className="clase-card-acciones">
                  <div className="skeleton-item skeleton-boton" />
                  <div className="skeleton-item skeleton-boton-corto" />
                </div>
              </article>
            ))}
          </div>
        )}

        {error && !cargando && (
          <div className="clases-vacio">
            <h3>Error al cargar las clases</h3>
            <p>{error}</p>
            <button
              type="button"
              className="clases-vacio-btn"
              onClick={cargarClases}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* MENSAJE CUANDO NO EXISTEN CLASES ASIGNADAS (CRITERIO 5) */}
        {!cargando && !error && clases.length === 0 && (
          <div className="clases-vacio">
            <h3>No tienes clases asignadas</h3>
            <p>
              Actualmente no cuentas con clases ni sesiones programadas bajo tu
              responsabilidad. Si consideras que esto es un error, por favor
              comunícate con recepción o con el administrador.
            </p>
            <button
              type="button"
              className="clases-vacio-btn"
              onClick={cargarClases}
            >
              Actualizar lista
            </button>
          </div>
        )}

        {/* MENSAJE CUANDO NO HAY CLASES EN EL FILTRO SELECCIONADO */}
        {!cargando &&
          !error &&
          clases.length > 0 &&
          clasesFiltradas.length === 0 && (
            <div className="clases-vacio">
              <h3>No hay clases para este filtro</h3>
              <p>
                No tienes ninguna clase con el estado seleccionado (
                {filtroEstado === "en_curso"
                  ? "En curso"
                  : filtroEstado === "proxima"
                    ? "Próxima"
                    : "Finalizada"}
                ). Puedes revisar las demás pestañas para ver tus otras clases.
              </p>
              <button
                type="button"
                className="clases-vacio-btn"
                onClick={() => setFiltroEstado("todas")}
              >
                Ver todas las clases
              </button>
            </div>
          )}

        {/* LISTADO CRONOLÓGICO DE CLASES ASIGNADAS */}
        {!cargando && !error && clasesFiltradas.length > 0 && (
          <div className="clases-instructor-grid">
            {clasesFiltradas.map((clase) => {
              const porcentajeOcupacion =
                clase.cupo > 0
                  ? Math.min(
                    100,
                    Math.round((clase.total_inscritos / clase.cupo) * 100)
                  )
                  : 0;

              const esEnCurso = clase.estado_tiempo === "en_curso";
              const esProxima = clase.estado_tiempo === "proxima";
              const esFinalizada = clase.estado_tiempo === "finalizada";

              return (
                <article
                  key={clase.sesion_id}
                  className={`clase-instructor-card ${esEnCurso
                    ? "card-en-curso"
                    : esProxima
                      ? "card-proxima"
                      : "card-finalizada"
                    }`}
                  onClick={() => abrirDetallesClase(clase)}
                >
                  {/* PARTE SUPERIOR DE LA TARJETA */}
                  <div className="clase-instructor-card-superior">
                    <span className="clase-instructor-icono">
                      <span>✦</span>
                    </span>

                    {/* DISTINCIÓN VISUAL DEL ESTADO (CRITERIO 6) */}
                    <span
                      className={`badge-estado ${esEnCurso
                        ? "en_curso"
                        : esProxima
                          ? "proxima"
                          : "finalizada"
                        }`}
                    >
                      {esEnCurso && <span className="pulso-en-curso" />}
                      {esEnCurso
                        ? "En curso"
                        : esProxima
                          ? "Próxima"
                          : "Finalizada"}
                    </span>
                  </div>

                  {/* NOMBRE DE LA CLASE */}
                  <h3>{clase.actividad}</h3>

                  {/* DETALLES DE FECHA, HORARIO Y LUGAR (CRITERIO 2) */}
                  <div className="clase-instructor-detalles">
                    <div className="clase-detalle-item">
                      <span>Fecha</span>
                      <strong>{formatearFecha(clase.fecha)}</strong>
                    </div>

                    <div className="clase-detalle-item">
                      <span>Horario</span>
                      <strong>
                        {formatearHora(clase.hora_inicio)} -{" "}
                        {formatearHora(clase.hora_fin)}
                      </strong>
                    </div>

                    <div className="clase-detalle-item">
                      <span>Lugar / Espacio</span>
                      <strong>{clase.lugar || "Por asignar"}</strong>
                    </div>

                    <div className="clase-detalle-item">
                      <span>Aforo</span>
                      <strong>
                        {clase.total_inscritos} / {clase.cupo} inscritos
                      </strong>
                    </div>
                  </div>

                  {/* BARRA DE OCUPACIÓN */}
                  <div className="clase-aforo-contenedor">
                    <div className="clase-aforo-texto">
                      <span>Ocupación</span>
                      <span>{porcentajeOcupacion}%</span>
                    </div>
                    <div className="clase-aforo-barra-fondo">
                      <div
                        className="clase-aforo-barra-progreso"
                        style={{ width: `${porcentajeOcupacion}%` }}
                      />
                    </div>
                  </div>

                  {/* ACCIONES DE LA TARJETA */}
                  <div
                    className="clase-card-acciones"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="clase-btn-detalle"
                      onClick={() => abrirDetallesClase(clase)}
                    >
                      Ver detalles
                    </button>

                    <button
                      type="button"
                      className="clase-btn-asistencia"
                      title="Ver socios inscritos / pase de lista"
                      onClick={() =>
                        navigate(
                          `/instructor/alumnos?claseId=${clase.sesion_id}`
                        )
                      }
                    >
                      Inscritos
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* MODAL / PANEL DE DETALLES DE LA CLASE (CRITERIO 4) */}
        {claseSeleccionada && (
          <div className="modal-overlay" onClick={cerrarDetalles}>
            <div
              className="modal-detalle-clase"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ENCABEZADO DEL MODAL */}
              <div className="modal-header">
                <div>
                  <span
                    className={`badge-estado ${claseSeleccionada.estado_tiempo === "en_curso"
                      ? "en_curso"
                      : claseSeleccionada.estado_tiempo === "proxima"
                        ? "proxima"
                        : "finalizada"
                      }`}
                  >
                    {claseSeleccionada.estado_tiempo === "en_curso" && (
                      <span className="pulso-en-curso" />
                    )}
                    {claseSeleccionada.estado_tiempo === "en_curso"
                      ? "En curso ahora"
                      : claseSeleccionada.estado_tiempo === "proxima"
                        ? "Próxima sesión"
                        : "Sesión finalizada"}
                  </span>
                  <h3>{claseSeleccionada.actividad}</h3>
                </div>

                <button
                  type="button"
                  className="modal-cerrar-btn"
                  onClick={cerrarDetalles}
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {/* CUERPO DEL MODAL */}
              <div className="modal-body">
                {/* DESCRIPCIÓN */}
                {claseSeleccionada.descripcion && (
                  <div className="modal-seccion">
                    <h4>Descripción de la actividad</h4>
                    <p>{claseSeleccionada.descripcion}</p>
                  </div>
                )}

                {/* GRILLA DE INFORMACIÓN PRINCIPAL */}
                <div className="modal-info-grid">
                  <div className="clase-detalle-item">
                    <span>Fecha programada</span>
                    <strong>{formatearFecha(claseSeleccionada.fecha)}</strong>
                  </div>

                  <div className="clase-detalle-item">
                    <span>Horario de clase</span>
                    <strong>
                      {formatearHora(claseSeleccionada.hora_inicio)} -{" "}
                      {formatearHora(claseSeleccionada.hora_fin)}
                    </strong>
                  </div>

                  <div className="clase-detalle-item">
                    <span>Lugar / Instalación</span>
                    <strong>
                      {claseSeleccionada.lugar || "Sin lugar asignado"}
                    </strong>
                  </div>

                  <div className="clase-detalle-item">
                    <span>Zona horaria</span>
                    <strong>{claseSeleccionada.zona_horaria}</strong>
                  </div>
                </div>

                {/* RESUMEN DE AFORO Y DISPONIBILIDAD */}
                <div className="modal-seccion">
                  <h4>Capacidad y Participación</h4>
                  <div className="clase-aforo-contenedor">
                    <div className="clase-aforo-texto">
                      <span>
                        Inscritos: {claseSeleccionada.total_inscritos} de{" "}
                        {claseSeleccionada.cupo}
                      </span>
                      <span>
                        {claseSeleccionada.cupos_disponibles} cupos libres
                      </span>
                    </div>
                    <div className="clase-aforo-barra-fondo">
                      <div
                        className="clase-aforo-barra-progreso"
                        style={{
                          width: `${claseSeleccionada.cupo > 0
                            ? Math.min(
                              100,
                              Math.round(
                                (claseSeleccionada.total_inscritos /
                                  claseSeleccionada.cupo) *
                                100
                              )
                            )
                            : 0
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* LISTA DE ALUMNOS INSCRITOS */}
                <div className="modal-seccion">
                  <h4>
                    Socios inscritos en esta clase (
                    {detalleCompleto?.alumnos?.length ??
                      claseSeleccionada.total_inscritos}
                    )
                  </h4>

                  {detalleCargando ? (
                    <p style={{ color: "#888", fontSize: "13px" }}>
                      Cargando listado de participantes...
                    </p>
                  ) : detalleCompleto?.alumnos?.length > 0 ? (
                    <div className="modal-alumnos-lista">
                      {detalleCompleto.alumnos.map((alumno, index) => {
                        const nombreCompleto = [
                          alumno.nombre,
                          alumno.apellido_p,
                          alumno.apellido_m,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <div
                            key={alumno.socio_id}
                            className="modal-alumno-item"
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ color: "#ff5a00", fontWeight: "700", fontSize: "12px", minWidth: "22px" }}>
                                #{index + 1}
                              </span>
                              <strong>{nombreCompleto}</strong>
                            </div>

                            <span
                              className={`modal-alumno-badge ${alumno.estado_inscripcion}`}
                            >
                              {alumno.estado_inscripcion === "asistio"
                                ? "Asistió"
                                : "Inscrito"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: "#888", fontSize: "13px" }}>
                      Aún no hay socios registrados en esta sesión.
                    </p>
                  )}
                </div>
              </div>

              {/* PIE DEL MODAL CON ACCIONES */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="clase-btn-detalle"
                  onClick={cerrarDetalles}
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  className="clase-btn-asistencia"
                  onClick={() => {
                    cerrarDetalles();
                    navigate(
                      `/instructor/alumnos?claseId=${claseSeleccionada.sesion_id}`
                    );
                  }}
                >
                  Ver en control de alumnos
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
