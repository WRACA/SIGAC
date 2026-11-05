
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import "../assets/InscripcionRecepcion.css";
import {
  buscarSocios,
  obtenerSesiones,
  registrarInscripcion,
} from "../services/inscripciones.js";

// Menú de Recepcionista
const opciones = [
  { nombre: "Inicio", ruta: "/recepcion" },
  { nombre: "Socios", ruta: "/recepcion/socios" },
  { nombre: "Inscripciones", ruta: "/recepcion/inscripciones" },
  { nombre: "Actividades", ruta: "/recepcion/actividades" },
];

// Formatea una cadena ISO a "Lun 28 Oct · 09:00 – 10:00"
function formatearSesion(sesion) {
  const inicio = new Date(sesion.inicio);
  const fin = new Date(sesion.fin);
  const fechaStr = inicio.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const horaInicio = inicio.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const horaFin = fin.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const lugar = sesion.lugar ? ` · ${sesion.lugar}` : "";
  return `${sesion.actividad} — ${fechaStr} ${horaInicio}–${horaFin} | ${sesion.coach}${lugar} (${sesion.cupos_disponibles} cupos)`;
}

export default function InscripcionRecepcion() {
  const [busqueda, setBusqueda] = useState("");
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [sesionSeleccionada, setSesionSeleccionada] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  // Resultados de la API
  const [sociosFiltrados, setSociosFiltrados] = useState([]);
  const [sesiones, setSesiones] = useState([]);

  // Estados de carga
  const [cargandoSocios, setCargandoSocios] = useState(false);
  const [cargandoSesiones, setCargandoSesiones] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const debounceRef = useRef(null);

  // Cargar sesiones disponibles al montar el componente
  useEffect(() => {
    obtenerSesiones()
      .then((data) => setSesiones(data))
      .catch((err) => {
        setMensaje(err.message || "No se pudieron cargar las sesiones.");
        setTipoMensaje("error");
      })
      .finally(() => setCargandoSesiones(false));
  }, []);

  // Búsqueda de socios con debounce de 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const texto = busqueda.trim();

    if (!texto || socioSeleccionado) {
      setSociosFiltrados([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setCargandoSocios(true);
      buscarSocios(texto)
        .then((data) => setSociosFiltrados(data))
        .catch(() => setSociosFiltrados([]))
        .finally(() => setCargandoSocios(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [busqueda, socioSeleccionado]);

  // Seleccionar un socio de las sugerencias
  function seleccionarSocio(socio) {
    const nombreCompleto = [socio.nombre, socio.apellido_p, socio.apellido_m]
      .filter(Boolean)
      .join(" ");
    setSocioSeleccionado(socio);
    setBusqueda(nombreCompleto);
    setSociosFiltrados([]);
    setMostrarSugerencias(false);
    setMensaje("");
  }

  // Enviar inscripción al backend
  async function confirmarInscripcion(e) {
    e.preventDefault();

    if (!socioSeleccionado) {
      setMensaje("Debes seleccionar un socio de las sugerencias.");
      setTipoMensaje("error");
      return;
    }

    if (!sesionSeleccionada) {
      setMensaje("Debes seleccionar una sesión disponible.");
      setTipoMensaje("error");
      return;
    }

    setEnviando(true);
    setMensaje("");

    try {
      const resultado = await registrarInscripcion(
        socioSeleccionado.id,
        Number(sesionSeleccionada)
      );
      setMensaje(resultado.mensaje || "Inscripción registrada correctamente.");
      setTipoMensaje("exito");
      // Limpiar formulario tras éxito
      setBusqueda("");
      setSocioSeleccionado(null);
      setSesionSeleccionada("");
    } catch (err) {
      setMensaje(err.message || "Ocurrió un error al registrar la inscripción.");
      setTipoMensaje("error");
    } finally {
      setEnviando(false);
    }
  }

  const sesionActual = sesiones.find(
    (s) => String(s.sesion_id) === sesionSeleccionada
  );

  const nombreSocio = socioSeleccionado
    ? [
        socioSeleccionado.nombre,
        socioSeleccionado.apellido_p,
        socioSeleccionado.apellido_m,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

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
          la sesión disponible correspondiente.
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
                if (!socioSeleccionado) setMostrarSugerencias(true);
              }}
            />

            {/* SUGERENCIAS AUTOMÁTICAS */}
            {mostrarSugerencias &&
              busqueda.trim() &&
              !socioSeleccionado && (
                <div className="sugerencias-socios">

                  {cargandoSocios ? (
                    <p className="sin-resultados">Buscando…</p>
                  ) : sociosFiltrados.length > 0 ? (
                    sociosFiltrados.map((socio) => {
                      const nombre = [
                        socio.nombre,
                        socio.apellido_p,
                        socio.apellido_m,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <button
                          key={socio.id}
                          type="button"
                          className="sugerencia-socio"
                          onClick={() => seleccionarSocio(socio)}
                        >
                          {nombre} — #{socio.numero_socio}
                        </button>
                      );
                    })
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
              ✓ Socio seleccionado: {nombreSocio} — #{socioSeleccionado.numero_socio}
            </p>
          )}

          {/* SESIÓN DISPONIBLE */}
          <label htmlFor="seleccionar-sesion">
            Sesión disponible
          </label>

          <select
            id="seleccionar-sesion"
            value={sesionSeleccionada}
            disabled={cargandoSesiones}
            onChange={(e) => {
              setSesionSeleccionada(e.target.value);
              setMensaje("");
            }}
          >
            <option value="">
              {cargandoSesiones
                ? "Cargando sesiones…"
                : "Selecciona una sesión"}
            </option>

            {sesiones.map((sesion) => (
              <option
                key={sesion.sesion_id}
                value={sesion.sesion_id}
              >
                {formatearSesion(sesion)}
              </option>
            ))}
          </select>

          {/* RESUMEN */}
          {socioSeleccionado && sesionActual && (
            <div className="resumen-inscripcion">
              <h3>Resumen de inscripción</h3>

              <p>
                <strong>Socio:</strong>{" "}
                {nombreSocio} — #{socioSeleccionado.numero_socio}
              </p>

              <p>
                <strong>Actividad:</strong> {sesionActual.actividad}
              </p>

              <p>
                <strong>Horario:</strong>{" "}
                {new Date(sesionActual.inicio).toLocaleString("es-MX")} –{" "}
                {new Date(sesionActual.fin).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <p>
                <strong>Coach:</strong> {sesionActual.coach}
              </p>

              {sesionActual.lugar && (
                <p>
                  <strong>Lugar:</strong> {sesionActual.lugar}
                </p>
              )}

              <p>
                <strong>Cupos disponibles:</strong>{" "}
                {sesionActual.cupos_disponibles}
              </p>
            </div>
          )}

          {/* BOTÓN */}
          <button
            type="submit"
            className="boton-inscripcion"
            disabled={enviando}
          >
            {enviando ? "Registrando…" : "Confirmar inscripción"}
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
