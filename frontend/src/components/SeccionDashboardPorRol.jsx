import { Navigate, useParams } from "react-router-dom";
import SeccionDashboard from "./SeccionDashboard.jsx";

const configuracion = {
  recepcionista: {
    nombre: "Recepcionista",
    opciones: [
      { nombre: "Inicio", ruta: "/recepcionista" },
      { nombre: "Socios", ruta: "/recepcionista/socios" },
      { nombre: "Inscripciones", ruta: "/recepcionista/inscripciones" },
      { nombre: "Actividades", ruta: "/recepcionista/actividades" },
    ],
  },
  socio: {
    nombre: "Socio",
    opciones: [
      { nombre: "Inicio", ruta: "/socio" },
      { nombre: "Mis actividades", ruta: "/socio/actividades" },
      { nombre: "Mis inscripciones", ruta: "/socio/inscripciones" },
      { nombre: "Horarios", ruta: "/socio/horarios" },
      { nombre: "Mi perfil", ruta: "/socio/perfil" },
    ],
  },
  instructor: {
    nombre: "Instructor",
    opciones: [
      { nombre: "Inicio", ruta: "/instructor" },
      { nombre: "Mis clases", ruta: "/instructor/clases" },
      { nombre: "Mis horarios", ruta: "/instructor/horarios" },
      { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
      { nombre: "Mi perfil", ruta: "/instructor/perfil" },
    ],
  },
};

export default function SeccionDashboardPorRol({ rol }) {
  const { seccion } = useParams();
  const datos = configuracion[rol];

  const opcion = datos.opciones.find(
    (item) => item.ruta === `/${rol}/${seccion}`
  );

  if (!opcion) {
    return <Navigate to={`/${rol}`} replace />;
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
