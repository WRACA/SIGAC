
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { obtenerMisInscripciones } from "../services/socio.js";
import "../assets/MiHorario.css";

const opciones = [
  { nombre: "Inicio", ruta: "/socio" },
  { nombre: "Mis actividades", ruta: "/socio/actividades" },
  { nombre: "Mi horario", ruta: "/socio/horarios" },
  { nombre: "Mi perfil", ruta: "/socio/perfil" },
];

const HORA_INICIO = 6;
const HORA_FIN = 22;
const ALTURA_HORA = 64;

function interpretarFecha(fecha) {
  if (!fecha) return null;

  // Convierte el formato de PostgreSQL a ISO y conserva su zona horaria.
  let formatoISO = fecha.replace(" ", "T");

  // Normaliza offsets como +00 a +00:00.
  formatoISO = formatoISO.replace(/([+-]\d{2})$/, "$1:00");

  const resultado = new Date(formatoISO);

  return Number.isNaN(resultado.getTime()) ? null : resultado;
}

function obtenerInicioSemana(fecha) {
  const inicio = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate()
  );

  const dia = inicio.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;

  inicio.setDate(inicio.getDate() + diferencia);
  inicio.setHours(0, 0, 0, 0);

  return inicio;
}

function sumarDias(fecha, cantidad) {
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
  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

export default function MiHorario() {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [semana, setSemana] = useState(() =>
    obtenerInicioSemana(new Date())
  );

  useEffect(() => {
    async function cargarHorario() {
      try {
        const datos = await obtenerMisInscripciones();
        setInscripciones(datos);
      } catch (err) {
        setError(err.message || "No fue posible cargar tu horario.");
      } finally {
        setCargando(false);
      }
    }

    cargarHorario();
  }, []);

  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, indice) => sumarDias(semana, indice)),
    [semana]
  );

  const sesiones = useMemo(() => {
    return inscripciones
      .map((inscripcion) => ({
        ...inscripcion,
        fechaInicio: interpretarFecha(inscripcion.inicio),
        fechaFin: interpretarFecha(inscripcion.fin),
      }))
      .filter(
        (inscripcion) =>
          inscripcion.fechaInicio &&
          inscripcion.fechaFin &&
          inscripcion.fechaFin > inscripcion.fechaInicio
      )
      .filter((inscripcion) => {
        const fecha = inscripcion.fechaInicio;
        return dias.some((dia) => mismaFecha(fecha, dia));
      })
      .sort(
        (a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime()
      );
  }, [inscripciones, dias]);

  const semanaAnterior = () => {
    setSemana((actual) => sumarDias(actual, -7));
  };

  const semanaSiguiente = () => {
    setSemana((actual) => sumarDias(actual, 7));
  };

  const irAHoy = () => {
    setSemana(obtenerInicioSemana(new Date()));
  };

  const horas = Array.from(
    { length: HORA_FIN - HORA_INICIO },
    (_, indice) => HORA_INICIO + indice
  );

  const finSemana = sumarDias(semana, 6);

  return (
    <DashboardLayout
      titulo="Mi horario"
      rol="Socio"
      opciones={opciones}
    >
      <section className="mi-horario">
        <header className="mi-horario-encabezado">
          <span className="mi-horario-etiqueta">ESPACIO PERSONAL</span>
          <p>
            Consulta los días y horarios de las sesiones en las que
            estás inscrito.
          </p>
        </header>

        <div className="calendario-controles">
          <div className="calendario-navegacion">
            <button onClick={semanaAnterior} aria-label="Semana anterior">
              <span aria-hidden="true">‹</span>
            </button>

            <button onClick={semanaSiguiente} aria-label="Semana siguiente">
              <span aria-hidden="true">›</span>
            </button>

            <button className="calendario-hoy" onClick={irAHoy}>
              Hoy
            </button>
          </div>

          <h3>{obtenerTextoSemana(semana, finSemana)}</h3>
        </div>

        {cargando && (
          <div className="horario-mensaje">
            <p>Cargando tu horario...</p>
          </div>
        )}

        {!cargando && error && (
          <div className="horario-mensaje error">
            <h3>No fue posible cargar tu horario</h3>
            <p>{error}</p>
          </div>
        )}

        {!cargando && !error && (
          <>
            {sesiones.length === 0 && (
              <div className="horario-sin-sesiones">
                <h3>No tienes sesiones esta semana</h3>
                <p>
                  Prueba consultando otra semana para encontrar tus
                  próximas actividades.
                </p>
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
                      mismaFecha(sesion.fechaInicio, dia)
                    );

                    return (
                      <div className="calendario-columna" key={dia.toISOString()}>
                        {horas.map((hora) => (
                          <div className="calendario-celda" key={hora} />
                        ))}

                        {sesionesDelDia.map((sesion) => {
                          const minutosInicio =
                            sesion.fechaInicio.getHours() * 60 +
                            sesion.fechaInicio.getMinutes();

                          const minutosFin =
                            sesion.fechaFin.getHours() * 60 +
                            sesion.fechaFin.getMinutes();

                          const inicioVisible = Math.max(
                            minutosInicio,
                            HORA_INICIO * 60
                          );

                          const finVisible = Math.min(
                            minutosFin,
                            HORA_FIN * 60
                          );

                          if (finVisible <= inicioVisible) return null;

                          const top =
                            ((inicioVisible - HORA_INICIO * 60) / 60) *
                            ALTURA_HORA;

                          const altura = Math.max(
                            ((finVisible - inicioVisible) / 60) *
                              ALTURA_HORA,
                            46
                          );

                          return (
                            <article
                              className="sesion-calendario"
                              key={sesion.id}
                              style={{
                                top: `${top}px`,
                                height: `${altura}px`,
                              }}
                              title={`${sesion.actividad} | ${formatoHora(
                                sesion.fechaInicio
                              )} - ${formatoHora(sesion.fechaFin)}`}
                            >
                              <strong>{sesion.actividad}</strong>
                              <span>
                                {formatoHora(sesion.fechaInicio)} -{" "}
                                {formatoHora(sesion.fechaFin)}
                              </span>
                              <small>{sesion.coach || "Instructor no disponible"}</small>
                              {sesion.lugar && (
                                <small>{sesion.lugar}</small>
                              )}
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
      </section>
    </DashboardLayout>
  );
}