import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import {
  obtenerClasesInstructor,
  obtenerInscritosClase,
} from "../services/instructor.js";
import "../assets/SociosInscritos.css";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Pase de lista", ruta: "/instructor/asistencia" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

export default function SociosInscritos() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de datos
  const [clases, setClases] = useState([]);
  const [cargandoClases, setCargandoClases] = useState(true);
  const [claseId, setClaseId] = useState(searchParams.get("claseId") || "");

  const [socios, setSocios] = useState([]);
  const [cargandoSocios, setCargandoSocios] = useState(false);
  const [errorSocios, setErrorSocios] = useState(null);

  // 1. Cargar las clases asignadas al instructor
  useEffect(() => {
    async function cargarClases() {
      setCargandoClases(true);
      try {
        const datos = await obtenerClasesInstructor();
        const lista = Array.isArray(datos) ? datos : [];
        setClases(lista);

        // Si hay una clase en la URL y existe en la lista, seleccionarla
        const idEnUrl = searchParams.get("claseId");
        if (idEnUrl && lista.some((c) => String(c.sesion_id) === String(idEnUrl))) {
          setClaseId(String(idEnUrl));
        } else if (lista.length > 0) {
          // Seleccionar la primera clase por defecto
          setClaseId(String(lista[0].sesion_id));
        }
      } catch (err) {
        setErrorSocios(
          err.message || "No fue posible cargar las clases asignadas."
        );
      } finally {
        setCargandoClases(false);
      }
    }

    cargarClases();
  }, [searchParams]);

  // 2. Cargar los socios inscritos al cambiar la clase seleccionada
  useEffect(() => {
    if (!claseId) {
      setSocios([]);
      return;
    }

    async function cargarInscritos() {
      setCargandoSocios(true);
      setErrorSocios(null);

      try {
        const datos = await obtenerInscritosClase(claseId);
        setSocios(Array.isArray(datos) ? datos : []);
      } catch (err) {
        setSocios([]);
        setErrorSocios(err.message || "Error al consultar los socios inscritos.");
      } finally {
        setCargandoSocios(false);
      }
    }

    cargarInscritos();
  }, [claseId]);

  const cambiarClase = (event) => {
    const nuevoId = event.target.value;
    setClaseId(nuevoId);
    setSearchParams({ claseId: nuevoId });
  };

  const claseSeleccionada = clases.find(
    (c) => String(c.sesion_id) === String(claseId)
  );

  return (
    <DashboardLayout
      titulo="Socios inscritos"
      rol="Instructor"
      opciones={opciones}
    >
      <section className="socios-inscritos">
        <div className="socios-inscritos-encabezado">
          <div>
            <span className="socios-inscritos-etiqueta">
              PANEL DE INSTRUCTOR
            </span>

            <h2>Socios inscritos por clase</h2>

            <p>
              Consulta los participantes registrados en cada una de tus
              clases asignadas.
            </p>
          </div>
        </div>

        {/* SELECTOR DE CLASE */}
        <div className="socios-inscritos-panel">
          <h3>Seleccionar clase</h3>

          <label htmlFor="clase-inscritos">Clase asignada</label>

          <select
            id="clase-inscritos"
            value={claseId}
            disabled={cargandoClases || clases.length === 0}
            onChange={cambiarClase}
          >
            {cargandoClases && (
              <option value="">Cargando clases asignadas...</option>
            )}

            {!cargandoClases && clases.length === 0 && (
              <option value="">No tienes clases asignadas</option>
            )}

            {!cargandoClases &&
              clases.map((clase) => (
                <option key={clase.sesion_id} value={clase.sesion_id}>
                  {clase.actividad} ({clase.fecha} · {clase.hora_inicio} -{" "}
                  {clase.hora_fin})
                </option>
              ))}
          </select>
        </div>

        {/* LISTADO DE PARTICIPANTES INSCRITOS */}
        <div className="socios-inscritos-panel">
          <div className="socios-inscritos-lista-encabezado">
            <div>
              <h3>Lista de participantes</h3>

              <p>
                {claseSeleccionada
                  ? `${claseSeleccionada.actividad} — ${claseSeleccionada.fecha} (${claseSeleccionada.hora_inicio} - ${claseSeleccionada.hora_fin})`
                  : "No hay una clase seleccionada"}
              </p>
            </div>

            <span className="socios-inscritos-total">
              {socios.length} {socios.length === 1 ? "socio" : "socios"}
            </span>
          </div>

          {cargandoSocios ? (
            <p style={{ color: "#888", padding: "20px 0" }}>
              Cargando socios inscritos...
            </p>
          ) : errorSocios ? (
            <div className="socios-inscritos-vacio">
              <h3>Error de consulta</h3>
              <p>{errorSocios}</p>
            </div>
          ) : claseSeleccionada ? (
            socios.length > 0 ? (
              <div className="socios-inscritos-tabla-contenedor">
                <table className="socios-inscritos-tabla">
                  <thead>
                    <tr>
                      <th style={{ width: "50px", textAlign: "center" }}>#</th>
                      <th>Identificador</th>
                      <th>Nombre del socio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {socios.map((socio, index) => {
                      const nombreCompleto = [
                        socio.nombre,
                        socio.apellido_p,
                        socio.apellido_m,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <tr key={socio.id}>
                          <td style={{ textAlign: "center", color: "#888" }}>
                            {index + 1}
                          </td>
                          <td style={{ color: "#ff8a4c", fontWeight: "600" }}>
                            #{socio.numero_socio}
                          </td>
                          <td>
                            <strong>{nombreCompleto}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background:
                                  socio.estado === "asistio"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "rgba(59, 130, 246, 0.15)",
                                color:
                                  socio.estado === "asistio"
                                    ? "#34d399"
                                    : "#60a5fa",
                              }}
                            >
                              {socio.estado === "asistio"
                                ? "Asistió"
                                : "Inscrito"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="socios-inscritos-vacio">
                <h3>No hay socios inscritos</h3>
                <p>
                  Actualmente no hay participantes registrados en esta clase.
                </p>
              </div>
            )
          ) : (
            <div className="socios-inscritos-vacio">
              <h3>Clase no encontrada</h3>
              <p>
                Selecciona una clase válida para consultar sus participantes.
              </p>
            </div>
          )}
        </div>

        <p className="socios-inscritos-nota">
          La consulta de participantes está disponible antes, durante y después
          del horario de cada clase.
        </p>
      </section>
    </DashboardLayout>
  );
}
