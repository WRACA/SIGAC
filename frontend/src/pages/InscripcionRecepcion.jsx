
import { useEffect, useRef, useState } from "react";
import {
  buscarSocios,
  obtenerActividades,
  registrarInscripcion,
} from "../services/inscripciones.js";
import DashboardLayout from "../components/DashboardLayout.jsx";
import "../assets/InscripcionRecepcion.css";

// Menú de Recepcionista
const opciones = [
  { nombre: "Inicio", ruta: "/recepcion" },
  { nombre: "Socios", ruta: "/recepcion/socios" },
  { nombre: "Inscripciones", ruta: "/recepcion/inscripciones" },
  { nombre: "Actividades", ruta: "/recepcion/actividades" },
];

// Socios de ejemplo para mostrar mientras se conecta el backend
const socios = [
  { id: 1, nombre: "Ana López" },
  { id: 2, nombre: "Carlos Martínez" },
  { id: 3, nombre: "María Hernández" },
  { id: 4, nombre: "Camila Hernández" },
  { id: 5, nombre: "Camilo López" },
  { id: 6, nombre: "Camero Ruiz" },
];

// Actividades deportivas de SIGAC
const actividades = [
  { id: 1, nombre: "Fútbol" },
  { id: 2, nombre: "Básquetbol" },
  { id: 3, nombre: "Voleibol" },
  { id: 4, nombre: "Tenis" },
  { id: 5, nombre: "Pádel" },
  { id: 6, nombre: "Natación" },
  { id: 7, nombre: "Aerodanza" },
  { id: 8, nombre: "Barre" },
  { id: 9, nombre: "Baile Fit" },
  { id: 10, nombre: "Baile en pareja" },
  { id: 11, nombre: "Box" },
  { id: 12, nombre: "Capoeira" },
  { id: 13, nombre: "CrossFit" },
  { id: 14, nombre: "Gimnasio" },
  { id: 15, nombre: "MMA" },
  { id: 16, nombre: "Taekwondo" },
  { id: 17, nombre: "Yoga" },
];

export default function InscripcionRecepcion() {
  const [busqueda, setBusqueda] = useState("");
  const [cargandoSocios, setCargandoSocios] = useState(false);
  const [cargandoActividades, setCargandoActividades] = useState(false);
  const [guardandoInscripcion, setGuardandoInscripcion] = useState(false);

  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [sociosDisponibles, setSociosDisponibles] = useState(socios);
  const [actividadSeleccionada, setActividadSeleccionada] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [actividadesDisponibles, setActividadesDisponibles] =
    useState(actividades);

  // Identifica la búsqueda más reciente.
  const ultimaBusqueda = useRef(0);

  // Evita actualizar el componente si ya se desmontó.
  const componenteActivo = useRef(false);

  // Filtrar socios por nombre o número.
  const sociosFiltrados = busqueda.trim()
    ? sociosDisponibles.filter((socio) => {
        const texto = busqueda.trim().toLowerCase();

        return (
          String(socio.nombre ?? "").toLowerCase().includes(texto) ||
          String(socio.id).includes(texto)
        );
      })
    : [];

  // Cargar actividades desde el backend.
  useEffect(() => {
    componenteActivo.current = true;

    async function cargarActividades() {
      setCargandoActividades(true);

      try {
        const datos = await obtenerActividades();

        if (!componenteActivo.current) return;

        if (!Array.isArray(datos)) {
          throw new Error("La respuesta de actividades no es válida.");
        }

        setActividadesDisponibles(datos);
      } catch (error) {
        if (!componenteActivo.current) return;

        setMensaje(
          error.message || "No fue posible cargar las actividades."
        );
        setTipoMensaje("error");
      } finally {
        if (componenteActivo.current) {
          setCargandoActividades(false);
        }
      }
    }

    cargarActividades();

    return () => {
      componenteActivo.current = false;
      ultimaBusqueda.current += 1;
    };
  }, []);

  // Buscar socios en el backend.
  async function buscarSociosEnBackend(texto) {
    const idBusqueda = ++ultimaBusqueda.current;

    if (!texto.trim()) {
      setSociosDisponibles(socios);
      setCargandoSocios(false);
      return;
    }

    setCargandoSocios(true);

    try {
      const datos = await buscarSocios(texto);

      // Ignorar respuestas de búsquedas anteriores.
      if (
        !componenteActivo.current ||
        idBusqueda !== ultimaBusqueda.current
      ) {
        return;
      }

      if (!Array.isArray(datos)) {
        throw new Error("La respuesta de socios no es válida.");
      }

      setSociosDisponibles(datos);
    } catch (error) {
      if (
        !componenteActivo.current ||
        idBusqueda !== ultimaBusqueda.current
      ) {
        return;
      }

      setSociosDisponibles([]);
      setMensaje(error.message || "No fue posible buscar socios.");
      setTipoMensaje("error");
    } finally {
      if (
        componenteActivo.current &&
        idBusqueda === ultimaBusqueda.current
      ) {
        setCargandoSocios(false);
      }
    }
  }

  // Seleccionar un socio de las sugerencias.
  function seleccionarSocio(socio) {
    // Invalida cualquier búsqueda que siga pendiente.
    ultimaBusqueda.current += 1;
    setCargandoSocios(false);

    setSocioSeleccionado(socio);
    setBusqueda(socio.nombre);
    setMostrarSugerencias(false);
    setMensaje("");
    setTipoMensaje("");
  }

  // Registrar la inscripción.
  async function confirmarInscripcion(e) {
    e.preventDefault();

    if (guardandoInscripcion) return;

    if (!socioSeleccionado) {
      setMensaje("Debes seleccionar un socio.");
      setTipoMensaje("error");
      return;
    }

    if (!actividadSeleccionada) {
      setMensaje("Debes seleccionar una actividad deportiva.");
      setTipoMensaje("error");
      return;
    }

    setGuardandoInscripcion(true);
    setMensaje("");
    setTipoMensaje("");

    try {
      await registrarInscripcion(
        socioSeleccionado.id,
        actividadSeleccionada
      );

      setMensaje("¡Inscripción registrada correctamente!");
      setTipoMensaje("exito");

      setSocioSeleccionado(null);
      setBusqueda("");
      setActividadSeleccionada("");
      setSociosDisponibles(socios);
      setMostrarSugerencias(false);
    } catch (error) {
      setMensaje(
        error.message || "No fue posible registrar la inscripción."
      );
      setTipoMensaje("error");
    } finally {
      setGuardandoInscripcion(false);
    }
  }

  return (
    <DashboardLayout
      titulo="Inscripciones"
      rol="Recepcionista"
      opciones={opciones}
    >
      <div className="inscripcion-contenedor">
        <h2>Nueva inscripción</h2>

        <p>
          Busca al socio que deseas inscribir y selecciona
          la actividad deportiva correspondiente.
        </p>

        <form
          className="inscripcion-formulario"
          onSubmit={confirmarInscripcion}
        >
          {/* BUSCADOR DE SOCIOS */}
          <label htmlFor="buscar-socio">Buscar socio</label>

          <div className="buscador-socios">
            <input
              id="buscar-socio"
              type="text"
              placeholder="Escribe el nombre o número del socio"
              autoComplete="off"
              value={busqueda}
              onChange={(e) => {
                const texto = e.target.value;

                setBusqueda(texto);
                setSocioSeleccionado(null);
                setMostrarSugerencias(true);
                setMensaje("");
                setTipoMensaje("");

                buscarSociosEnBackend(texto);
              }}
              onFocus={() => {
                if (!socioSeleccionado) {
                  setMostrarSugerencias(true);
                }
              }}
            />

            {/* SUGERENCIAS */}
            {mostrarSugerencias && busqueda.trim() && !socioSeleccionado && (
              <div className="sugerencias-socios">
                {cargandoSocios ? (
                  <p role="status">Buscando socios...</p>
                ) : sociosFiltrados.length > 0 ? (
                  sociosFiltrados.map((socio) => (
                    <button
                      key={socio.id}
                      type="button"
                      className="sugerencia-socio"
                      onClick={() => seleccionarSocio(socio)}
                    >
                      {socio.nombre} - #{socio.id}
                    </button>
                  ))
                ) : (
                  <p className="sin-resultados">
                    No se encontraron socios.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SOCIO SELECCIONADO */}
          {socioSeleccionado && (
            <p className="socio-seleccionado">
              ✓ Socio seleccionado: {socioSeleccionado.nombre}
            </p>
          )}

          {/* ACTIVIDAD DEPORTIVA */}
          <label htmlFor="seleccionar-actividad">
            Actividad deportiva
          </label>

          {cargandoActividades && (
            <p role="status">Cargando actividades...</p>
          )}

          <select
            id="seleccionar-actividad"
            value={actividadSeleccionada}
            disabled={cargandoActividades || guardandoInscripcion}
            onChange={(e) => {
              setActividadSeleccionada(e.target.value);
              setMensaje("");
              setTipoMensaje("");
            }}
          >
            <option value="">Selecciona una actividad</option>

            {actividadesDisponibles.map((actividad) => (
              <option key={actividad.id} value={actividad.id}>
                {actividad.nombre}
              </option>
            ))}
          </select>

          {/* RESUMEN */}
          {socioSeleccionado && actividadSeleccionada && (
            <div className="resumen-inscripcion">
              <h3>Resumen de inscripción</h3>

              <p>
                <strong>Socio:</strong> {socioSeleccionado.nombre}
              </p>

              <p>
                <strong>Actividad:</strong>{" "}
                {actividadesDisponibles.find(
                  (actividad) =>
                    String(actividad.id) === String(actividadSeleccionada)
                )?.nombre ?? "Actividad seleccionada"}
              </p>
            </div>
          )}

          {/* BOTÓN */}
          <button
            type="submit"
            className="boton-inscripcion"
            disabled={guardandoInscripcion || cargandoActividades}
          >
            {guardandoInscripcion
              ? "Registrando inscripción..."
              : "Confirmar inscripción"}
          </button>

          {/* MENSAJES */}
          {mensaje && (
            <p
              className={`inscripcion-mensaje ${tipoMensaje}`}
              role="status"
            >
              {mensaje}
            </p>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
