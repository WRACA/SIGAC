
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import {
  obtenerAsistencias,
  registrarAsistencia,
} from "../services/asistencias.js";
import "../assets/PaseLista.css";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

// Datos de prueba. Posteriormente se obtendrán del backend.
const clases = [
  {
    id: "1",
    nombre: "Entrenamiento funcional",
    inicio: "08:00",
    fin: "09:00",
    dias: [1, 3],
  },
  {
    id: "2",
    nombre: "Acondicionamiento físico",
    inicio: "10:00",
    fin: "11:00",
    dias: [2, 4],
  },
  {
    id: "3",
    nombre: "Circuito de fuerza",
    inicio: "17:00",
    fin: "18:00",
    dias: [1, 3, 5],
  },
  {
    id: "4",
    nombre: "Cardio grupal",
    inicio: "18:00",
    fin: "19:00",
    dias: [2, 4],
  },
];

const sociosPorClase = {
  1: [
    { id: "SOC-001", nombre: "Carlos Hernández" },
    { id: "SOC-002", nombre: "María González" },
    { id: "SOC-003", nombre: "José Ramírez" },
  ],
  2: [
    { id: "SOC-004", nombre: "Ana Martínez" },
    { id: "SOC-005", nombre: "Luis Torres" },
  ],
  3: [
    { id: "SOC-006", nombre: "Sofía López" },
    { id: "SOC-007", nombre: "Diego Pérez" },
    { id: "SOC-008", nombre: "Valeria Cruz" },
  ],
  4: [],
};

const obtenerEstadoClase = (clase, fecha) => {
  const dia = fecha.getDay();
  const hora = fecha.getHours() * 60 + fecha.getMinutes();

  const [horaInicio, minutoInicio] = clase.inicio.split(":").map(Number);
  const [horaFin, minutoFin] = clase.fin.split(":").map(Number);

  const inicio = horaInicio * 60 + minutoInicio;
  const fin = horaFin * 60 + minutoFin;

  if (!clase.dias.includes(dia)) return "fuera";
  if (hora < inicio) return "antes";
  if (hora >= fin) return "despues";

  return "durante";
};

export default function PaseLista() {
  const [searchParams, setSearchParams] = useSearchParams();
  const claseId = searchParams.get("claseId") || "1";

  const [fechaActual, setFechaActual] = useState(new Date());
  const [asistencias, setAsistencias] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const claseSeleccionada = clases.find(
    (clase) => clase.id === claseId
  );

  const socios = sociosPorClase[claseId] || [];

  const estado = claseSeleccionada
    ? obtenerEstadoClase(claseSeleccionada, fechaActual)
    : "fuera";

  const puedeRegistrar = estado === "durante";

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFechaActual(new Date());
    }, 30000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargarAsistencias() {
      try {
        const datos = await obtenerAsistencias(claseId);
        if (activo) {
          setAsistencias(datos);
        }
      } catch (err) {
        if (activo) setError(err.message);
      }
    }

    cargarAsistencias();

    return () => {
      activo = false;
    };
  }, [claseId]);

  const cambiarClase = (event) => {
    setSearchParams({ claseId: event.target.value });
    setMensaje("");
    setError("");
  };

  const marcarAsistencia = async (socioId) => {
    setMensaje("");
    setError("");

    if (!puedeRegistrar) {
      setError("El registro solo está disponible durante la clase.");
      return;
    }

    try {
      const nuevaAsistencia = await registrarAsistencia(
        claseId,
        socioId
      );

      setAsistencias((actuales) => [
        ...actuales,
        nuevaAsistencia,
      ]);

      setMensaje("Asistencia registrada correctamente.");
    } catch (err) {
      setError(err.message);
    }
  };

  const yaTieneAsistencia = (socioId) =>
    asistencias.some(
      (asistencia) => asistencia.socioId === socioId
    );

  const estadoTexto = {
    antes: "La clase aún no comienza",
    durante: "Clase en curso",
    despues: "La clase ha finalizado",
    fuera: "Fuera del horario de clase",
  };

  return (
    <DashboardLayout
      titulo="Pase de lista"
      rol="Instructor"
      opciones={opciones}
    >
      <section className="pase-lista">
        <div className="pase-lista-encabezado">
          <div>
            <span className="pase-lista-etiqueta">
              PANEL DE INSTRUCTOR
            </span>
            <h2>Registro de asistencia</h2>
            <p>
              Marca la asistencia de los socios inscritos
              en tus clases.
            </p>
          </div>
        </div>

        <div className="pase-lista-panel">
          <label htmlFor="seleccionar-clase">
            Seleccionar clase
          </label>

          <select
            id="seleccionar-clase"
            value={claseSeleccionada ? claseId : ""}
            onChange={cambiarClase}
          >
            {!claseSeleccionada && (
              <option value="">Selecciona una clase</option>
            )}

            {clases.map((clase) => (
              <option key={clase.id} value={clase.id}>
                {clase.nombre}
              </option>
            ))}
          </select>
        </div>

        {claseSeleccionada && (
          <>
            <div className="pase-lista-panel">
              <div className="pase-lista-info">
                <div>
                  <h3>{claseSeleccionada.nombre}</h3>
                  <p>
                    Horario: {claseSeleccionada.inicio} -
                    {" "}{claseSeleccionada.fin}
                  </p>
                </div>

                <span className={`pase-lista-estado ${estado}`}>
                  {estadoTexto[estado]}
                </span>
              </div>

              <div className="pase-lista-resumen">
                <div>
                  <span>Socios inscritos</span>
                  <strong>{socios.length}</strong>
                </div>

                <div>
                  <span>Asistencias registradas</span>
                  <strong>{asistencias.length}</strong>
                </div>

                <div>
                  <span>Pendientes</span>
                  <strong>
                    {socios.length - asistencias.length}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pase-lista-panel">
              <h3>Lista de participantes</h3>

              {socios.length > 0 ? (
                <div className="pase-lista-tabla-contenedor">
                  <table className="pase-lista-tabla">
                    <thead>
                      <tr>
                        <th>Identificador</th>
                        <th>Nombre del socio</th>
                        <th>Asistencia</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {socios.map((socio) => {
                        const registrada = yaTieneAsistencia(socio.id);

                        return (
                          <tr key={socio.id}>
                            <td>{socio.id}</td>
                            <td>{socio.nombre}</td>
                            <td>
                              <span className={
                                registrada ? "asistencia-ok" : "asistencia-pendiente"
                              }>
                                {registrada ? "Registrada" : "Pendiente"}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                disabled={!puedeRegistrar || registrada}
                                onClick={() => marcarAsistencia(socio.id)}
                                className="pase-lista-boton"
                              >
                                {registrada
                                  ? "Registrada"
                                  : "Marcar asistencia"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pase-lista-vacio">
                  <h3>No hay socios inscritos</h3>
                  <p>
                    No existen participantes para esta clase.
                  </p>
                </div>
              )}

              {mensaje && (
                <p className="pase-lista-mensaje">{mensaje}</p>
              )}

              {error && (
                <p className="pase-lista-error">{error}</p>
              )}
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}