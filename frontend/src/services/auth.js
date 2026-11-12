import { apiFetch, limpiarSesion } from "./api.js";

/**
 * Inicia sesión.
 * POST /api/auth/login
 * @returns {Promise<{usuario: Object, token: string}>}
 */
export const login = (correo, password) =>
  apiFetch("/api/auth/login", {
    method: "POST",
    auth: false,
    body: { correo, password },
    mensajeError: "Credenciales inválidas o error en el servidor",
  });

// Guarda la sesión devuelta por el login
export function guardarSesion({ token, usuario }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(usuario));
}

// Cierra la sesión del usuario
export function cerrarSesion() {
  limpiarSesion();
}

// Pantalla de perfil según el rol del usuario.
// Recepción no tiene vista de perfil, por lo que va a su panel.
export function rutaPerfil(rol) {
  switch (rol) {
    case "socio":
      return "/socio/perfil";
    case "coach":
      return "/instructor/perfil";
    default:
      return rutaPorRol(rol);
  }
}

// Ruta de inicio según el rol del usuario
export function rutaPorRol(rol) {
  switch (rol) {
    case "recepcionista":
    case "administrador":
      return "/recepcion";
    case "socio":
      return "/socio";
    case "coach":
      return "/instructor";
    default:
      return null;
  }
}
