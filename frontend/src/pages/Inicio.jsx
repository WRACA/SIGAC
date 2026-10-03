import { Link } from "react-router-dom";
import Boton from "../components/Boton.jsx";

/* Fondos de varias capas (degradado + imagen + color de respaldo).
   Las imágenes viven en /public/img. */
const fondos = {
  hero: `linear-gradient(90deg, #060606 15%, rgba(6,6,6,.55) 55%, rgba(6,6,6,.1)),
         url("/img/fondo1.png") center right / cover no-repeat,
         radial-gradient(circle at 75% 40%, #4a2410, #060606 65%)`,
  gym: `url("/img/fondo2.png"), linear-gradient(135deg, #333, #0d0d0d 70%)`,
  comunidad: `linear-gradient(90deg, rgba(6,6,6,.92), rgba(6,6,6,.5)),
              url("/img/fondo3.png") center / cover no-repeat,
              linear-gradient(120deg, #111, #2b1408)`,
  club: `url("/img/fondo4.png"), linear-gradient(135deg, #1a1a1a, #3a1c0a)`,
};

const deportes = [
  ["⚽", "Fútbol"],
  ["🏀", "Básquetbol"],
  ["🏐", "Vóleibol"],
  ["🎾", "Tenis"],
  ["🏓", "Padel"],
  ["🏊", "Natación"],
  ["🏋️", "Gimnasio"],
  ["＋", "Más deportes"],
];

const cifras = [
  ["1,200+", "Socios activos"],
  ["10+", "Deportes"],
  ["15+", "Torneos al año"],
  ["100%", "Pasión por el deporte"],
];

// Clases repetidas del CSS original (.ini h2, .sub, .etiqueta)
const h2 = "font-display font-extrabold uppercase leading-none";
const h2Seccion = `${h2} text-[clamp(2rem,4vw,2.8rem)]`;
const sub = "max-w-[440px] text-suave";

function Etiqueta({ linea = true, children }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-[.8rem] font-semibold uppercase tracking-[2px] text-naranja">
      {linea && <span className="h-0.5 w-7 bg-naranja" />}
      {children}
    </p>
  );
}

export default function Inicio() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative flex min-h-screen items-center overflow-hidden px-[6%] pb-20 pt-[120px] max-[900px]:pt-40"
        style={{ background: fondos.hero }}
      >
        <div>
          <Etiqueta>Más que un club</Etiqueta>
          <h2 className={`${h2} mb-6 text-[clamp(3.2rem,8vw,6.2rem)]`}>
            Disciplina
            <br />
            <span className="text-naranja">Comunidad</span>
            <br />
            Resultados
          </h2>
          <p className={`${sub} mb-8`}>
            Un club multideportivo diseñado para personas que buscan superarse
            dentro y fuera de la cancha.
          </p>
          <div className="flex flex-wrap gap-4">
            <Boton to="/membresias">Únete ahora</Boton>
            <Boton to="/nosotros" variante="borde">Conoce más →</Boton>
          </div>
        </div>

        {/* Franja diagonal naranja */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-[12%] w-3.5 -skew-x-[25deg] bg-[linear-gradient(var(--color-naranja),transparent)] opacity-80 max-[900px]:hidden"
        />

        <p className="absolute bottom-[14%] right-[5%] z-[2] -rotate-12 text-right font-display text-[1.6rem] font-semibold italic leading-[1.1] text-naranja max-[900px]:hidden">
          Deporte
          <br />
          Gente
          <br />
          Evolución
        </p>
      </section>

      {/* Deportes */}
      <section className="relative z-[3] mx-[5%] -mt-[30px] grid grid-cols-8 rounded-[10px] border border-borde bg-gris max-[900px]:grid-cols-4">
        {deportes.map(([icono, nombre], i) => (
          <Link
            key={nombre}
            to="/deportes"
            className={[
              "flex flex-col items-center gap-2 border-r border-borde px-2 py-[22px] text-[.85rem] transition-colors hover:text-naranja last:border-r-0",
              i === 3 && "max-[900px]:border-r-0",
              i < 4 && "max-[900px]:border-b",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="text-[1.6rem] brightness-[1.6] grayscale">{icono}</span>
            {nombre}
          </Link>
        ))}
      </section>

      {/* Instalaciones */}
      <section className="relative grid grid-cols-[1.1fr_1fr] items-center gap-[60px] overflow-hidden px-[6%] py-[60px] max-[900px]:grid-cols-1 max-[900px]:gap-[30px]">
        <div
          className="min-h-80 rounded-[10px] bg-cover bg-center"
          style={{ backgroundImage: fondos.gym }}
        />
        <div>
          <Etiqueta linea={false}>Instalaciones de primer nivel</Etiqueta>
          <h2 className={`${h2Seccion} mb-4`}>
            Todo lo que necesitas, en un solo lugar
          </h2>
          <p className={`${sub} mb-[26px]`}>
            Canchas, gimnasio, alberca y más. Instalaciones modernas para una
            experiencia completa.
          </p>
          <Boton to="/instalaciones" variante="borde-naranja">
            Explora instalaciones →
          </Boton>
        </div>
      </section>

      {/* Comunidad */}
      <section
        className="relative overflow-hidden px-[6%] py-[70px]"
        style={{ background: fondos.comunidad }}
      >
        <h2 className={`${h2Seccion} mb-3.5`}>
          Una comunidad <span className="text-naranja">que te impulsa</span>
        </h2>
        <p className={sub}>
          Aquí se vive el deporte. Entrena, compite, comparte y forma parte de
          una comunidad que no se detiene.
        </p>
        <ul className="mt-10 flex flex-wrap gap-x-16 gap-y-6">
          {cifras.map(([valor, texto]) => (
            <li key={texto} className="text-[.85rem] text-suave">
              <strong className="block font-display text-[2rem] text-naranja">
                {valor}
              </strong>
              {texto}
            </li>
          ))}
        </ul>
      </section>

      {/* Frase final */}
      <section className="relative grid min-h-[300px] grid-cols-[1.4fr_1fr] items-center overflow-hidden max-[900px]:grid-cols-1 max-[900px]:gap-[30px]">
        <div
          className="flex h-full min-h-[300px] flex-col items-end justify-center gap-2 bg-cover bg-center pr-[8%] text-[.8rem] max-[900px]:items-center max-[900px]:px-[8%] max-[900px]:py-10"
          style={{ backgroundImage: fondos.club }}
        />
        <div className="px-[6%] py-10">
          <h3 className="font-display text-[1.2rem] font-bold uppercase">Disciplina</h3>
          <h2 className={h2Seccion}>
            Hoy,
            <br />
            grandes
            <br />
            historias
            <br />
            mañana.
          </h2>
        </div>
      </section>
    </>
  );
}
