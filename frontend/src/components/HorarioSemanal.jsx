import { useMemo } from "react";
import { HORA_24 } from "../utils/formato.js";
import "../assets/MiHorario.css";

const HORA_INICIO = 6;
const HORA_FIN = 22;
const ALTURA_HORA = 64;

// Lunes (a medianoche) de la semana que contiene la fecha
export function obtenerInicioSemana(fecha) {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

  const dia = inicio.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;

  inicio.setDate(inicio.getDate() + diferencia);
  inicio.setHours(0, 0, 0, 0);

  return inicio;
}

export function sumarDias(fecha, cantidad) {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + cantidad);
  return resultado;
}

function mismaFecha(fecha1, fecha2) {
  return (
    fecha1.getFullYear() === fecha2.getFullYear() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getDate() === fecha2.getDate()
  );
}

function formatoHora(fecha) {
  return fecha.toLocaleTimeString("es-MX", HORA_24);
}

function formatoFecha(fecha) {
  return fecha.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function obtenerTextoSemana(inicio, fin) {
  const opcionesFecha = { day: "numeric", month: "long" };

  const primera = inicio.toLocaleDateString("es-MX", opcionesFecha);
  const ultima = fin.toLocaleDateString("es-MX", {
    ...opcionesFecha,
    year: "numeric",
  });

  return `${primera} - ${ultima}`;
}

/**
 * Cuadrícula semanal (lunes–domingo, 06:00–22:00) con navegación ‹ › Hoy.
 *
 * eventos: [{ id, titulo, inicio: Date, fin: Date, detalles: string[], cancelada? }]
 * Solo se dibujan los eventos que caen en la semana visible.
 */
export default function HorarioSemanal({
  semana,
  onCambiarSemana,
  eventos,
  cargando,
  error,
  textoCargando,
  textoError,
  textoVacio,
  detalleVacio,
}) {
  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, indice) => sumarDias(semana, indice)),
    [semana]
  );

  const sesiones = useMemo(() => {
    return eventos
      .filter((evento) => evento.inicio && evento.fin && evento.fin > evento.inicio)
      .filter((evento) => dias.some((dia) => mismaFecha(evento.inicio, dia)))
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  }, [eventos, dias]);

  const horas = Array.from(
    { length: HORA_FIN - HORA_INICIO },
    (_, indice) => HORA_INICIO + indice
  );

  const finSemana = sumarDias(semana, 6);

  return (
    <>
      <div className="calendario-controles">
        <div className="calendario-navegacion">
          <button onClick={() => onCambiarSemana(sumarDias(semana, -7))} aria-label="Semana anterior">
            <span aria-hidden="true">‹</span>
          </button>

          <button onClick={() => onCambiarSemana(sumarDias(semana, 7))} aria-label="Semana siguiente">
            <span aria-hidden="true">›</span>
          </button>

          <button
            className="calendario-hoy"
            onClick={() => onCambiarSemana(obtenerInicioSemana(new Date()))}
          >
            Hoy
          </button>
        </div>

        <h3>{obtenerTextoSemana(semana, finSemana)}</h3>
      </div>

      {cargando && (
        <div className="horario-mensaje">
          <p>{textoCargando}</p>
        </div>
      )}

      {!cargando && error && (
        <div className="horario-mensaje error">
          <h3>{textoError}</h3>
          <p>{error}</p>
        </div>
      )}

      {!cargando && !error && (
        <>
          {sesiones.length === 0 && (
            <div className="horario-sin-sesiones">
              <h3>{textoVacio}</h3>
              <p>{detalleVacio}</p>
            </div>
          )}

          <div className="calendario-contenedor">
            <div className="calendario">
              <div className="calendario-cabecera">
                <div className="calendario-esquina">Hora</div>

                {dias.map((dia) => (
                  <div
                    className={`calendario-dia ${
                      mismaFecha(dia, new Date()) ? "dia-actual" : ""
                    }`}
                    key={dia.toISOString()}
                  >
                    <span>
                      {dia.toLocaleDateString("es-MX", {
                        weekday: "short",
                      })}
                    </span>
                    <strong>{dia.getDate()}</strong>
                    <small>{formatoFecha(dia)}</small>
                  </div>
                ))}
              </div>

              <div className="calendario-cuerpo">
                <div className="calendario-horas">
                  {horas.map((hora) => (
                    <div className="calendario-hora" key={hora}>
                      {String(hora).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {dias.map((dia) => {
                  const sesionesDelDia = sesiones.filter((sesion) =>
                    mismaFecha(sesion.inicio, dia)
                  );

                  return (
                    <div className="calendario-columna" key={dia.toISOString()}>
                      {horas.map((hora) => (
                        <div className="calendario-celda" key={hora} />
                      ))}

                      {sesionesDelDia.map((sesion) => {
                        const minutosInicio =
                          sesion.inicio.getHours() * 60 + sesion.inicio.getMinutes();

                        const minutosFin =
                          sesion.fin.getHours() * 60 + sesion.fin.getMinutes();

                        const inicioVisible = Math.max(minutosInicio, HORA_INICIO * 60);

                        const finVisible = Math.min(minutosFin, HORA_FIN * 60);

                        if (finVisible <= inicioVisible) return null;

                        const top = ((inicioVisible - HORA_INICIO * 60) / 60) * ALTURA_HORA;

                        const altura = Math.max(
                          ((finVisible - inicioVisible) / 60) * ALTURA_HORA,
                          46
                        );

                        return (
                          <article
                            className={`sesion-calendario ${
                              sesion.cancelada ? "sesion-cancelada" : ""
                            }`}
                            key={sesion.id}
                            style={{
                              top: `${top}px`,
                              height: `${altura}px`,
                            }}
                            title={`${sesion.titulo} | ${formatoHora(
                              sesion.inicio
                            )} - ${formatoHora(sesion.fin)}${
                              sesion.cancelada ? " | Cancelada" : ""
                            }`}
                          >
                            <strong>{sesion.titulo}</strong>
                            <span>
                              {formatoHora(sesion.inicio)} - {formatoHora(sesion.fin)}
                            </span>
                            {sesion.cancelada && (
                              <small className="sesion-cancelada-etiqueta">Cancelada</small>
                            )}
                            {sesion.detalles.map((detalle, i) => (
                              <small key={i}>{detalle}</small>
                            ))}
                          </article>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
