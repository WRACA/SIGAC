import { QRCodeSVG } from "qrcode.react";
import { obtenerPaletaQR, PALETA_QR_POR_DEFECTO } from "../utils/paletasQR.js";

/**
 * Dibuja un código QR a partir de una cadena de texto.
 * Es genérico: no sabe nada de socios, se puede reutilizar en cualquier vista.
 *
 * @param {string} valor - Texto que se codifica en el QR
 * @param {string} [paleta="clasica"] - id de una paleta de utils/paletasQR.js
 * @param {number} [tamano=220] - Lado del QR en píxeles
 * @param {string} [etiqueta="Código QR"] - Texto accesible del código
 */
export default function CodigoQR({
  valor,
  paleta = PALETA_QR_POR_DEFECTO,
  tamano = 220,
  etiqueta = "Código QR",
}) {
  const colores = obtenerPaletaQR(paleta);

  return (
    <div
      className="inline-block rounded-xl border-2 bg-gris p-3 transition-colors duration-300"
      style={{ borderColor: colores.borde }}
    >
      <QRCodeSVG
        value={valor}
        size={tamano}
        level="M"
        marginSize={4} // zona de silencio: necesaria para que la cámara detecte el código
        fgColor={colores.modulos}
        bgColor={colores.fondo}
        title={etiqueta}
        role="img"
        aria-label={etiqueta}
        className="block h-auto max-w-full rounded-md"
      />
    </div>
  );
}
