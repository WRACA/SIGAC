import { useEffect, useRef, useState } from "react";
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

// Formatea una sesión disponible para mostrar en el selector
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
  const ultimaBusqueda = useRef(0);
  const componenteActivo = useRef(false);

  // Cargar sesiones disponibles al montar el componente
  useEffect(() => {
    componenteActivo.current = true;

    async function cargarSesiones() {
      setCargandoSesiones(true);
      try {
        const datos = await obtenerSesiones();
        if (!componenteActivo.current) return;
        setSesiones(Array.isArray(datos) ? datos : []);
      } catch (err) {
        if (!componenteActivo.current) return;
        setMensaje(err.message || "No se pudieron cargar las sesiones.");
        setTipoMensaje("error");
      } finally {
        if (componenteActivo.current) {
          setCargandoSesiones(false);
        }
      }
    }

    cargarSesiones();

    return () => {
      componenteActivo.current = false;
      ultimaBusqueda.current += 1;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Búsqueda de socios con debounce de 300ms y control de concurrencia
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const texto = busqueda.trim();

    if (!texto || socioSeleccionado) {
      ultimaBusqueda.current += 1;
      setSociosFiltrados([]);
      setCargandoSocios(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const idBusqueda = ++ultimaBusqueda.current;
      setCargandoSocios(true);

      try {
        const datos = await buscarSocios(texto);
        if (
          !componenteActivo.current ||
          idBusqueda !== ultimaBusqueda.current
        ) {
          return;
        }
        setSociosFiltrados(Array.isArray(datos) ? datos : []);
      } catch (err) {
        if (
          !componenteActivo.current ||
          idBusqueda !== ultimaBusqueda.current
        ) {
          return;
        }
        setSociosFiltrados([]);
        setMensaje(err.message || "No fue posible buscar socios.");
        setTipoMensaje("error");
      } finally {
        if (
          componenteActivo.current &&
          idBusqueda === ultimaBusqueda.current
        ) {
          setCargandoSocios(false);
        }
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [busqueda, socioSeleccionado]);

  // Seleccionar un socio de las sugerencias
  function seleccionarSocio(socio) {
    ultimaBusqueda.current += 1;
    setCargandoSocios(false);

    const nombreCompleto = [socio.nombre, socio.apellido_p, socio.apellido_m]
      .filter(Boolean)
      .join(" ");

    setSocioSeleccionado(socio);
    setBusqueda(nombreCompleto);
    setSociosFiltrados([]);
    setMostrarSugerencias(false);
    setMensaje("");
    setTipoMensaje("");
  }

  // Enviar inscripción al backend
  async function confirmarInscripcion(e) {
    e.preventDefault();

    if (enviando) return;

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
    setTipoMensaje("");

    try {
      const resultado = await registrarInscripcion(
        socioSeleccionado.id,
        Number(sesionSeleccionada)
      );
      setMensaje(resultado.mensaje || "Inscripción registrada correctamente.");
      setTipoMensaje("exito");

      // Limpiar formulario y actualizar cupos disponibles tras éxito
      setBusqueda("");
      setSocioSeleccionado(null);
      setSesionSeleccionada("");
      setMostrarSugerencias(false);

      obtenerSesiones()
        .then((datos) => {
          if (componenteActivo.current && Array.isArray(datos)) {
            setSesiones(datos);
          }
        })
        .catch(() => {});
    } catch (err) {
      setMensaje(
        err.message || "Ocurrió un error al registrar la inscripción."
      );
      setTipoMensaje("error");
    } finally {
      if (componenteActivo.current) {
        setEnviando(false);
      }
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
          <label htmlFor="buscar-socio">Buscar socio</label>

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
                setTipoMensaje("");
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
                    <p className="sin-resultados" role="status">
                      Buscando socios…
                    </p>
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
          <label htmlFor="seleccionar-sesion">Sesión disponible</label>

          <select
            id="seleccionar-sesion"
            value={sesionSeleccionada}
            disabled={cargandoSesiones || enviando}
            onChange={(e) => {
              setSesionSeleccionada(e.target.value);
              setMensaje("");
              setTipoMensaje("");
            }}
          >
            <option value="">
              {cargandoSesiones
                ? "Cargando sesiones…"
                : "Selecciona una sesión"}
            </option>

            {sesiones.map((sesion) => (
              <option key={sesion.sesion_id} value={sesion.sesion_id}>
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
            disabled={enviando || cargandoSesiones}
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
