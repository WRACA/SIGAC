// Menús laterales del dashboard por rol (fuente única).

export const menus = {
  recepcionista: {
    nombre: "Recepcionista",
    opciones: [
      { nombre: "Inicio", ruta: "/recepcion" },
      { nombre: "Socios", ruta: "/recepcion/socios" },
      { nombre: "Inscripciones", ruta: "/recepcion/inscripciones" },
      { nombre: "Actividades", ruta: "/recepcion/actividades" },
    ],
  },
  socio: {
    nombre: "Socio",
    opciones: [
      { nombre: "Inicio", ruta: "/socio" },
      { nombre: "Mis actividades", ruta: "/socio/actividades" },
      { nombre: "Mis inscripciones", ruta: "/socio/inscripciones" },
      { nombre: "Horarios", ruta: "/socio/horarios" },
      { nombre: "Mi perfil", ruta: "/socio/perfil" },
    ],
  },
  instructor: {
    nombre: "Instructor",
    opciones: [
      { nombre: "Inicio", ruta: "/instructor" },
      { nombre: "Mis clases", ruta: "/instructor/clases" },
      { nombre: "Pase de lista", ruta: "/instructor/asistencia" },
      { nombre: "Mis alumnos", ruta: "/instructor/alumnos" },
      { nombre: "Mis horarios", ruta: "/instructor/horarios" },
      { nombre: "Mi perfil", ruta: "/instructor/perfil" },
    ],
  },
};
