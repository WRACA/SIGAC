import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

import EscanerQR from "./EscanerQR.jsx";
import { registrarAsistenciaQR } from "../services/asistencias.js";

import "../assets/SelectorSesionQR.css";

// Tiempo que se muestra el resultado antes de reanudar el escaneo (ms)
const ESPERA_REANUDAR = 2000;

/**
 * Lector QR para registrar asistencias durante una sesión.
 * Desplegar el panel enciende la cámara y colapsarlo la apaga.
 * Tras cada lectura muestra el resultado y vuelve a escanear automáticamente.
 *
 * @param {{ sesionId: string, onRegistrada?: () => Promise<void> | void }} props
 */
export default function LectorQRAsistencia({ sesionId, onRegistrada }) {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null); // { tipo: "exito" | "error", mensaje }
  const procesandoRef = useRef(false);

  // La cámara está activa solo con el panel desplegado y sin resultado pendiente
  const escaneando = panelAbierto && !procesando && !resultado;

  // Desplegar enciende la cámara; colapsar la apaga (desmonta el escáner)
  function alternarPanel() {
    if (procesando) return;

    setResultado(null);
    setPanelAbierto((abierto) => !abierto);
  }

  // Reanuda el escaneo después de mostrar el resultado
  useEffect(() => {
    if (!resultado || !panelAbierto) return;

    const temporizador = setTimeout(() => setResultado(null), ESPERA_REANUDAR);
    return () => clearTimeout(temporizador);
  }, [resultado, panelAbierto]);

  // Envía el contenido leído al endpoint de asistencia
  const procesarLectura = useCallback(
    async (contenido) => {
      // Evita procesar una lectura mientras otra sigue en curso
      if (procesandoRef.current || !sesionId) return;

      procesandoRef.current = true;
      setProcesando(true);
      setResultado(null);

      let respuesta;
      try {
        respuesta = await registrarAsistenciaQR(sesionId, contenido);
      } catch (err) {
        setResultado({
          tipo: "error",
          mensaje: err.message || "No se pudo registrar la asistencia",
        });
        procesandoRef.current = false;
        setProcesando(false);
        return;
      }

      // Actualiza la lista de participantes; si falla, la asistencia ya quedó registrada
      try {
        await onRegistrada?.();
      } catch {
        // La lista se actualizará en la siguiente consulta
      }

      setResultado({
        tipo: "exito",
        mensaje: respuesta?.mensaje || "Asistencia registrada correctamente",
      });
      procesandoRef.current = false;
      setProcesando(false);
    },
    [sesionId, onRegistrada]
  );

  return (
    <section className="lector-qr-panel lector-qr-habilitado">
      <button
        type="button"
        className="lector-qr-encabezado"
        onClick={alternarPanel}
        disabled={procesando}
        aria-expanded={panelAbierto}
        aria-controls="lector-qr-asistencia"
      >
        <h3>Registro de asistencia mediante QR</h3>
        {panelAbierto ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {!panelAbierto ? (
        <p>
          Despliega el lector para activar la cámara y escanear la credencial
          del socio. Colápsalo para terminar.
        </p>
      ) : (
        <div id="lector-qr-asistencia">
          {escaneando && <EscanerQR onLectura={procesarLectura} />}

          {procesando && (
            <p className="lector-qr-procesando">Registrando asistencia...</p>
          )}

          {resultado && (
            <div
              className={`lector-qr-resultado lector-qr-resultado-${resultado.tipo}`}
              role="status"
            >
              <strong>
                {resultado.tipo === "exito"
                  ? "Asistencia registrada"
                  : "Asistencia rechazada"}
              </strong>
              <p>{resultado.mensaje}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
