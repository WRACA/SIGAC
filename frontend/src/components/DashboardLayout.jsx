import { Link, NavLink, useNavigate } from "react-router-dom";
import { cerrarSesion } from "../services/auth.js";
import "../assets/Dashboard.css";

export default function DashboardLayout({ titulo, rol, opciones, children }) {
  const navigate = useNavigate();

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard">

      {/* MENÚ LATERAL */}
      <aside className="dashboard-sidebar">

        <h2 className="dashboard-logo">
          <Link
            to="/"
            id="dashboard-logo-inicio"
            className="dashboard-logo-link"
            title="Volver al inicio"
            aria-label="SIGAC - Volver al inicio"
          >
            SIG<span>AC</span>
          </Link>
        </h2>

        <p className="dashboard-rol">{rol}</p>

        <nav className="dashboard-menu">
          {opciones.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              end={opcion.end ?? true}
              className={({ isActive }) =>
                isActive ? "dashboard-enlace activo" : "dashboard-enlace"
              }
            >
              {opcion.nombre}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="dashboard-salir" onClick={salir}>
          Cerrar sesión
        </button>

      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="dashboard-contenido">

        <header className="dashboard-header">
          <h1>{titulo}</h1>
          <span>{rol}</span>
        </header>

        <main className="dashboard-main">
          {children}
        </main>

      </div>

    </div>
  );
}
