import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import "../assets/SociosInscritos.css";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

// Datos de ejemplo. Posteriormente se obtendrán del backend.
const clases = [
  { id: "1", nombre: "Entrenamiento funcional" },
  { id: "2", nombre: "Acondicionamiento físico" },
  { id: "3", nombre: "Circuito de fuerza" },
  { id: "4", nombre: "Cardio grupal" },
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

export default function SociosInscritos() {
  const [searchParams, setSearchParams] = useSearchParams();

  const claseId = searchParams.get("claseId") || "1";

  const claseSeleccionada = clases.find(
    (clase) => clase.id === claseId
  );

  const socios = claseSeleccionada
    ? sociosPorClase[claseSeleccionada.id] || []
    : [];

  const cambiarClase = (event) => {
    setSearchParams({ claseId: event.target.value });
  };

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
              Consulta los participantes registrados en cada una
              de tus clases.
            </p>
          </div>
        </div>

        <div className="socios-inscritos-panel">
          <h3>Seleccionar clase</h3>

          <label htmlFor="clase-inscritos">
            Clase asignada
          </label>

          <select
            id="clase-inscritos"
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

        <div className="socios-inscritos-panel">
          <div className="socios-inscritos-lista-encabezado">
            <div>
              <h3>Lista de participantes</h3>

              <p>
                {claseSeleccionada
                  ? claseSeleccionada.nombre
                  : "No hay una clase seleccionada"}
              </p>
            </div>

            <span className="socios-inscritos-total">
              {socios.length} {socios.length === 1 ? "socio" : "socios"}
            </span>
          </div>

          {claseSeleccionada ? (
            socios.length > 0 ? (
              <div className="socios-inscritos-tabla-contenedor">
                <table className="socios-inscritos-tabla">
                  <thead>
                    <tr>
                      <th style={{ width: "60px", textAlign: "center" }}>#</th>
                      <th>Nombre del alumno</th>
                    </tr>
                  </thead>

                  <tbody>
                    {socios.map((socio, index) => (
                      <tr key={socio.id}>
                        <td style={{ textAlign: "center", color: "#888" }}>{index + 1}</td>
                        <td>{socio.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="socios-inscritos-vacio">
                <h3>No hay socios inscritos</h3>
                <p>
                  Actualmente no hay participantes registrados
                  en esta clase.
                </p>
              </div>
            )
          ) : (
            <div className="socios-inscritos-vacio">
              <h3>Clase no encontrada</h3>
              <p>
                Selecciona una clase válida para consultar
                sus participantes.
              </p>
            </div>
          )}
        </div>

        <p className="socios-inscritos-nota">
          La consulta de participantes está disponible antes,
          durante y después del horario de cada clase.
        </p>
      </section>
    </DashboardLayout>
  );
}