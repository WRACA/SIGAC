import DashboardLayout from "../components/DashboardLayout.jsx";

const opciones = [
  { nombre: "Inicio", ruta: "/recepcionista" },
  { nombre: "Socios", ruta: "/recepcionista/socios" },
  { nombre: "Inscripciones", ruta: "/recepcionista/inscripciones" },
  { nombre: "Actividades", ruta: "/recepcionista/actividades" },
];

const estadisticas = [
  { titulo: "Socios registrados", valor: "120" },
  { titulo: "Inscripciones activas", valor: "85" },
  { titulo: "Actividades disponibles", valor: "17" },
  { titulo: "Clases de hoy", valor: "8" },
];

export default function Recepcionista() {
  return (
    <DashboardLayout
      titulo="Panel de Recepción"
      rol="Recepcionista"
      opciones={opciones}
    >
      <h2>Bienvenido al panel de recepción</h2>

      <p>
        Desde aquí podrás consultar la información de los socios,
        las inscripciones y las actividades deportivas del club.
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
