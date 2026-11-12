import { Navigate, useParams } from "react-router-dom";
import SeccionDashboard from "./SeccionDashboard.jsx";
import { menus } from "./menus.js";

export default function SeccionDashboardPorRol({ rol }) {
  const { seccion } = useParams();
  const datos = menus[rol];

  const opcion = datos?.opciones.find(
    (item) =>
      item.ruta === `/${rol}/${seccion}` ||
      item.ruta === `/recepcion/${seccion}` ||
      item.ruta === `/recepcionista/${seccion}`
  );

  if (!opcion) {
    return <Navigate to={rol === "recepcionista" ? "/recepcion" : `/${rol}`} replace />;
  }

  return (
    <SeccionDashboard
      titulo={opcion.nombre}
      rol={datos.nombre}
      opciones={datos.opciones}
      descripcion={`Consulta la información de ${opcion.nombre.toLowerCase()} en SIGAC.`}
    />
  );
}
