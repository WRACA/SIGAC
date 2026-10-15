import DashboardLayout from "../components/DashboardLayout.jsx";

const opciones = [
  { nombre: "Inicio", ruta: "/instructor" },
  { nombre: "Mis clases", ruta: "/instructor/clases" },
  { nombre: "Mis horarios", ruta: "/instructor/horarios" },
  { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
  { nombre: "Mi perfil", ruta: "/instructor/perfil" },
];

const estadisticas = [
  { titulo: "Clases asignadas", valor: "4" },
  { titulo: "Clases esta semana", valor: "8" },
  { titulo: "Alumnos inscritos", valor: "35" },
  { titulo: "Próxima clase", valor: "10:00 AM" },
];

export default function Instructor() {
  return (
    <DashboardLayout
      titulo="Panel de Instructor"
      rol="Instructor"
      opciones={opciones}
    >
      <h2>¡Bienvenido, instructor!</h2>

      <p>
        Consulta tus clases asignadas, revisa tus horarios
        y conoce a los alumnos inscritos en tus actividades.
      </p>

      <div className="dashboard-tarjetas">
        {estadisticas.map((estadistica) => (
          <div
            key={estadistica.titulo}
            className="dashboard-tarjeta"
          >
            <h3>{estadistica.titulo}</h3>
            <p>{estadistica.valor}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
