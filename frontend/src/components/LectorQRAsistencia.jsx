import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { registrarAsistenciaQR } from "../services/asistencias.js";

export default function LectorQRAsistencia({ sesionId, onRegistrada }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const procesandoRef = useRef(false);

  const [activo, setActivo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  const detenerCamara = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActivo(false);
  };

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  const iniciarCamara = async () => {
    setMensaje("");
    setTipoMensaje("");

    try {
      const lector = new BrowserMultiFormatReader();

      const dispositivos = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!dispositivos.length) {
        throw new Error("No se encontró ninguna cámara disponible.");
      }

      const camara = dispositivos.find((d) =>
        /back|rear|trasera|environment/i.test(d.label)
      ) || dispositivos[0];

      setActivo(true);

      const controls = await lector.decodeFromVideoDevice(
        camara.deviceId,
        videoRef.current,
        async (resultado) => {
          if (!resultado || procesandoRef.current) return;

          procesandoRef.current = true;
          setProcesando(true);
          setMensaje("Validando credencial QR...");
          setTipoMensaje("");

          try {
            const respuesta = await registrarAsistenciaQR(
              sesionId,
              resultado.getText()
            );

            setMensaje(respuesta.mensaje || "Asistencia registrada correctamente.");
            setTipoMensaje("exito");

            onRegistrada?.();
          } catch (error) {
            setMensaje(error.message || "No se pudo registrar la asistencia.");
            setTipoMensaje("error");
          } finally {
            setProcesando(false);

            // Evita leer repetidamente el mismo código.
            window.setTimeout(() => {
              procesandoRef.current = false;
            }, 1800);
          }
        }
      );

      controlsRef.current = controls;
    } catch (error) {
      detenerCamara();
      setMensaje(error.message || "No se pudo iniciar la cámara.");
      setTipoMensaje("error");
    }
  };

  return (
    <div className="pase-lista-lector">
      <h3>Registro de asistencia mediante QR</h3>
      <p>Escanea la credencial del socio para registrar su asistencia.</p>

      <video
        ref={videoRef}
        className="pase-lista-video"
        muted
        playsInline
      />

      <div className="pase-lista-lector-acciones">
        {!activo ? (
          <button type="button" onClick={iniciarCamara}>
            Activar cámara
          </button>
        ) : (
          <button type="button" onClick={detenerCamara}>
            Detener cámara
          </button>
        )}
      </div>

      {procesando && <p>Procesando código QR...</p>}

      {mensaje && (
        <p
          className={
            tipoMensaje === "exito"
              ? "pase-lista-mensaje"
              : "pase-lista-error"
          }
          role="status"
          aria-live="polite"
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}
