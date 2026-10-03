import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inicio from "./pages/Inicio.jsx";
import Deportes from "./pages/Deportes.jsx";
import Instalaciones from "./pages/Instalaciones.jsx";
import Membresias from "./pages/Membresias.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Login from "./pages/Login.jsx";

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
    </Routes>
  );
}
