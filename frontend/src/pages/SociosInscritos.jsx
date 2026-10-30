
import DashboardLayout from "../components/DashboardLayout.jsx";
import "../assets/SociosInscritos.css";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

export default function SociosInscritos() {
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
              Consulta los participantes registrados en tus clases.
            </p>
          </div>
        </div>

        <div className="socios-inscritos-panel">
          <h3>Seleccionar clase</h3>

          <label htmlFor="clase-inscritos">
            Clase asignada
          </label>

          <select id="clase-inscritos" disabled>
            <option>
              Clases pendientes de conexión con el backend
            </option>
          </select>

          <div className="socios-inscritos-estado">
            <h3>Información no disponible</h3>
            <p>
              Aún no es posible consultar las clases ni sus
              socios inscritos porque la API correspondiente
              no está implementada.
            </p>
          </div>
        </div>

        <div className="socios-inscritos-panel">
          <h3>Lista de participantes</h3>

          <div className="socios-inscritos-tabla-contenedor">
            <table className="socios-inscritos-tabla">
              <thead>
                <tr>
                  <th>Identificador</th>
                  <th>Nombre del socio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="2" className="socios-inscritos-vacio">
                    No hay información de inscritos para mostrar.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
