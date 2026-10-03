import { Link, NavLink } from "react-router-dom";
import Boton from "./Boton.jsx";

const enlaces = [
  { to: "/", label: "Inicio", end: true },
  { to: "/deportes", label: "Deportes" },
  { to: "/instalaciones", label: "Instalaciones" },
  { to: "/membresias", label: "Membresías" },
  { to: "/nosotros", label: "Nosotros" },
];

export default function Navbar() {
  return (
    <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-6 px-[6%] py-[22px] max-[900px]:flex-wrap">
      <h1 className="font-display text-[1.9rem] font-extrabold uppercase tracking-[1px]">
        <Link to="/">SIGAC</Link>
      </h1>

      <ul className="flex gap-8 text-[.9rem] max-[900px]:order-3 max-[900px]:w-full max-[900px]:gap-[18px] max-[900px]:overflow-x-auto">
        {enlaces.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `hover:text-naranja ${isActive ? "text-naranja" : ""}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <Boton to="/login" variante="oscuro">Iniciar sesión</Boton>
    </nav>
  );
}
