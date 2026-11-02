import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inicio from "./pages/Inicio.jsx";
import Deportes from "./pages/Deportes.jsx";
import Instalaciones from "./pages/Instalaciones.jsx";
import Membresias from "./pages/Membresias.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Login from "./pages/Login.jsx";
import Recepcionista from "./pages/Recepcionista.jsx";
import Socio from "./pages/Socio.jsx";
import Instructor from "./pages/Instructor.jsx";
import SeccionDashboardPorRol from "./components/SeccionDashboardPorRol.jsx";
import InscripcionRecepcion from "./pages/InscripcionRecepcion.jsx";

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

      {/* LOGIN */}
      <Route path="login" element={<Login />} />

      {/* VISTAS POR ROL */}
      <Route path="recepcionista" element={<Recepcionista />} />
      <Route path="socio" element={<Socio />} />
      <Route path="instructor" element={<Instructor />} />

      {/* FORMULARIO DE INSCRIPCIÓN DESDE RECEPCIÓN */}
      <Route path="recepcionista/inscripciones" element={<InscripcionRecepcion />} />

      {/* SECCIONES DE RECEPCIONISTA */}
      <Route path="recepcionista/:seccion" element={<SeccionDashboardPorRol rol="recepcionista" />} />

      {/* SECCIONES DE SOCIO */}
      <Route path="socio/:seccion" element={<SeccionDashboardPorRol rol="socio" />} />

      {/* SECCIONES DE INSTRUCTOR */}
      <Route path="instructor/alumnos" element={<SociosInscritos />} />
      <Route path="instructor/clases" element={<ClasesInstructor />} />
      <Route path="instructor/:seccion" element={<SeccionDashboardPorRol rol="instructor" />} />

    </Routes>
  );
}