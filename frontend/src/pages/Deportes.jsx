import "../assets/Deportes.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import HorariosPublicos from "../components/HorariosPublicos.jsx";

const deportes = [
  {
    id: "futbol",
    nombre: "Fútbol",
    icono: "⚽",
    categoria: "Equipo",
    descripcion: "Vive la pasión del fútbol, mejora tu técnica, resistencia y trabajo en equipo.",
    imagen: "/img/deportes/futbol.png"
  },
  {
    id: "basquetbol",
    nombre: "Básquetbol",
    icono: "🏀",
    categoria: "Equipo",
    descripcion: "Desarrolla tu agilidad, coordinación y trabajo en equipo mientras disfrutas del básquetbol.",
    imagen: "/img/deportes/basquetbol.png"
  },
  {
    id: "voleibol",
    nombre: "Voleibol",
    icono: "🏐",
    categoria: "Equipo",
    descripcion: "Mejora tus reflejos, resistencia y habilidades de equipo en cada partido.",
    imagen: "/img/deportes/voleibol.png"
  },
  {
    id: "tenis",
    nombre: "Tenis",
    icono: "🎾",
    categoria: "Raqueta",
    descripcion: "Perfecciona tu técnica, velocidad y precisión dentro de la cancha.",
    imagen: "/img/deportes/tenis.png"
  },
  {
    id: "padel",
    nombre: "Pádel",
    icono: "🏓",
    categoria: "Raqueta",
    descripcion: "Disfruta de un deporte dinámico que combina estrategia, coordinación y diversión.",
    imagen: "/img/deportes/padel.png"
  },
  {
    id: "natacion",
    nombre: "Natación",
    icono: "🏊",
    categoria: "Acuático",
    descripcion: "Fortalece tu cuerpo, mejora tu resistencia y desarrolla tus habilidades acuáticas.",
    imagen: "/img/deportes/natacion.png"
  },
  {
    id: "aerodanza",
    nombre: "Aerodanza",
    icono: "💃",
    categoria: "Fitness",
    descripcion: "Combina música, baile y ejercicio para mejorar tu condición física.",
    imagen: "/img/deportes/aerodanza.png"
  },
  {
    id: "barre",
    nombre: "Barré",
    icono: "🩰",
    categoria: "Fitness",
    descripcion: "Entrenamiento inspirado en ballet y pilates.",
    imagen: "/img/deportes/barre.png"
  },
  {
    id: "baile-fit",
    nombre: "Baile fit",
    icono: "🔥",
    categoria: "Fitness",
    descripcion: "Ejercicio cardiovascular con música.",
    imagen: "/img/deportes/baile_fit.png"
  },
  {
    id: "baile-pareja",
    nombre: "Baile en pareja",
    icono: "👫",
    categoria: "Fitness",
    descripcion: "Aprende técnicas de baile en pareja.",
    imagen: "/img/deportes/baile_parejas.png"
  },
  {
    id: "box",
    nombre: "Box",
    icono: "🥊",
    categoria: "Combate",
    descripcion: "Desarrolla fuerza, resistencia y técnica.",
    imagen: "/img/deportes/box.png"
  },
  {
    id: "capoeira",
    nombre: "Capoeira",
    icono: "🤸",
    categoria: "Combate",
    descripcion: "Arte marcial que combina música y movimiento.",
    imagen: "/img/deportes/capoeira.png"
  },
  {
    id: "crossfit",
    nombre: "Crossfit",
    icono: "🏋️",
    categoria: "Fuerza",
    descripcion: "Entrenamiento funcional de alta intensidad.",
    imagen: "/img/deportes/crossfit.png"
  },
  {
    id: "gimnasio",
    nombre: "Gimnasio",
    icono: "💪",
    categoria: "Fuerza",
    descripcion: "Entrenamiento físico y muscular.",
    imagen: "/img/deportes/gym.png"
  },
  {
    id: "mma",
    nombre: "MMA",
    icono: "🥋",
    categoria: "Combate",
    descripcion: "Entrenamiento de artes marciales mixtas.",
    imagen: "/img/deportes/mma.png"
  },
  {
    id: "taekwondo",
    nombre: "Taekwondo",
    icono: "🥋",
    categoria: "Combate",
    descripcion: "Arte marcial basado en técnicas de combate.",
    imagen: "/img/deportes/taekwondo.png"
  },
  {
    id: "yoga",
    nombre: "Yoga",
    icono: "🧘",
    categoria: "Bienestar",
    descripcion: "Mejora tu flexibilidad, equilibrio y bienestar.",
    imagen: "/img/deportes/yoga.png"
  }
];

export default function Deportes() {
  const location = useLocation();
  const [activeId, setActiveId] = useState(deportes[0].id);
  const [filtro, setFiltro] = useState("");
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [mostrarArriba, setMostrarArriba] = useState(false);
  const pillsRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  // Filtrado de deportes en el buscador
  const deportesFiltrados = useMemo(() => {
    if (!filtro.trim()) return deportes;
    const q = filtro.toLowerCase().trim();
    return deportes.filter(
      (d) =>
        d.nombre.toLowerCase().includes(q) ||
        d.categoria.toLowerCase().includes(q) ||
        d.descripcion.toLowerCase().includes(q)
    );
  }, [filtro]);

  // Función para desplazarse a una actividad con compensación exacta para headers fijos/sticky
  const scrollToActivity = (id, smooth = true, updateHash = true) => {
    const elemento = document.getElementById(id);
    if (!elemento) return;

    // Marcamos que hay un scroll programático para que el observer no interfiera
    isProgrammaticScroll.current = true;
    setActiveId(id);

    // Calcular compensación según ancho de pantalla y altura de headers
    const esMovil = window.innerWidth < 1024;
    const mobileBar = document.querySelector(".deportes-mobile-bar");
    const offset = esMovil
      ? (mobileBar ? mobileBar.offsetHeight : 55) + 85
      : 110;

    const rect = elemento.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + scrollTop - offset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: smooth ? "smooth" : "auto"
    });

    // Resaltar visualmente la tarjeta con animación de pulso
    elemento.classList.remove("tarjeta-resaltada");
    void elemento.offsetWidth; // Forzar reflow
    elemento.classList.add("tarjeta-resaltada");

    if (updateHash) {
      window.history.pushState(null, "", `#${id}`);
    }

    // Reactivar ScrollSpy tras terminar la animación de desplazamiento
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);
  };

  // Manejar el salto desde cualquier botón de navegación
  const handleJump = (id) => {
    if (drawerAbierto) {
      setDrawerAbierto(false);
      // Breve margen para que el drawer desaparezca sin interrumpir el scroll
      setTimeout(() => {
        scrollToActivity(id, true, true);
      }, 60);
    } else {
      scrollToActivity(id, true, true);
    }
  };

  // Volver arriba de la página
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash) {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  // Sincronizar hash al cargar la página o cambiar de ruta
  useEffect(() => {
    if (!location.hash) return;

    const id = decodeURIComponent(location.hash.slice(1));
    const timer = setTimeout(() => {
      scrollToActivity(id, true, false);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.hash]);

  // ScrollSpy con IntersectionObserver para detectar qué tarjeta está en pantalla
  useEffect(() => {
    const cards = document.querySelectorAll(".tarjeta-deporte");
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: 0
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  // Controlar visibilidad del botón flotante "Volver arriba"
  useEffect(() => {
    const handleScroll = () => {
      setMostrarArriba(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mantener la píldora activa centrada en la barra móvil (sin alterar el scroll de la ventana)
  useEffect(() => {
    if (!pillsRef.current) return;
    const activePill = pillsRef.current.querySelector(`[data-pill-id="${activeId}"]`);
    if (activePill) {
      const container = pillsRef.current;
      const pillLeft = activePill.offsetLeft;
      const pillWidth = activePill.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScrollLeft = pillLeft - containerWidth / 2 + pillWidth / 2;

      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth"
      });
    }
  }, [activeId]);

  return (
    <main className="pagina-deportes">

      {/* ENCABEZADO */}
      <div className="deportes-encabezado">
        <h1>
          NUESTROS <span>DEPORTES</span>
        </h1>
        <p>
          Explora todas nuestras disciplinas e instalaciones especializadas. Selecciona cualquier actividad para saltar directamente a ella.
        </p>
      </div>

      {/* BARRA HORIZONTAL STICKY PARA MÓVIL Y TABLET */}
      <div className="deportes-mobile-bar" aria-label="Barra de actividades móviles">
        <div className="mobile-pills-scroll" ref={pillsRef}>
          {deportes.map((deporte) => (
            <button
              key={deporte.id}
              type="button"
              data-pill-id={deporte.id}
              onClick={() => handleJump(deporte.id)}
              className={`mobile-pill-btn ${activeId === deporte.id ? "activo" : ""}`}
            >
              <span>{deporte.icono}</span>
              <span>{deporte.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LAYOUT PRINCIPAL: SIDEBAR + SECCIONES */}
      <div className="deportes-layout">

        {/* SIDEBAR STICKY (DESKTOP) */}
        <aside className="deportes-sidebar" aria-label="Navegación de actividades">
          <div className="sidebar-header">
            <div className="sidebar-title-wrapper">
              <span className="sidebar-title-icon">⚡</span>
              <span className="sidebar-title">ACTIVIDADES</span>
            </div>
            <span className="sidebar-counter">
              {deportesFiltrados.length} / {deportes.length}
            </span>
          </div>

          {/* BUSCADOR RÁPIDO */}
          <div className="sidebar-search-box">
            <span className="sidebar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar actividad..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="sidebar-input"
              aria-label="Buscar actividad deportiva"
            />
            {filtro && (
              <button
                type="button"
                onClick={() => setFiltro("")}
                className="sidebar-clear-btn"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* LISTA DE ENLACES A CADA DEPORTE */}
          <nav className="sidebar-nav" aria-label="Lista de actividades deportivas">
            {deportesFiltrados.length > 0 ? (
              <ul className="sidebar-lista">
                {deportesFiltrados.map((deporte) => {
                  const globalIndex = deportes.findIndex((d) => d.id === deporte.id);
                  const isActivo = activeId === deporte.id;

                  return (
                    <li key={deporte.id}>
                      <button
                        type="button"
                        onClick={() => handleJump(deporte.id)}
                        className={`sidebar-btn ${isActivo ? "activo" : ""}`}
                        aria-current={isActivo ? "true" : undefined}
                      >
                        <span className="sidebar-item-izq">
                          <span className="sidebar-item-icon">{deporte.icono}</span>
                          <span className="sidebar-item-nombre">{deporte.nombre}</span>
                        </span>
                        <span className="sidebar-item-num">
                          {String(globalIndex + 1).padStart(2, "0")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="sidebar-no-results">
                No se encontraron actividades con "{filtro}"
              </div>
            )}
          </nav>

          {/* FOOTER DEL SIDEBAR */}
          <div className="sidebar-footer">
            <button
              type="button"
              onClick={handleScrollTop}
              className="sidebar-top-btn"
              title="Volver al inicio de la página"
            >
              <span>↑</span> Volver al inicio
            </button>
          </div>
        </aside>

        {/* SECCIONES DE DEPORTES */}
        <div className="contenedor-deportes">
          {deportes.map((deporte, index) => (
            <section
              key={deporte.id}
              id={deporte.id}
              className="tarjeta-deporte"
              tabIndex={-1}
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
                <div className="deporte-meta">
                  <span className="deporte-numero">
                    {String(index + 1).padStart(2, "0")} / {String(deportes.length).padStart(2, "0")}
                  </span>
                  <span className="deporte-categoria">{deporte.categoria}</span>
                </div>

                <div className="deporte-titulo-fila">
                  <span className="deporte-icono-titulo">{deporte.icono}</span>
                  <h2>{deporte.nombre}</h2>
                </div>

                <p>{deporte.descripcion}</p>

                <div className="deporte-acciones">
                  <button
                    type="button"
                    onClick={handleScrollTop}
                    className="volver-deportes"
                  >
                    ↑ Volver al inicio
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>

      </div>

      {/* HORARIOS DESDE EL BACKEND */}
      <HorariosPublicos />

      {/* BOTÓN FLOTANTE "VOLVER ARRIBA" */}
      <button
        type="button"
        onClick={handleScrollTop}
        className={`boton-flotante-arriba ${mostrarArriba ? "visible" : ""}`}
        aria-label="Volver arriba"
        title="Volver arriba"
      >
        ↑
      </button>

      {/* BOTÓN FLOTANTE MÓVIL (FAB) PARA ABRIR MENÚ COMPLETO */}
      <button
        type="button"
        onClick={() => setDrawerAbierto(true)}
        className="deportes-fab"
        aria-label="Ver todas las actividades"
      >
        <span>⚡</span> Actividades ({deportes.length})
      </button>

      {/* DRAWER / MODAL MÓVIL */}
      {drawerAbierto && (
        <div
          className="drawer-backdrop"
          onClick={() => setDrawerAbierto(false)}
        >
          <div
            className="drawer-contenido"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div className="drawer-titulo">
                <span>⚡</span> Selecciona una Actividad
              </div>
              <button
                type="button"
                onClick={() => setDrawerAbierto(false)}
                className="drawer-close-btn"
                aria-label="Cerrar menú"
              >
                ✕
              </button>
            </div>

            <div className="drawer-lista">
              {deportes.map((deporte, idx) => (
                <button
                  key={deporte.id}
                  type="button"
                  onClick={() => handleJump(deporte.id)}
                  className={`drawer-item-btn ${activeId === deporte.id ? "activo" : ""}`}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>{deporte.icono}</span>
                    <span>{deporte.nombre}</span>
                  </span>
                  <span style={{ fontSize: "12px", opacity: 0.6 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
