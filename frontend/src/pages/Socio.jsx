import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerPerfil } from "../services/socio.js";
import { formatearFecha } from "../utils/formato.js";

const { nombre: rol, opciones } = menus.socio;

export default function Socio() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerPerfil()
      .then((datos) => activo && setPerfil(datos))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <DashboardLayout titulo="Panel de Socio" rol={rol} opciones={opciones}>
      <h2>¡Bienvenido{perfil ? `, ${perfil.nombre}` : ""} a SIGAC!</h2>

      <p>
        Consulta tus actividades deportivas, revisa los horarios
        y tu información de socio.
      </p>

      {error && <p className="dashboard-error">{error}</p>}

      {perfil && (
        <div className="dashboard-tarjetas">
          <div className="dashboard-tarjeta">
            <h3>Número de socio</h3>
            <p>{perfil.numero_socio}</p>
          </div>
          <div className="dashboard-tarjeta">
            <h3>Socio desde</h3>
            <p className="dashboard-tarjeta-texto">{formatearFecha(perfil.fecha_alta)}</p>
          </div>
          <div className="dashboard-tarjeta">
            <h3>Horarios del club</h3>
            <Link to="/socio/horarios" className="dashboard-enlace-boton">
              Ver horarios
            </Link>
          </div>
          <div className="dashboard-tarjeta">
            <h3>Mis datos</h3>
            <Link to="/socio/perfil" className="dashboard-enlace-boton">
              Ver mi perfil
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
