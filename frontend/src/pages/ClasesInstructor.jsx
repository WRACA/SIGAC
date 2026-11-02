
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import "../assets/ClasesInstructor.css";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

// Datos de ejemplo. Posteriormente se obtendrán del backend.
const clasesEjemplo = [
  {
    id: 1,
    nombre: "Entrenamiento funcional",
    horario: "08:00 AM - 09:00 AM",
    dias: "Lunes y miércoles",
    estado: "Asignada",
  },
  {
    id: 2,
    nombre: "Acondicionamiento físico",
    horario: "10:00 AM - 11:00 AM",
    dias: "Martes y jueves",
    estado: "Asignada",
  },
  {
    id: 3,
    nombre: "Circuito de fuerza",
    horario: "05:00 PM - 06:00 PM",
    dias: "Lunes, miércoles y viernes",
    estado: "Asignada",
  },
  {
    id: 4,
    nombre: "Cardio grupal",
    horario: "06:00 PM - 07:00 PM",
    dias: "Martes y jueves",
    estado: "Asignada",
  },
];

export default function ClasesInstructor() {
  const navigate = useNavigate();

  return (
    <DashboardLayout
      titulo="Mis clases"
      rol="Instructor"
      opciones={opciones}
    >
      <section className="clases-instructor">
        <div className="clases-instructor-encabezado">
          <div>
            <span className="clases-instructor-etiqueta">
              PANEL DE INSTRUCTOR
            </span>

            <h2>Mis clases asignadas</h2>

            <p>
              Consulta tus clases y revisa los socios inscritos
              en cada una de tus actividades.
            </p>
          </div>

          <div className="clases-instructor-total">
            <span>Total de clases</span>
            <strong>{clasesEjemplo.length}</strong>
          </div>
        </div>

        <div className="clases-instructor-grid">
          {clasesEjemplo.map((clase) => (
            <article className="clase-instructor-card" key={clase.id}>
              <div className="clase-instructor-card-superior">
                <span className="clase-instructor-icono">
                  <span>✦</span>
                </span>

                <span className="clase-instructor-estado">
                  {clase.estado}
                </span>
              </div>

              <h3>{clase.nombre}</h3>

              <div className="clase-instructor-detalles">
                <p>
                  <span>Horario</span>
                  {clase.horario}
                </p>

                <p>
                  <span>Días</span>
                  {clase.dias}
                </p>
              </div>

              <button
                type="button"
                className="clase-instructor-boton"
                onClick={() =>
                  navigate(`/instructor/alumnos?claseId=${clase.id}`)
                }
              >
                Ver inscritos
                <span>→</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}