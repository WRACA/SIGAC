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

  // Estados de datos
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Reloj interno para actualizar estado y orden en caliente sin recargar ni cerrar sesión
  const [ahora, setAhora] = useState(() => new Date());

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

  // Timer para actualizar "ahora" cada 10 segundos, recalculando el orden sin recargar la página
  useEffect(() => {
    const intervalo = setInterval(() => {
      setAhora(new Date());
    }, 10000);

    return () => clearInterval(intervalo);
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

  // Lista ordenada prioritariamente: clases en curso primero (ordenadas entre sí por hora de inicio)
  // y las demás en orden cronológico coherente.
  const clasesOrdenadas = useMemo(() => {
    return ordenarClasesPriorizadas(clases, ahora);
  }, [clases, ahora]);

  // Seleccionar una clase y abrir sus detalles
  async function abrirDetallesClase(clase) {
    setClaseSeleccionada(clase);
    setDetalleCargando(true);
    setDetalleCompleto(null);

    try {
      const detalle = await obtenerDetalleClase(clase.sesion_id);
      setDetalleCompleto(detalle);
    } catch {
      setDetalleCompleto({ sesion: clase, alumnos: [] });
    } finally {
      setDetalleCargando(false);
    }
  }

  function cerrarDetalles() {
    setClaseSeleccionada(null);
    setDetalleCompleto(null);
  }

  // Conteo de clases por estado temporal recalculado en tiempo real
  const totalClases = clasesOrdenadas.length;
  const totalEnCurso = clasesOrdenadas.filter(
    (c) => c.estado_tiempo === "en_curso"
  ).length;
  const totalProximas = clasesOrdenadas.filter(
    (c) => c.estado_tiempo === "proxima"
  ).length;
  const totalFinalizadas = clasesOrdenadas.filter(
    (c) => c.estado_tiempo === "finalizada"
  ).length;

  // Filtrado de clases según el tab seleccionado (manteniendo la priorización)
  const clasesFiltradas = clasesOrdenadas.filter((clase) => {
    if (filtroEstado === "todas") return true;
    return clase.estado_tiempo === filtroEstado;
  });

  return (
    <DashboardLayout titulo="Mis clases" rol={rol} opciones={opciones}>
      <section className="clases-instructor">
        {/* ENCABEZADO */}
        <div className="clases-instructor-encabezado">
          <div>
            <span className="clases-instructor-etiqueta">PANEL DE INSTRUCTOR</span>
            <h2>Mis clases asignadas</h2>
            <p>
              Consulta tus sesiones en curso y próximas, revisa los socios
              inscritos y pasa lista durante la clase.
            </p>
          </div>
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

        {/* MENSAJE CUANDO NO EXISTEN CLASES ASIGNADAS */}
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
                className="clase-instructor-boton"
                onClick={() => navigate(`/instructor/alumnos?sesionId=${sesion.sesion_id}`)}
              >
                Ver todas las clases
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
