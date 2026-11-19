import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { diasDelMes, hoyISO } from "../utils/fechas.js";
import "../assets/CalendarioMensual.css";

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

// Calendario mensual (lunes–domingo) para elegir el día de una sesión.
// Solo se conocen las sesiones de la semana cargada: ahí los días sin sesión
// quedan deshabilitados; los demás días se pueden elegir y cargan su semana.
export default function CalendarioMensual({
  fechaSeleccionada,
  semanaCargada,
  diasConSesion,
  minFecha,
  deshabilitado = false,
  onElegirDia,
  idEtiqueta,
}) {
  const base = fechaSeleccionada || hoyISO();
  const [mes, setMes] = useState(() => mesDe(base));

  // Si la fecha seleccionada cambia a otro mes, el calendario la sigue
  const [fechaPrevia, setFechaPrevia] = useState(fechaSeleccionada);
  if (fechaSeleccionada !== fechaPrevia) {
    setFechaPrevia(fechaSeleccionada);
    if (fechaSeleccionada) setMes(mesDe(fechaSeleccionada));
  }

  const hoy = hoyISO();
  const celdas = diasDelMes(mes.anio, mes.mes);
  const titulo = new Date(mes.anio, mes.mes, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  // Recepción: no se puede ir a meses anteriores al de minFecha
  const puedeRetroceder = !minFecha || primerDia(mes) > minFecha;

  const moverMes = (delta) => {
    const d = new Date(mes.anio, mes.mes + delta, 1);
    setMes({ anio: d.getFullYear(), mes: d.getMonth() });
  };

  const enSemanaCargada = (fecha) =>
    Boolean(semanaCargada) && fecha >= semanaCargada.desde && fecha <= semanaCargada.hasta;

  return (
    <div
      className={`calendario-mensual ${deshabilitado ? "calendario-deshabilitado" : ""}`}
      role="group"
      aria-labelledby={idEtiqueta}
    >
      <div className="calendario-mensual-encabezado">
        <button
          type="button"
          onClick={() => moverMes(-1)}
          disabled={!puedeRetroceder}
          aria-label="Mes anterior"
        >
          <FaChevronLeft />
        </button>
        <span className="calendario-mensual-titulo">{titulo}</span>
        <button type="button" onClick={() => moverMes(1)} aria-label="Mes siguiente">
          <FaChevronRight />
        </button>
      </div>

      <div className="calendario-mensual-cuadricula">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia} className="calendario-mensual-dia-semana">
            {dia}
          </span>
        ))}

        {celdas.map((fecha, i) => {
          if (!fecha) return <span key={`vacio-${i}`} />;

          const cargada = enSemanaCargada(fecha);
          const conSesion = cargada && diasConSesion.has(fecha);
          const bloqueado =
            deshabilitado || (minFecha && fecha < minFecha) || (cargada && !conSesion);

          const clases = [
            "calendario-mensual-dia",
            fecha === fechaSeleccionada && "seleccionado",
            fecha === hoy && "hoy",
            conSesion && "con-sesion",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={fecha}
              type="button"
              className={clases}
              disabled={bloqueado}
              onClick={() => onElegirDia(fecha)}
              aria-pressed={fecha === fechaSeleccionada}
              aria-label={fecha}
            >
              {Number(fecha.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function mesDe(iso) {
  const [anio, mes] = iso.split("-").map(Number);
  return { anio, mes: mes - 1 };
}

function primerDia({ anio, mes }) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
}
