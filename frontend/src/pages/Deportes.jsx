import "../assets/Deportes.css";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const deportes = [
  {
    id: "futbol",
    nombre: "Fútbol",
    descripcion: "Vive la pasión del fútbol, mejora tu técnica, resistencia y trabajo en equipo.",
    imagen: "/img/deportes/futbol.png"
  },

  {
    id: "basquetbol",
    nombre: "Básquetbol",
    descripcion: "Desarrolla tu agilidad, coordinación y trabajo en equipo mientras disfrutas del básquetbol.",
    imagen: "/img/deportes/basquetbol.png"
  },
  {
    id: "voleibol",
    nombre: "Voleibol",
    descripcion: "Mejora tus reflejos, resistencia y habilidades de equipo en cada partido.",
    imagen: "/img/deportes/voleibol.png"
  },
  {
    id: "tenis",
    nombre: "Tenis",
    descripcion: "Perfecciona tu técnica, velocidad y precisión dentro de la cancha.",
    imagen: "/img/deportes/tenis.png"
  },
  {
    id: "padel",
    nombre: "Pádel",
    descripcion: "Disfruta de un deporte dinámico que combina estrategia, coordinación y diversión.",
    imagen: "/img/deportes/padel.png"
  },
  {
    id: "natacion",
    nombre: "Natación",
    descripcion: "Fortalece tu cuerpo, mejora tu resistencia y desarrolla tus habilidades acuáticas.",
    imagen: "/img/deportes/natacion.png"
  },

  {
    id: "aerodanza",
    nombre: "Aerodanza",
    descripcion: "Combina música, baile y ejercicio para mejorar tu condición física.",
    imagen: "/img/deportes/aerodanza.png"
  },
  {
    id: "barre",
    nombre: "Barré",
    descripcion: "Entrenamiento inspirado en ballet y pilates.",
    imagen: "/img/deportes/barre.png"
  },
  {
    id: "baile-fit",
    nombre: "Baile fit",
    descripcion: "Ejercicio cardiovascular con música.",
    imagen: "/img/deportes/baile_fit.png"
  },
  {
    id: "baile-pareja",
    nombre: "Baile en pareja",
    descripcion: "Aprende técnicas de baile en pareja.",
    imagen: "/img/deportes/baile_parejas.png"
  },
  {
    id: "box",
    nombre: "Box",
    descripcion: "Desarrolla fuerza, resistencia y técnica.",
    imagen: "/img/deportes/box.png"
  },
  {
    id: "capoeira",
    nombre: "Capoeira",
    descripcion: "Arte marcial que combina música y movimiento.",
    imagen: "/img/deportes/capoeira.png"
  },
  {
    id: "crossfit",
    nombre: "Crossfit",
    descripcion: "Entrenamiento funcional de alta intensidad.",
    imagen: "/img/deportes/crossfit.png"
  },
  {
    id: "gimnasio",
    nombre: "Gimnasio",
    descripcion: "Entrenamiento físico y muscular.",
    imagen: "/img/deportes/gym.png"
  },
  {
    id: "mma",
    nombre: "MMA",
    descripcion: "Entrenamiento de artes marciales mixtas.",
    imagen: "/img/deportes/mma.png"
  },
  {
    id: "taekwondo",
    nombre: "Taekwondo",
    descripcion: "Arte marcial basado en técnicas de combate.",
    imagen: "/img/deportes/taekwondo.png"
  },
  {
    id: "yoga",
    nombre: "Yoga",
    descripcion: "Mejora tu flexibilidad, equilibrio y bienestar.",
    imagen: "/img/deportes/yoga.png"
  }
];


export default function Deportes() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = decodeURIComponent(location.hash.slice(1));

    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [location.hash]);

  return (
    <main className="pagina-deportes">

      {/* ENCABEZADO */}
      <div className="deportes-encabezado">
        <h1>
          NUESTROS <span>DEPORTES</span>
        </h1>

        <p>
          Descubre todas las actividades que tenemos para ti.
        </p>
      </div>

      {/* MENÚ DE ACTIVIDADES */}
      <nav
      id="menu-inicio"
       className="menu-deportes"
       aria-label="Actividades deportivas" >
        {deportes.map((deporte) => (
          <a
            key={deporte.id}
            href={`#${deporte.id}`}
          >
            {deporte.nombre}
          </a>
        ))}
      </nav>

      {/* SECCIONES DE DEPORTES */}
      <div className="contenedor-deportes">

        {deportes.map((deporte, index) => (
          <section
            key={deporte.id}
            id={deporte.id}
            className="tarjeta-deporte"
          >

            {/* IMAGEN */}
            <div className="deporte-imagen">
              <img
                src={deporte.imagen}
                alt={`Actividad de ${deporte.nombre}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            {/* INFORMACIÓN */}
            <div className="deporte-informacion">

              <span className="deporte-numero">
                {String(index + 1).padStart(2, "0")} / {deportes.length}
              </span>

              <h2>{deporte.nombre}</h2>

              <p>{deporte.descripcion}</p>

              <a href="#menu-inicio" className="volver-deportes">
                ↑ Volver a actividades
              </a>

            </div>

          </section>
        ))}

      </div>

    </main>
  );
}
