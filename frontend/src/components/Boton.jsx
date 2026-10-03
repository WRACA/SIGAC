import { Link } from "react-router-dom";

const base =
  "inline-block rounded-md border border-transparent font-semibold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-naranja";

const variantes = {
  naranja: "bg-naranja px-6 py-3 text-[.95rem] text-white",
  oscuro: "border-borde bg-black px-[18px] py-[9px] text-[.85rem]",
  borde: "border-[#444] px-6 py-3 text-[.95rem]",
  "borde-naranja": "border-naranja px-6 py-3 text-[.95rem] text-naranja",
};

export default function Boton({ to, variante = "naranja", children }) {
  return (
    <Link to={to} className={`${base} ${variantes[variante]}`}>
      {children}
    </Link>
  );
}
