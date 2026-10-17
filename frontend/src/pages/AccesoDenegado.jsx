import { Link } from "react-router-dom";

export default function AccesoDenegado() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#060606] p-6 font-sans text-white">
      <div className="w-full max-w-lg rounded-2xl border border-[#202020] bg-[#101010] p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.8)] sm:p-10">
        
        {/* LOGO */}
        <Link
          to="/"
          className="mb-8 inline-block font-display text-3xl font-black uppercase tracking-[1px] text-white transition hover:opacity-85"
          title="Ir al inicio"
        >
          SIG<span className="text-[#ff5a00]">AC</span>
        </Link>

        {/* ÍCONO DE ERROR 403 */}
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-500">
          <svg
            className="size-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* ETIQUETA / BADGE */}
        <span className="mb-3 inline-block rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400">
          Error 403 - Acceso Restringido
        </span>

        {/* TÍTULO */}
        <h1 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
          Acceso Denegado
        </h1>

        {/* MENSAJE */}
        <p className="mb-8 text-sm leading-relaxed text-[#a0a0a0] sm:text-base">
          No tienes permisos suficientes para ver esta página o tu cuenta no cuenta con el rol requerido para ingresar a esta sección.
        </p>

        {/* ACCIONES */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            id="btn-volver-inicio"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#ff4b00,#ff681c)] px-6 py-3 text-sm font-bold text-[#080808] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,89,0,.35)] sm:w-auto"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Volver al inicio
          </Link>

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#181818] px-5 py-3 text-sm font-semibold text-[#e0e0e0] transition duration-200 hover:border-[#ff5a00] hover:text-[#ff5a00] sm:w-auto"
          >
            Iniciar sesión
          </Link>
        </div>

      </div>
    </main>
  );
}
