// Utilidades comunes para consumir la API del backend.

// Obtiene el token JWT almacenado en localStorage
export function getToken() {
  return localStorage.getItem("token");
}

// Obtiene el usuario autenticado guardado en localStorage
export function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

// Devuelve el usuario si hay una sesión activa (token presente y no expirado).
// Si el token ya expiró, limpia la sesión local.
export function obtenerSesionActiva() {
  const token = getToken();
  const usuario = getUsuario();
  if (!token || !usuario?.rol) return null;

  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64));
    if (exp && exp * 1000 <= Date.now()) {
      limpiarSesion();
      return null;
    }
  } catch {
    limpiarSesion();
    return null;
  }

  return usuario;
}

// Elimina la sesión local
export function limpiarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Extrae el mensaje de error ya sea texto plano (Axum ApiError) o JSON
export async function obtenerMensajeError(respuesta, mensajePorDefecto) {
  const texto = await respuesta.text().catch(() => "");
  if (!texto) return mensajePorDefecto;

  try {
    const json = JSON.parse(texto);
    return json.mensaje || json.error || mensajePorDefecto;
  } catch {
    return texto;
  }
}

// Arma "?desde=...&hasta=..." solo con las fechas presentes
export function parametrosRango({ desde, hasta } = {}) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

/**
 * Realiza una petición a la API.
 * @param {string} url - Ruta del endpoint (ej. "/api/socio/perfil")
 * @param {Object} opciones
 * @param {string} [opciones.method="GET"]
 * @param {Object} [opciones.body] - Se envía como JSON
 * @param {boolean} [opciones.auth=true] - Agrega el token JWT
 * @param {string} [opciones.mensajeError] - Mensaje si el servidor no da uno
 */
export async function apiFetch(
  url,
  { method = "GET", body, auth = true, mensajeError = "Error en el servidor" } = {}
) {
  const headers = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = `Bearer ${getToken()}`;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  if (!respuesta.ok) {
    const mensaje = await obtenerMensajeError(respuesta, mensajeError);

    // Token inválido o expirado: cerrar sesión y volver al login
    if (auth && respuesta.status === 401) {
      limpiarSesion();
      window.location.assign("/login");
    }

    throw new Error(mensaje);
  }

  const texto = await respuesta.text();
  return texto ? JSON.parse(texto) : null;
}
