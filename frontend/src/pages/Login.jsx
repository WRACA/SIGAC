import { useState } from "react";
import { FaApple, FaFacebookF, FaGoogle, FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const fondoOverlay = `linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.10) 45%, rgba(0,0,0,.08) 100%),
                      linear-gradient(0deg, rgba(0,0,0,.75) 0%, transparent 45%)`;

// Barras del logo: [ancho, top, left] en px
const barrasLogo = [
  [24, 3, 6],
  [20, 12, 2],
  [13, 21, 0],
];

const redes = [
  { nombre: "Google", Icono: FaGoogle, color: "text-white" },
  { nombre: "Apple", Icono: FaApple, color: "text-white" },
  { nombre: "Facebook", Icono: FaFacebookF, color: "text-[#aabed8]" },
];

const inputClase =
  "h-[55px] w-full rounded-lg border border-[#282c2f] bg-[#111416] px-[17px] text-sm text-white outline-none transition duration-[250ms] placeholder:text-[#747474] focus:border-acento focus:shadow-[0_0_0_3px_rgba(255,90,0,.08)]";
const labelClase = "mb-2.5 block text-[13px] text-[#ccc]";
const enlaceClase = "font-semibold text-acento hover:underline";

export default function Login() {
  const [verPassword, setVerPassword] = useState(false);

  const enviar = (e) => {
    e.preventDefault();
    // TODO: conectar con la autenticación
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#050505] p-[25px] font-[Arial,Helvetica,sans-serif] text-white max-[800px]:p-0">
      <div className="flex min-h-[650px] w-[900px] max-w-full overflow-hidden rounded-[20px] border border-[#202020] bg-black shadow-[0_25px_60px_rgba(0,0,0,.8)] max-[800px]:min-h-screen max-[800px]:rounded-none">
        {/* Formulario */}
        <section className="w-[55%] bg-[#020202] px-[45px] pb-10 pt-[55px] max-[800px]:w-full max-[800px]:px-[30px] max-[800px]:py-[45px] max-[480px]:px-[22px] max-[480px]:py-[35px]">
          <div className="mb-[55px] flex items-center gap-[13px]">
            <div className="relative size-8 -skew-x-[15deg]" aria-hidden="true">
              {barrasLogo.map(([ancho, top, left]) => (
                <span
                  key={top}
                  className="absolute h-[7px] rounded-[2px] bg-acento"
                  style={{ width: ancho, top, left }}
                />
              ))}
            </div>
            <h2 className="text-[22px] font-extrabold tracking-[1px]">SIGAC</h2>
          </div>

          <div className="mb-[38px]">
            <h1 className="mb-2.5 text-[30px] font-bold max-[480px]:text-[26px]">Bienvenido!</h1>
            <p className="text-sm text-[#8e8e8e]">Accede a tu cuenta para continuar.</p>
          </div>

          <form onSubmit={enviar}>
            <div className="mb-6">
              <label htmlFor="correo" className={labelClase}>Correo electrónico</label>
              <input
                type="email"
                id="correo"
                name="correo"
                placeholder="tu@correo.com"
                required
                className={inputClase}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className={labelClase}>Contraseña</label>
              <div className="relative">
                <input
                  type={verPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  className={`${inputClase} pr-[50px]`}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-[18px] top-1/2 -translate-y-1/2 cursor-pointer text-[17px] text-[#b5b5b5]"
                >
                  {verPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                </button>
              </div>
            </div>

            <div className="mb-8 mt-[5px] flex items-center justify-between max-[480px]:gap-[15px]">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#bbb]">
                <input type="checkbox" className="size-[18px] accent-acento" />
                <span>Recordarme</span>
              </label>
              <a href="#" className={`${enlaceClase} text-xs`}>¿Olvidaste tu contraseña?</a>
            </div>

            <button
              type="submit"
              className="h-[54px] w-full cursor-pointer rounded-lg bg-[linear-gradient(90deg,#ff4b00,#ff681c)] text-sm font-bold text-[#080808] transition duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,89,0,.35)]"
            >
              Iniciar sesión
            </button>

            <div className="my-8 flex items-center gap-[15px]">
              <span className="h-px flex-1 bg-[#272727]" />
              <p className="whitespace-nowrap text-xs text-[#777]">o continúa con</p>
              <span className="h-px flex-1 bg-[#272727]" />
            </div>

            <div className="flex justify-center gap-[35px] max-[480px]:gap-5">
              {redes.map(({ nombre, Icono, color }) => (
                <button
                  key={nombre}
                  type="button"
                  aria-label={`Continuar con ${nombre}`}
                  className={`grid size-[60px] cursor-pointer place-items-center rounded-[9px] border border-[#25282b] bg-[#0d1012] text-[23px] transition duration-[250ms] hover:-translate-y-[3px] hover:border-acento max-[480px]:size-[55px] ${color}`}
                >
                  <Icono />
                </button>
              ))}
            </div>

            <div className="mt-[50px] text-center">
              <p className="text-[13px] text-[#9a9a9a]">
                ¿No tienes cuenta?{" "}
                <a href="#" className={`${enlaceClase} ml-[5px]`}>Regístrate aquí</a>
              </p>
            </div>
          </form>
        </section>

        {/* Imagen */}
        <section
          className="relative w-[45%] bg-cover bg-center max-[800px]:hidden"
          style={{ backgroundImage: 'url("/img/fondo5.png")' }}
        >
          <div className="absolute inset-0" style={{ background: fondoOverlay }} />

          <div className="absolute bottom-[115px] left-[55px] z-[2]">
            <h2 className="text-[30px] font-extrabold leading-[1.15] tracking-[-1px] [text-shadow:0_3px_15px_rgba(0,0,0,.8)]">
              UN CLUB.
              <br />
              TODOS
              <br />
              LOS DEPORTES.
              <br />
              TU MEJOR VERSIÓN.
            </h2>
          </div>

          <div className="absolute bottom-[30px] left-[50px] z-[3] flex -skew-x-[25deg] gap-[7px]" aria-hidden="true">
            <span className="block h-3 w-[18px] bg-acento" />
            <span className="block h-3 w-[42px] bg-acento" />
          </div>
        </section>
      </div>
    </main>
  );
}
