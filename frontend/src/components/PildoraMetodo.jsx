import "../assets/PildoraMetodo.css";

/**
 * Píldora segmentada para elegir una sola opción (p. ej. el método de inscripción).
 * El fondo naranja se desliza hacia la opción activa.
 *
 * @param {{
 *   opciones: Array<{ valor: string, etiqueta: string, Icono?: Function }>,
 *   valor: string,
 *   onCambiar: (valor: string) => void,
 *   disabled?: boolean,
 *   etiqueta?: string,
 * }} props
 */
export default function PildoraMetodo({ opciones, valor, onCambiar, disabled = false, etiqueta }) {
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.valor === valor)
  );

  // Flechas izquierda/derecha cambian de opción, como en un grupo de radios
  const alPresionar = (e) => {
    if (disabled) return;
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1
      : 0;
    if (!delta) return;
    e.preventDefault();
    const siguiente = opciones[(indice + delta + opciones.length) % opciones.length];
    onCambiar(siguiente.valor);
    e.currentTarget.querySelectorAll("[role=radio]")[
      (indice + delta + opciones.length) % opciones.length
    ]?.focus();
  };

  return (
    <div
      className={`pildora-metodo ${disabled ? "pildora-metodo-deshabilitada" : ""}`}
      role="radiogroup"
      aria-label={etiqueta}
      aria-disabled={disabled}
      onKeyDown={alPresionar}
      style={{ "--pildora-opciones": opciones.length, "--pildora-indice": indice }}
    >
      <span className="pildora-metodo-fondo" aria-hidden="true" />
      {opciones.map(({ valor: v, etiqueta: texto, Icono }) => {
        const activo = v === valor;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            className={`pildora-metodo-opcion ${activo ? "activa" : ""}`}
            disabled={disabled}
            onClick={() => onCambiar(v)}
          >
            {Icono && <Icono aria-hidden="true" />}
            <span>{texto}</span>
          </button>
        );
      })}
    </div>
  );
}
