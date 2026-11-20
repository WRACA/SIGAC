// Paletas de color para los códigos QR.
//
// Reglas para que la cámara pueda leerlos:
//   - Módulos OSCUROS sobre fondo CLARO (muchos lectores no leen QR invertidos).
//   - Contraste WCAG >= 7:1 entre `modulos` y `fondo` (indicado en cada paleta).
//   - El naranja de la marca (#ff5a00) sobre blanco da solo 3.1:1, por eso no se
//     usa para los módulos; se usa en el marco (`borde`), que no afecta la lectura.

export const PALETAS_QR = [
  { id: "clasica",    nombre: "Clásica",    modulos: "#060606", fondo: "#f2f2f2", borde: "#ff5a00" }, // 18.1:1
  { id: "carbon",     nombre: "Carbón",     modulos: "#141414", fondo: "#ffc49e", borde: "#ff5a00" }, // 12.0:1
  { id: "grafito",    nombre: "Grafito",    modulos: "#2a2a2a", fondo: "#ffe9d6", borde: "#f26d21" }, // 12.2:1
  { id: "ascua",      nombre: "Ascua",      modulos: "#5c1a00", fondo: "#ffd9bf", borde: "#ff5a00" }, //  9.9:1
  { id: "brasa",      nombre: "Brasa",      modulos: "#8a2e00", fondo: "#fff1e6", borde: "#ff5a00" }, //  7.7:1
  { id: "medianoche", nombre: "Medianoche", modulos: "#0b2545", fondo: "#e6f0ff", borde: "#3d7bd9" }, // 13.4:1
  { id: "bosque",     nombre: "Bosque",     modulos: "#0f3d2e", fondo: "#e3f5ea", borde: "#2fa36b" }, // 10.7:1
  { id: "vino",       nombre: "Vino",       modulos: "#4a0e2b", fondo: "#fbe9f0", borde: "#c2185b" }, // 13.0:1
];

// Paleta que usa el sistema. La elige el equipo de desarrollo, NO el usuario:
// para cambiar el color de todos los QR, cambia este id por otro de PALETAS_QR.
export const PALETA_QR_POR_DEFECTO = "clasica";

// Devuelve la paleta con ese id, o la paleta por defecto si no existe.
export function obtenerPaletaQR(id) {
  return (
    PALETAS_QR.find((p) => p.id === id) ??
    PALETAS_QR.find((p) => p.id === PALETA_QR_POR_DEFECTO)
  );
}
