import { Routes, Route, Navigate } from "react-router-dom";
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
import SeccionDashboardPorRol from "./components/SeccionDashboardPorRol.jsx";
import InscripcionRecepcion from "./pages/InscripcionRecepcion.jsx";
import SociosRecepcion from "./pages/SociosRecepcion.jsx";
import SesionesRecepcion from "./pages/SesionesRecepcion.jsx";
import PerfilSocio from "./pages/PerfilSocio.jsx";
import HorariosSocio from "./pages/HorariosSocio.jsx";
import ClasesInstructor from "./pages/ClasesInstructor.jsx";
import SociosInscritos from "./pages/SociosInscritos.jsx";
import PaseLista from "./pages/PaseLista.jsx";
import AccesoDenegado from "./pages/AccesoDenegado.jsx";

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
        <Route path="socio/:seccion" element={<SeccionDashboardPorRol rol="socio" />} />
      </Route>

      {/* RUTAS PROTEGIDAS PARA INSTRUCTORES */}
      <Route element={<ProtectedRoute rolesPermitidos={['instructor', 'coach']} />}>
        <Route path="instructor" element={<Instructor />} />
        <Route path="instructor/clases" element={<ClasesInstructor />} />
        <Route path="instructor/alumnos" element={<SociosInscritos />} />
        <Route path="instructor/asistencia" element={<PaseLista />} />
        <Route path="instructor/:seccion" element={<SeccionDashboardPorRol rol="instructor" />} />
      </Route>

      {/* RUTAS PROTEGIDAS PARA RECEPCIONISTAS/ADMINISTRADORES */}
      <Route element={<ProtectedRoute rolesPermitidos={['recepcionista', 'administrador']} />}>
        <Route path="recepcion" element={<Recepcionista />} />
        <Route path="recepcion/socios" element={<SociosRecepcion />} />
        <Route path="recepcion/inscripciones" element={<InscripcionRecepcion />} />
        <Route path="recepcion/actividades" element={<SesionesRecepcion />} />
        <Route path="recepcion/:seccion" element={<SeccionDashboardPorRol rol="recepcionista" />} />
        <Route path="recepcionista" element={<Navigate to="/recepcion" replace />} />
        <Route path="recepcionista/inscripciones" element={<Navigate to="/recepcion/inscripciones" replace />} />
        <Route path="recepcionista/:seccion" element={<Navigate to="/recepcion/:seccion" replace />} />
      </Route>
    </Routes>
  );
}
