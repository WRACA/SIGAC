
import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import "../assets/InscripcionRecepcion.css";

// Menú de Recepcionista
const opciones = [
  { nombre: "Inicio", ruta: "/recepcion" },
  { nombre: "Socios", ruta: "/recepcion/socios" },
  { nombre: "Inscripciones", ruta: "/recepcion/inscripciones" },
  { nombre: "Actividades", ruta: "/recepcion/actividades" },
];

// Socios de ejemplo (después vendrán del backend)
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
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  // Filtrar socios mientras se escribe
  const sociosFiltrados = busqueda.trim()
    ? socios.filter((socio) => {
        const texto = busqueda.trim().toLowerCase();

        return (
          socio.nombre.toLowerCase().includes(texto) ||
          String(socio.id).includes(texto)
        );
      })
    : [];

  // Seleccionar un socio de las sugerencias
  function seleccionarSocio(socio) {
    setSocioSeleccionado(socio);
    setBusqueda(socio.nombre);
    setMostrarSugerencias(false);
    setMensaje("");
  }

  // Validar formulario
  function confirmarInscripcion(e) {
    e.preventDefault();

    if (!socioSeleccionado) {
      setMensaje("Debes seleccionar un socio de las sugerencias.");
      setTipoMensaje("error");
      return;
    }

    if (!actividadSeleccionada) {
      setMensaje("Debes seleccionar una actividad deportiva.");
      setTipoMensaje("error");
      return;
    }

    setMensaje(
      "Datos validados correctamente. La inscripción todavía no se ha registrado porque falta conectar el backend."
    );
    setTipoMensaje("aviso");
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
          <label htmlFor="buscar-socio">
            Buscar socio
          </label>

          <div className="buscador-socios">

            <input
              id="buscar-socio"
              type="text"
              placeholder="Escribe el nombre o número del socio"
              autoComplete="off"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setSocioSeleccionado(null);
                setMostrarSugerencias(true);
                setMensaje("");
              }}
              onFocus={() => {
                if (!socioSeleccionado) {
                  setMostrarSugerencias(true);
                }
              }}
            />

            {/* SUGERENCIAS AUTOMÁTICAS */}
            {mostrarSugerencias &&
              busqueda.trim() &&
              !socioSeleccionado && (
                <div className="sugerencias-socios">

                  {sociosFiltrados.length > 0 ? (
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

          <select
            id="seleccionar-actividad"
            value={actividadSeleccionada}
            onChange={(e) => {
              setActividadSeleccionada(e.target.value);
              setMensaje("");
            }}
          >
            <option value="">
              Selecciona una actividad
            </option>

            {actividades.map((actividad) => (
              <option
                key={actividad.id}
                value={actividad.id}
              >
                {actividad.nombre}
              </option>
            ))}
          </select>

          {/* RESUMEN */}
          {socioSeleccionado && actividadSeleccionada && (
            <div className="resumen-inscripcion">
              <h3>Resumen de inscripción</h3>

              <p>
                <strong>Socio:</strong>{" "}
                {socioSeleccionado.nombre}
              </p>

              <p>
                <strong>Actividad:</strong>{" "}
                {
                  actividades.find(
                    (actividad) =>
                      String(actividad.id) === actividadSeleccionada
                  )?.nombre
                }
              </p>
            </div>
          )}

          {/* BOTÓN */}
          <button type="submit" className="boton-inscripcion">
            Validar inscripción
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
