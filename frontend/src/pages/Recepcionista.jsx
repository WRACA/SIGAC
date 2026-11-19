import { useEffect, useState } from "react";

import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerDashboardRecepcion } from "../services/recepcion.js";
import { parsearFechaPg } from "../utils/formato.js";

import "../assets/Recepcionista.css";

const { nombre: rol, opciones } = menus.recepcionista;

// Formato de hora para las sesiones
function mostrarHora(fecha) {
  const d = parsearFechaPg(fecha);

  if (Number.isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Formato de fecha para la bienvenida
function obtenerFechaActual() {
  return new Date().toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Convierte los estados técnicos en textos legibles
function mostrarEstado(estado) {
  const estados = {
    programada: "Programada",
    en_curso: "En curso",
    realizada: "Realizada",
    cancelada: "Cancelada",
  };

  return estados[estado] || estado;
}

// Evita repetir sesiones en los avisos
function obtenerSesionesUnicas(sesiones) {
  return [
    ...new Map(
      sesiones.map((sesion) => [sesion.sesion_id, sesion])
    ).values(),
  ];
}

export default function Recepcionista() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerDashboardRecepcion()
      .then((datos) => {
        if (activo) {
          setDashboard(datos);
        }
      })
      .catch((err) => {
        if (activo) {
          setError(err.message || "No se pudo cargar la información.");
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  if (error) {
    return (
      <DashboardLayout titulo="Panel de Recepción" rol={rol} opciones={opciones}>
        <p className="dashboard-error">{error}</p>
      </DashboardLayout>
    );
  }

  if (!dashboard) {
    return (
      <DashboardLayout titulo="Panel de Recepción" rol={rol} opciones={opciones}>
        <p className="dashboard-cargando">
          Cargando información del panel...
        </p>
      </DashboardLayout>
    );
  }

  const { resumen, actividades_hoy, proximas_actividades } = dashboard;

  const sesionesLlenas = obtenerSesionesUnicas([
    ...actividades_hoy,
    ...proximas_actividades,
  ]).filter((sesion) => Number(sesion.cupos_disponibles) === 0);

  const sesionesCanceladas = actividades_hoy.filter(
    (sesion) => sesion.estado === "cancelada"
  );

  const sesionesEnCurso = actividades_hoy.filter(
    (sesion) => sesion.estado === "en_curso"
  );

  const tarjetas = [
    {
      titulo: "Socios registrados",
      valor: resumen.total_socios,
    },
    {
      titulo: "Socios activos",
      valor: resumen.socios_activos,
    },
    {
      titulo: "Inscripciones de hoy",
      valor: resumen.inscripciones_hoy,
    },
    {
      titulo: "Sesiones de hoy",
      valor: resumen.sesiones_hoy,
    },
  ];

  return (
    <DashboardLayout titulo="Panel de Recepción" rol={rol} opciones={opciones}>
      {/* BIENVENIDA */}
      <section className="recepcion-bienvenida">
        <h2>¡Bienvenido al panel de recepción!</h2>

        <p>
          Consulta el resumen de socios, las actividades deportivas
          y las sesiones programadas del club.
        </p>

        <span className="recepcion-fecha">
          {obtenerFechaActual()}
        </span>
      </section>

      {/* RESUMEN GENERAL */}
      <section className="recepcion-seccion">
        <h2>Resumen general</h2>

        <div className="recepcion-resumen">
          {tarjetas.map((tarjeta) => (
            <article
              key={tarjeta.titulo}
              className="recepcion-resumen-tarjeta"
            >
              <span>{tarjeta.titulo}</span>
              <strong>{tarjeta.valor ?? 0}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* ACTIVIDADES DE HOY */}
      <section className="recepcion-seccion">
        <h2>Actividades de hoy</h2>

        {actividades_hoy.length === 0 ? (
          <p className="recepcion-tabla-vacio">
            No hay actividades programadas para hoy.
          </p>
        ) : (
          <div className="recepcion-tabla-contenedor">
            <table className="recepcion-tabla">
              <thead>
                <tr>
                  <th>Horario</th>
                  <th>Actividad</th>
                  <th>Instructor</th>
                  <th>Ocupación</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {actividades_hoy.map((sesion) => (
                  <tr key={sesion.sesion_id}>
                    <td>
                      {mostrarHora(sesion.inicio)} - {mostrarHora(sesion.fin)}
                    </td>

                    <td>{sesion.actividad}</td>

                    <td>{sesion.coach}</td>

                    <td>
                      {sesion.total_inscritos} / {sesion.cupo}
                    </td>

                    <td>
                      <span
                        className={`recepcion-estado ${
                          sesion.estado.replace("_", "-")
                        }`}
                      >
                        {mostrarEstado(sesion.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* PRÓXIMAS ACTIVIDADES */}
      <section className="recepcion-seccion">
        <h2>Próximas actividades</h2>

        {proximas_actividades.length === 0 ? (
          <p className="recepcion-tabla-vacio">
            No hay próximas actividades programadas.
          </p>
        ) : (
          <div className="recepcion-tabla-contenedor">
            <table className="recepcion-tabla">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Actividad</th>
                  <th>Instructor</th>
                  <th>Lugares disponibles</th>
                </tr>
              </thead>

              <tbody>
                {proximas_actividades.map((sesion) => (
                  <tr key={sesion.sesion_id}>
                    <td>
                      {new Date(
                        parsearFechaPg(sesion.inicio)
                      ).toLocaleDateString("es-MX", {
                        timeZone: "America/Mexico_City",
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      · {mostrarHora(sesion.inicio)}
                    </td>

                    <td>{sesion.actividad}</td>

                    <td>{sesion.coach}</td>

                    <td>
                      {sesion.cupos_disponibles} de {sesion.cupo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* INFORMACIÓN ADICIONAL */}
      <section className="recepcion-seccion">
        <h2>Información adicional</h2>

        <div className="recepcion-avisos">
          <article className="recepcion-aviso general">
            <h3>Estado de las actividades</h3>

            <p>
              Hoy hay {actividades_hoy.length} sesiones programadas.
              Actualmente hay {sesionesEnCurso.length} en curso.
            </p>
          </article>

          <article className="recepcion-aviso lleno">
            <h3>Sesiones sin lugares disponibles</h3>

            {sesionesLlenas.length === 0 ? (
              <p>No hay sesiones llenas entre las actividades consultadas.</p>
            ) : (
              <p>
                {sesionesLlenas.map((sesion) => sesion.actividad).join(", ")}
                {" "}no tiene lugares disponibles.
              </p>
            )}
          </article>

          <article className="recepcion-aviso cancelado">
            <h3>Sesiones canceladas</h3>

            {sesionesCanceladas.length === 0 ? (
              <p>No hay sesiones canceladas para hoy.</p>
            ) : (
              <p>
                {sesionesCanceladas.map((sesion) => sesion.actividad).join(", ")}
              </p>
            )}
          </article>
        </div>
      </section>
    </DashboardLayout>
  );
}