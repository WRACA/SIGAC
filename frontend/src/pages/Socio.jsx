import DashboardLayout from "../components/DashboardLayout.jsx";

const opciones = [
  { nombre: "Inicio", ruta: "/socio" },
  { nombre: "Mis actividades", ruta: "/socio/actividades" },
  { nombre: "Mis inscripciones", ruta: "/socio/inscripciones" },
  { nombre: "Horarios", ruta: "/socio/horarios" },
  { nombre: "Mi perfil", ruta: "/socio/perfil" },
];

const estadisticas = [
  { titulo: "Actividades inscritas", valor: "3" },
  { titulo: "Clases esta semana", valor: "5" },
  { titulo: "Próximas clases", valor: "2" },
  { titulo: "Estado de membresía", valor: "Activa" },
];

export default function Socio() {
  return (
    <DashboardLayout
      titulo="Panel de Socio"
      rol="Socio"
      opciones={opciones}
    >
      <h2>¡Bienvenido a SIGAC!</h2>

      <p>
        Consulta tus actividades deportivas, revisa tus
        horarios y administra tus inscripciones.
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
