
import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

import DashboardLayout from "../components/DashboardLayout.jsx";
import EscanerQR from "../components/EscanerQR.jsx";
import { menus } from "../components/menus.js";
import { inscribirPorQR, obtenerSesiones } from "../services/inscripciones.js";

import "../assets/SelectorSesionQR.css";

const { nombre: rol, opciones } = menus.recepcionista;

// Formatea la fecha y hora de una sesión
function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  return new Date(fecha).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SelectorSesionQR() {
  const [sesiones, setSesiones] = useState([]);
  const [sesionSeleccionada, setSesionSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  // Estado del lector QR
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null); // { tipo: "exito" | "error", mensaje }
  const procesandoRef = useRef(false);

  // Consulta las sesiones disponibles al cargar la pantalla
  useEffect(() => {
    let activo = true;

    async function cargarSesiones() {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerSesiones();

        if (activo) {
          setSesiones(Array.isArray(datos) ? datos : []);
        }
      } catch (err) {
        if (activo) {
          setError(err.message || "No fue posible cargar las sesiones.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarSesiones();

    return () => {
      activo = false;
    };
  }, [intento]);

  // Obtiene la información de la sesión seleccionada
  const sesionActual = sesiones.find(
    (sesion) => String(sesion.sesion_id) === sesionSeleccionada
  );

  // La cámara está activa solo con el panel desplegado y sin resultado pendiente
  const escaneando = panelAbierto && !procesando && !resultado;

  // Cambiar de sesión colapsa el lector (apaga la cámara) y limpia el resultado
  function cambiarSesion(valor) {
    setSesionSeleccionada(valor);
    setPanelAbierto(false);
    setResultado(null);
  }

  // Desplegar enciende la cámara; colapsar la apaga (desmonta el escáner)
  function alternarPanel() {
    if (!sesionActual || procesando) return;

    if (!panelAbierto) {
      setResultado(null);
    }
    setPanelAbierto((abierto) => !abierto);
  }

  // Envía el contenido leído al endpoint de inscripción
  const procesarLectura = useCallback(
    async (contenido) => {
      // Evita procesar una lectura mientras otra sigue en curso
      if (procesandoRef.current || !sesionSeleccionada) return;

      procesandoRef.current = true;
      setProcesando(true);
      setResultado(null);

      try {
        const respuesta = await inscribirPorQR(sesionSeleccionada, contenido);
        setResultado({
          tipo: "exito",
          mensaje: respuesta?.mensaje || "Inscripción registrada correctamente",
        });
      } catch (err) {
        setResultado({
          tipo: "error",
          mensaje: err.message || "No se pudo inscribir al socio",
        });
      } finally {
        procesandoRef.current = false;
        setProcesando(false);
      }
    },
    [sesionSeleccionada]
  );

  return (
    <DashboardLayout
      titulo="Inscripción QR"
      rol={rol}
      opciones={opciones}
    >
      <div className="selector-qr-contenedor">
        <section
          className={`lector-qr-panel ${
            sesionActual ? "lector-qr-habilitado" : "lector-qr-bloqueado"
          }`}
        >
          <button
            type="button"
            className="lector-qr-encabezado"
            onClick={alternarPanel}
            disabled={!sesionActual || procesando}
            aria-expanded={panelAbierto}
            aria-controls="lector-qr-contenido"
          >
            <h3>Lector de código QR</h3>
            {sesionActual &&
              (panelAbierto ? <FaChevronUp /> : <FaChevronDown />)}
          </button>

          {!sesionActual ? (
            <p>
              Primero debes seleccionar una sesión para habilitar
              el lector QR.
            </p>
          ) : !panelAbierto ? (
            <p>
              Despliega el lector para activar la cámara y escanear
              la credencial del socio.
            </p>
          ) : (
            <div id="lector-qr-contenido">
              {escaneando && <EscanerQR onLectura={procesarLectura} />}

              {procesando && (
                <p className="lector-qr-procesando">
                  Procesando inscripción...
                </p>
              )}

              {resultado && (
                <div
                  className={`lector-qr-resultado lector-qr-resultado-${resultado.tipo}`}
                  role="status"
                >
                  <strong>
                    {resultado.tipo === "exito"
                      ? "Socio inscrito"
                      : "Inscripción rechazada"}
                  </strong>
                  <p>{resultado.mensaje}</p>

                  <button
                    type="button"
                    onClick={() => setResultado(null)}
                  >
                    Escanear siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <h2>Inscripción mediante código QR</h2>

        <p className="selector-qr-descripcion">
          Selecciona la sesión en la que deseas registrar la asistencia
          de un socio mediante su código QR.
        </p>

        <section className="selector-qr-seccion">
          <label htmlFor="sesion-qr">
            Seleccionar sesión
          </label>

          {cargando ? (
            <p className="selector-qr-mensaje">
              Cargando sesiones disponibles...
            </p>
          ) : error ? (
            <div className="selector-qr-error">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => setIntento((actual) => actual + 1)}
              >
                Reintentar
              </button>
            </div>
          ) : sesiones.length === 0 ? (
            <p className="selector-qr-mensaje">
              No hay sesiones disponibles en este momento.
            </p>
          ) : (
            <select
              id="sesion-qr"
              value={sesionSeleccionada}
              onChange={(e) => cambiarSesion(e.target.value)}
              disabled={escaneando || procesando}
            >
              <option value="">Selecciona una sesión</option>

              {sesiones.map((sesion) => (
                <option
                  key={sesion.sesion_id}
                  value={sesion.sesion_id}
                >
                  {sesion.actividad} —{" "}
                  {new Date(sesion.inicio).toLocaleString("es-MX")}{" "}
                  ({sesion.cupos_disponibles} cupos)
                </option>
              ))}
            </select>
          )}
        </section>

        {sesionActual && (
          <section className="selector-qr-detalles">
            <h3>Detalles de la sesión seleccionada</h3>

            <p>
              <strong>Actividad:</strong> {sesionActual.actividad}
            </p>

            <p>
              <strong>Inicio:</strong>{" "}
              {formatearFecha(sesionActual.inicio)}
            </p>

            <p>
              <strong>Fin:</strong>{" "}
              {formatearFecha(sesionActual.fin)}
            </p>

            <p>
              <strong>Instructor:</strong>{" "}
              {sesionActual.coach || "No asignado"}
            </p>

            <p>
              <strong>Lugar:</strong>{" "}
              {sesionActual.lugar || "No especificado"}
            </p>

            <p>
              <strong>Cupos disponibles:</strong>{" "}
              {sesionActual.cupos_disponibles}
            </p>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
