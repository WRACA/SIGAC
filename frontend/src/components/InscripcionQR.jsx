import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

import EscanerQR from "./EscanerQR.jsx";
import { inscribirPorQR } from "../services/inscripciones.js";

import "../assets/SelectorSesionQR.css";

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

/**
 * Inscripción mediante el escaneo de la credencial QR del socio.
 * Desplegar el panel enciende la cámara y colapsarlo la apaga.
 * La página debe montarlo con key={sesionId} para que al cambiar de sesión
 * se colapse el lector y se limpie el resultado.
 *
 * @param {{ sesion?: Object, onEstadoCambia?: (ocupado: boolean) => void }} props
 */
export default function InscripcionQR({ sesion, onEstadoCambia }) {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null); // { tipo: "exito" | "error", mensaje }
  const procesandoRef = useRef(false);

  const sesionId = sesion ? String(sesion.sesion_id) : "";

  // La cámara está activa solo con el panel desplegado y sin resultado pendiente
  const escaneando = panelAbierto && !procesando && !resultado;

  // Avisa a la página si el lector está ocupado (para bloquear sesión y método)
  useEffect(() => {
    onEstadoCambia?.(escaneando || procesando);
  }, [escaneando, procesando, onEstadoCambia]);

  useEffect(() => () => onEstadoCambia?.(false), [onEstadoCambia]);

  // Desplegar enciende la cámara; colapsar la apaga (desmonta el escáner)
  function alternarPanel() {
    if (!sesion || procesando) return;

    if (!panelAbierto) {
      setResultado(null);
    }
    setPanelAbierto((abierto) => !abierto);
  }

  // Envía el contenido leído al endpoint de inscripción
  const procesarLectura = useCallback(
    async (contenido) => {
      // Evita procesar una lectura mientras otra sigue en curso
      if (procesandoRef.current || !sesionId) return;

      procesandoRef.current = true;
      setProcesando(true);
      setResultado(null);

      try {
        const respuesta = await inscribirPorQR(sesionId, contenido);
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
    [sesionId]
  );

  return (
    <>
      <section
        className={`lector-qr-panel ${
          sesion ? "lector-qr-habilitado" : "lector-qr-bloqueado"
        }`}
      >
        <button
          type="button"
          className="lector-qr-encabezado"
          onClick={alternarPanel}
          disabled={!sesion || procesando}
          aria-expanded={panelAbierto}
          aria-controls="lector-qr-contenido"
        >
          <h3>Lector de código QR</h3>
          {sesion && (panelAbierto ? <FaChevronUp /> : <FaChevronDown />)}
        </button>

        {!sesion ? (
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

      {sesion && (
        <section className="selector-qr-detalles">
          <h3>Detalles de la sesión seleccionada</h3>

          <p>
            <strong>Actividad:</strong> {sesion.actividad}
          </p>

          <p>
            <strong>Inicio:</strong>{" "}
            {formatearFecha(sesion.inicio)}
          </p>

          <p>
            <strong>Fin:</strong>{" "}
            {formatearFecha(sesion.fin)}
          </p>

          <p>
            <strong>Instructor:</strong>{" "}
            {sesion.coach || "No asignado"}
          </p>

          <p>
            <strong>Lugar:</strong>{" "}
            {sesion.lugar || "No especificado"}
          </p>

          <p>
            <strong>Cupos disponibles:</strong>{" "}
            {sesion.cupos_disponibles}
          </p>
        </section>
      )}
    </>
  );
}
