import { useEffect, useRef, useState } from "react";

// Intervalo entre análisis de cuadros de la cámara (ms)
const INTERVALO_ESCANEO = 300;

// Devuelve un detector de QR: el nativo si el navegador lo soporta,
// o el ponyfill (ZXing WASM) cargado de forma diferida en caso contrario.
// Ambos exponen la misma API (BarcodeDetector).
async function crearDetector() {
  if ("BarcodeDetector" in window) {
    try {
      const formatos = await window.BarcodeDetector.getSupportedFormats();
      if (formatos.includes("qr_code")) {
        return new window.BarcodeDetector({ formats: ["qr_code"] });
      }
    } catch {
      // Si falla la consulta de formatos se usa el ponyfill
    }
  }

  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: ["qr_code"] });
}

// Traduce los errores de getUserMedia a mensajes para el usuario
function mensajeErrorCamara(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Se denegó el permiso para usar la cámara. Habilítalo en la configuración del navegador.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No se encontró una cámara disponible en este dispositivo.";
    case "NotReadableError":
      return "La cámara está siendo usada por otra aplicación.";
    default:
      return "No fue posible iniciar la cámara.";
  }
}

/**
 * Lector de códigos QR con la cámara del dispositivo.
 * La cámara se enciende al montar el componente y se apaga al desmontarlo.
 * Al detectar el primer QR apaga la cámara y llama una sola vez a `onLectura`.
 *
 * @param {{ onLectura: (contenido: string) => void }} props
 */
export default function EscanerQR({ onLectura }) {
  const videoRef = useRef(null);
  const onLecturaRef = useRef(onLectura);
  const [estado, setEstado] = useState("iniciando"); // iniciando | escaneando | error
  const [error, setError] = useState("");

  // Mantiene la referencia al callback más reciente sin reiniciar la cámara
  useEffect(() => {
    onLecturaRef.current = onLectura;
  }, [onLectura]);

  useEffect(() => {
    let cancelado = false;
    let detectado = false;
    let stream = null;
    let temporizador = null;

    function detenerTodo() {
      clearTimeout(temporizador);
      stream?.getTracks().forEach((pista) => pista.stop());
      stream = null;
    }

    async function iniciar() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError(
          "El navegador no permite usar la cámara en esta conexión. Abre el sistema mediante HTTPS."
        );
        setEstado("error");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        if (!cancelado) {
          setError(mensajeErrorCamara(err));
          setEstado("error");
        }
        return;
      }

      if (cancelado) {
        detenerTodo();
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});

      let detector;
      try {
        detector = await crearDetector();
      } catch {
        if (!cancelado) {
          detenerTodo();
          setError("No fue posible cargar el lector de códigos QR.");
          setEstado("error");
        }
        return;
      }

      if (cancelado) {
        detenerTodo();
        return;
      }

      setEstado("escaneando");

      async function escanear() {
        if (cancelado || detectado) return;

        if (video.readyState >= video.HAVE_ENOUGH_DATA) {
          try {
            const resultados = await detector.detect(video);
            const contenido = resultados[0]?.rawValue;

            if (contenido && !cancelado && !detectado) {
              // Lectura única: se apaga la cámara antes de notificar
              detectado = true;
              detenerTodo();
              navigator.vibrate?.(100);
              onLecturaRef.current?.(contenido);
              return;
            }
          } catch {
            // Es normal que un cuadro no contenga un QR legible
          }
        }

        temporizador = setTimeout(escanear, INTERVALO_ESCANEO);
      }

      escanear();
    }

    iniciar();

    return () => {
      cancelado = true;
      detenerTodo();
    };
  }, []);

  return (
    <div className="escaner-qr">
      {estado === "error" ? (
        <p className="escaner-qr-error">{error}</p>
      ) : (
        <>
          <div className="escaner-qr-marco">
            <video ref={videoRef} playsInline muted autoPlay />
          </div>
          <p className="escaner-qr-ayuda">
            {estado === "iniciando"
              ? "Iniciando cámara..."
              : "Coloca el código QR del socio frente a la cámara. El escaneo es automático."}
          </p>
        </>
      )}
    </div>
  );
}
