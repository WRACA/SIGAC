import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import "../assets/ModalCalendario.css";

// Modal genérico para mostrar el calendario sin ocupar espacio en la página.
// Se renderiza en document.body para no heredar estilos de la página.
// Se cierra con el botón ×, clic fuera o la tecla Escape.
export default function ModalCalendario({ titulo, onCerrar, children }) {
  const cajaRef = useRef(null);

  // Escape para cerrar, bloqueo del scroll de fondo y foco inicial
  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPresionar);

    const scrollOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const caja = cajaRef.current;
    (caja?.querySelector(".calendario-mensual-dia.seleccionado") || caja)?.focus();

    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = scrollOriginal;
    };
  }, [onCerrar]);

  return createPortal(
    <div className="modal-calendario-overlay" onClick={onCerrar}>
      <div
        ref={cajaRef}
        className="modal-calendario-caja"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-calendario-titulo"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-calendario-encabezado">
          <h3 id="modal-calendario-titulo">{titulo}</h3>
          <button
            type="button"
            className="modal-calendario-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar calendario"
          >
            <FaXmark />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
