import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inicio from "./pages/Inicio.jsx";
import Deportes from "./pages/Deportes.jsx";
import Instalaciones from "./pages/Instalaciones.jsx";
import Membresias from "./pages/Membresias.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Login from "./pages/Login.jsx";

import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

import Recepcionista from "./pages/Recepcionista.jsx";
import Socio from "./pages/Socio.jsx";
import Instructor from "./pages/Instructor.jsx";
import ClasesInstructor from "./pages/ClasesInstructor.jsx";
import PaseLista from "./pages/PaseLista.jsx";
import InscripcionRecepcion from "./pages/InscripcionRecepcion.jsx";
import SociosRecepcion from "./pages/SociosRecepcion.jsx";
import SesionesRecepcion from "./pages/SesionesRecepcion.jsx";
import PerfilSocio from "./pages/PerfilSocio.jsx";
import HorariosSocio from "./pages/HorariosSocio.jsx";
import AccesoDenegado from "./pages/AccesoDenegado.jsx";
import MisActividades from "./pages/MisActividades.jsx";
import MiHorario from "./pages/MiHorario.jsx";
import MisInscripciones from "./pages/MisInscripciones.jsx";
import HorariosInstructor from "./pages/HorariosInstructor.jsx";

// Redirige conservando los parámetros de la URL (p. ej. ?sesionId=)
function RedirigirConParametros({ a }) {
  const { search } = useLocation();
  return <Navigate to={`${a}${search}`} replace />;
}

// /recepcionista/<seccion> → /recepcion/<seccion>
function RedirigirRecepcion() {
  const { seccion } = useParams();
  return <Navigate to={`/recepcion/${seccion}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* PÁGINAS PÚBLICAS */}
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="deportes" element={<Deportes />} />
        <Route path="instalaciones" element={<Instalaciones />} />
        <Route path="membresias" element={<Membresias />} />
        <Route path="nosotros" element={<Nosotros />} />
      </Route>

      {/* RUTAS DE AUTENTICACIÓN Y ERRORES */}
      <Route path="login" element={<Login />} />
      <Route path="acceso-denegado" element={<AccesoDenegado />} />

      {/* RUTAS PROTEGIDAS PARA SOCIOS */}
      <Route element={<ProtectedRoute rolesPermitidos={['socio']} />}>
        <Route path="socio" element={<Socio />} />
        <Route path="socio/perfil" element={<PerfilSocio />} />
        <Route path="socio/horarios" element={<HorariosSocio />} />
        <Route path="socio/actividades" element={<MisActividades />} />
        <Route path="socio/mi-horario" element={<MiHorario />} />
        <Route path="socio/inscripciones" element={<MisInscripciones />} />
        <Route path="socio/:seccion" element={<Navigate to="/socio" replace />} />
      </Route>

      {/* RUTAS PROTEGIDAS PARA INSTRUCTORES */}
      <Route element={<ProtectedRoute rolesPermitidos={['coach']} />}>
        <Route path="instructor" element={<Instructor />} />
        <Route path="instructor/clases" element={<ClasesInstructor />} />
        <Route path="instructor/alumnos" element={<RedirigirConParametros a="/instructor/asistencia" />} />
        <Route path="instructor/asistencia" element={<PaseLista />} />
        <Route path="instructor/horarios" element={<HorariosInstructor />} />
        <Route path="instructor/:seccion" element={<Navigate to="/instructor" replace />} />
      </Route>

      {/* RUTAS PROTEGIDAS PARA RECEPCIONISTAS/ADMINISTRADORES */}
      <Route element={<ProtectedRoute rolesPermitidos={['recepcionista', 'administrador']} />}>
        <Route path="recepcion" element={<Recepcionista />} />
        <Route path="recepcion/socios" element={<SociosRecepcion />} />
        <Route path="recepcion/inscripciones" element={<InscripcionRecepcion />} />
        <Route path="recepcion/actividades" element={<SesionesRecepcion />} />
        <Route path="recepcion/inscripcion-qr" element={<Navigate to="/recepcion/inscripciones?metodo=qr" replace />} />
        <Route path="recepcion/:seccion" element={<Navigate to="/recepcion" replace />} />
        <Route path="recepcionista" element={<Navigate to="/recepcion" replace />} />
        <Route path="recepcionista/inscripciones" element={<Navigate to="/recepcion/inscripciones" replace />} />
        <Route path="recepcionista/:seccion" element={<RedirigirRecepcion />} />
      </Route>
    </Routes>
  );
}
