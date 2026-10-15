import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inicio from "./pages/Inicio.jsx";
import Deportes from "./pages/Deportes.jsx";
import Instalaciones from "./pages/Instalaciones.jsx";
import Membresias from "./pages/Membresias.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Login from "./pages/Login.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

const DashboardSocio = () => <div className="p-10 text-2xl text-white">Panel de Socio</div>;
const DashboardInstructor = () => <div className="p-10 text-2xl text-white">Panel de Instructor</div>;
const DashboardRecepcion = () => <div className="p-10 text-2xl text-white">Panel de Recepción</div>;
const AccesoDenegado = () => <div className="p-10 text-2xl font-bold text-red-500">Error 403: No tienes permisos para ver esta página</div>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="deportes" element={<Deportes />} />
        <Route path="instalaciones" element={<Instalaciones />} />
        <Route path="membresias" element={<Membresias />} />
        <Route path="nosotros" element={<Nosotros />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="acceso-denegado" element={<AccesoDenegado />} />

      <Route element={<ProtectedRoute rolesPermitidos={['socio']} />}>
        <Route path="socio" element={<DashboardSocio />} />
      </Route>

      <Route element={<ProtectedRoute rolesPermitidos={['coach']} />}>
        <Route path="instructor" element={<DashboardInstructor />} />
      </Route>

      <Route element={<ProtectedRoute rolesPermitidos={['recepcionista', 'administrador']} />}>
        <Route path="recepcion" element={<DashboardRecepcion />} />
      </Route>
    </Routes>
  );
}
