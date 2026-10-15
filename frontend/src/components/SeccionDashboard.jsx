import DashboardLayout from "./DashboardLayout.jsx";

export default function SeccionDashboard({
  titulo,
  rol,
  opciones,
  descripcion,
}) {
  return (
    <DashboardLayout
      titulo={titulo}
      rol={rol}
      opciones={opciones}
    >
      <h2>{titulo}</h2>
      <p>{descripcion}</p>

      <div className="dashboard-tarjetas">
        <div className="dashboard-tarjeta">
          <h3>Información</h3>
          <p style={{ fontSize: "16px", color: "#fff" }}>
            Esta sección está preparada para integrar
            los datos del sistema.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
