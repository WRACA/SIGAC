import { useCallback, useEffect, useState } from "react";
import { FaRegCalendar } from "react-icons/fa6";
import CalendarioMensual from "./CalendarioMensual.jsx";
import ModalCalendario from "./ModalCalendario.jsx";
import { formatearFecha } from "../utils/formato.js";
import "../assets/SelectorSesion.css";

// Selector de sesión compacto en tres pasos: clase → día → hora.
// El calendario se abre en un modal para no quitarle espacio a la página.
// Las sesiones llegan por semana (ver useSesionesSemana); al elegir un día de
// otra semana se pide esa semana y la hora se elige cuando llegan los datos.
export default function SelectorSesion({
  clases,
  sesiones,
  semana,
  cargando,
  error,
  irAFecha,
  sesionId,
  onCambiar,
  etiquetaHora,
  idBase,
  minFecha,
  disabled = false,
  permitirVacio = false,
  placeholderClase = "Selecciona una clase",
}) {
  const sesionActual = sesiones.find((s) => String(s.sesion_id) === sesionId);

  const [clase, setClase] = useState("");
  const [fecha, setFecha] = useState(null);
  // Selección automática pendiente hasta que llegue la semana: { clase, fecha, modo }
  const [pendiente, setPendiente] = useState(null);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const cerrarCalendario = useCallback(() => setCalendarioAbierto(false), []);

  // Si la sesión seleccionada cambia desde fuera (URL, preselección), se reflejan su clase y día
  const [idPrevio, setIdPrevio] = useState(null);
  const idActual = sesionActual ? sesionActual.sesion_id : null;
  if (idActual !== idPrevio) {
    setIdPrevio(idActual);
    if (sesionActual) {
      setClase(sesionActual.actividad);
      setFecha(sesionActual.fecha);
    }
  }

  const semanaContiene = (f) => Boolean(semana) && f >= semana.desde && f <= semana.hasta;

  // Resuelve la selección pendiente cuando ya está cargada la semana del día pedido
  useEffect(() => {
    if (!pendiente || cargando || !semanaContiene(pendiente.fecha)) return;

    const delDia = sesiones.filter(
      (s) => s.actividad === pendiente.clase && s.fecha === pendiente.fecha
    );
    const enCurso = delDia.find((s) => s.en_curso);
    // Al elegir clase: en curso → próxima → la última del día (si todas ya pasaron).
    // Al elegir día: en curso → la primera del día.
    const elegida =
      pendiente.modo === "clase"
        ? enCurso ??
          delDia.find((s) => s.estado_tiempo !== "finalizada") ??
          delDia[delDia.length - 1]
        : enCurso ?? delDia[0];

    setPendiente(null);
    onCambiar(elegida ? String(elegida.sesion_id) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendiente, cargando, semana, sesiones]);

  const cambiarClase = (nueva) => {
    setClase(nueva);
    if (!nueva) {
      setFecha(null);
      setPendiente(null);
      onCambiar("");
      return;
    }
    const sugerida = clases.find((c) => c.actividad === nueva)?.fecha_sugerida ?? null;
    setFecha(sugerida);
    if (sugerida) {
      setPendiente({ clase: nueva, fecha: sugerida, modo: "clase" });
      irAFecha(sugerida);
    } else {
      onCambiar("");
    }
  };

  const elegirDia = (dia) => {
    setCalendarioAbierto(false);
    setFecha(dia);
    setPendiente({ clase, fecha: dia, modo: "dia" });
    irAFecha(dia);
  };

  // Días de la semana cargada en los que la clase tiene sesión
  const diasConSesion = new Set(
    sesiones.filter((s) => s.actividad === clase).map((s) => s.fecha)
  );

  const fechaCargada = fecha && semanaContiene(fecha);
  const horarios = fechaCargada
    ? sesiones.filter((s) => s.actividad === clase && s.fecha === fecha)
    : [];
  const valorHora =
    sesionActual && horarios.some((s) => s.sesion_id === sesionActual.sesion_id)
      ? sesionId
      : "";

  let placeholderHora = null;
  if (!clase) placeholderHora = "Selecciona una clase primero";
  else if (!fecha) placeholderHora = "Selecciona un día";
  else if (!fechaCargada || pendiente) placeholderHora = "Cargando horarios…";
  else if (horarios.length === 0) placeholderHora = "Sin sesiones de esta clase este día";
  else if (!valorHora) placeholderHora = "Selecciona una hora";

  const diaDeshabilitado = disabled || !clase;

  return (
    <div className="selector-sesion">
      <div className="selector-sesion-campo">
        <label htmlFor={`${idBase}-clase`}>Clase</label>
        <select
          id={`${idBase}-clase`}
          value={clase}
          onChange={(e) => cambiarClase(e.target.value)}
          disabled={disabled}
        >
          {(permitirVacio || !clase) && <option value="">{placeholderClase}</option>}
          {clases.map((c) => (
            <option key={c.actividad} value={c.actividad}>
              {c.actividad}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-sesion-campo">
        <label htmlFor={`${idBase}-dia`}>Día</label>
        <button
          id={`${idBase}-dia`}
          type="button"
          className="selector-sesion-dia"
          onClick={() => setCalendarioAbierto(true)}
          disabled={diaDeshabilitado}
          aria-haspopup="dialog"
        >
          <span>{fecha ? formatearFecha(fecha) : "Selecciona un día"}</span>
          <FaRegCalendar aria-hidden="true" />
        </button>

        {calendarioAbierto && !diaDeshabilitado && (
          <ModalCalendario titulo={`Elige el día de ${clase}`} onCerrar={cerrarCalendario}>
            <CalendarioMensual
              fechaSeleccionada={fecha}
              semanaCargada={semana}
              diasConSesion={diasConSesion}
              minFecha={minFecha}
              onElegirDia={elegirDia}
              idEtiqueta="modal-calendario-titulo"
            />
          </ModalCalendario>
        )}
      </div>

      <div className="selector-sesion-campo">
        <label htmlFor={`${idBase}-hora`}>Hora</label>
        <select
          id={`${idBase}-hora`}
          value={valorHora}
          onChange={(e) => onCambiar(e.target.value)}
          disabled={disabled || horarios.length === 0}
        >
          {placeholderHora && <option value="">{placeholderHora}</option>}
          {horarios.map((s) => (
            <option key={s.sesion_id} value={s.sesion_id}>
              {etiquetaHora(s)}
            </option>
          ))}
        </select>
        {error && <p className="selector-sesion-error">{error}</p>}
      </div>
    </div>
  );
}
