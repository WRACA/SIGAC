import { useCallback, useEffect, useRef, useState } from "react";
import { FaKeyboard, FaQrcode } from "react-icons/fa6";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import SelectorSesion from "../components/SelectorSesion.jsx";
import PildoraMetodo from "../components/PildoraMetodo.jsx";
import InscripcionQR from "../components/InscripcionQR.jsx";
import { useSesionesSemana } from "../hooks/useSesionesSemana.js";
import { formatearHorasPg } from "../utils/formato.js";
import { hoyISO } from "../utils/fechas.js";
import "../assets/InscripcionRecepcion.css";
import {
  buscarSocios,
  obtenerClasesRecepcion,
  obtenerSesiones,
  registrarInscripcion,
} from "../services/inscripciones.js";

// Menú de Recepcionista
const { opciones } = menus.recepcionista;

const etiquetaHora = (s) => formatearHorasPg(s.inicio, s.fin);

// Método de inscripción: se recuerda el último usado; la primera vez es QR
const CLAVE_METODO = "sigac:metodoInscripcion";
const METODOS = [
  { valor: "manual", etiqueta: "Manual", Icono: FaKeyboard },
  { valor: "qr", etiqueta: "Código QR", Icono: FaQrcode },
];
const esMetodo = (m) => m === "manual" || m === "qr";

function metodoInicial(searchParams) {
  const enUrl = searchParams.get("metodo");
  if (esMetodo(enUrl)) return enUrl;
  // ?q= viene de Socios y precarga el buscador manual
  if (searchParams.get("q")) return "manual";
  const guardado = localStorage.getItem(CLAVE_METODO);
  return esMetodo(guardado) ? guardado : "qr";
}

export default function InscripcionRecepcion() {
  // Permite llegar con una búsqueda precargada (?q=...) desde la vista de socios
  // o con una sesión preseleccionada (?sesionId=...&fecha=...) desde Actividades
  const [searchParams, setSearchParams] = useSearchParams();
  const [metodo, setMetodo] = useState(() => metodoInicial(searchParams));
  // true mientras el lector QR tiene la cámara activa o procesa una lectura
  const [lectorOcupado, setLectorOcupado] = useState(false);
  const [busqueda, setBusqueda] = useState(() => searchParams.get("q") || "");
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(
    () => searchParams.get("sesionId") || ""
  );
  const [mostrarSugerencias, setMostrarSugerencias] = useState(
    () => Boolean(searchParams.get("q"))
  );
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  // Resultados de la API
  const [sociosFiltrados, setSociosFiltrados] = useState([]);

  // Clases y sesiones disponibles, cargadas por semana
  const semana = useSesionesSemana({
    cargarSesiones: obtenerSesiones,
    cargarClases: obtenerClasesRecepcion,
  });
  const { sesiones, listo, recargar, irAFecha } = semana;

  // Si llega una sesión preseleccionada, carga la semana de su fecha
  useEffect(() => {
    const fecha = searchParams.get("fecha");
    if (fecha) irAFecha(fecha);
    // Solo al montar: la navegación posterior la controla el selector
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Estados de carga
  const [cargandoSocios, setCargandoSocios] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const debounceRef = useRef(null);
  const ultimaBusqueda = useRef(0);
  const componenteActivo = useRef(false);

  // Marca el componente como montado (las sesiones las carga useSesionesSemana)
  useEffect(() => {
    componenteActivo.current = true;

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
    if (!socio.activo) {
      setMensaje("No puedes inscribir a un socio con cuenta inactiva.");
      setTipoMensaje("error");
      return;
    }

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

    if (!socioSeleccionado.activo) {
      setMensaje("No puedes registrar una inscripción para un socio inactivo.");
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

      recargar();
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

  // Cambia el método: lo recuerda y lo refleja en la URL sin perder otros parámetros
  function cambiarMetodo(nuevo) {
    setMetodo(nuevo);
    localStorage.setItem(CLAVE_METODO, nuevo);
    setSearchParams(
      (actuales) => {
        const params = new URLSearchParams(actuales);
        params.set("metodo", nuevo);
        return params;
      },
      { replace: true }
    );
  }

  const alCambiarLector = useCallback((ocupado) => setLectorOcupado(ocupado), []);

  const cambiarSesion = (id) => {
    setSesionSeleccionada(id);
    setMensaje("");
    setTipoMensaje("");
  };

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
        <h2>Inscripción de socios</h2>

        <p>
          Elige el método, selecciona la sesión disponible e identifica
          al socio buscándolo o escaneando su credencial QR.
        </p>

        <PildoraMetodo
          opciones={METODOS}
          valor={metodo}
          onCambiar={cambiarMetodo}
          disabled={lectorOcupado || enviando}
          etiqueta="Método de inscripción"
        />

        {/* SESIÓN (común a ambos métodos) */}
        <div className="inscripcion-formulario inscripcion-sesion">
          <SelectorSesion
            {...semana}
            sesionId={sesionSeleccionada}
            onCambiar={cambiarSesion}
            etiquetaHora={etiquetaHora}
            idBase="seleccionar-sesion"
            minFecha={hoyISO()}
            disabled={!listo || enviando || lectorOcupado}
            permitirVacio
            placeholderClase={
              !listo ? "Cargando sesiones…" : "Selecciona una clase"
            }
          />
        </div>

        {metodo === "qr" ? (
          <div className="inscripcion-qr">
            <InscripcionQR
              key={sesionSeleccionada}
              sesion={sesionActual}
              onEstadoCambia={alCambiarLector}
            />
          </div>
        ) : (
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
                        className={`sugerencia-socio ${!socio.activo ? "socio-inactivo" : ""}`}
                        onClick={() => seleccionarSocio(socio)}
                        disabled={!socio.activo}
                        > <span>
                          {nombre} — #{socio.numero_socio}
                          </span>

                          <span className="estado-socio">
                            {socio.activo ? "Activo" : "Inactivo"}
                            </span>
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
            disabled={enviando || !listo}
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
        )}
      </div>
    </DashboardLayout>
  );
}
