use serde::{Deserialize, Serialize};

// ---------- Datos que llegan del cliente ----------
#[derive(Deserialize)]
pub struct RegisterRequest {
    pub nombre: String,
    pub apellido_p: String,
    pub correo: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub correo: String,
    pub password: String,
}

// ---------- Datos que devolvemos (sin contraseña) ----------
#[derive(Serialize, sqlx::FromRow)]
pub struct Usuario {
    pub id: i32,
    pub nombre: String,
    pub correo: String,
    pub rol: String,
}

// Solo se usa internamente en el login, para comparar la contraseña.
#[derive(sqlx::FromRow)]
pub struct UsuarioLogin {
    pub id: i32,
    pub nombre: String,
    pub correo: String,
    pub rol: String,
    pub password: String, // aquí viene el hash guardado en la BD
}

#[derive(serde::Serialize,sqlx::FromRow)]
pub struct Actividad{
    pub id: i32,
    pub actividad:String,
    pub descripcion: Option<String>,
    pub dia_semana:i16,
    pub hora_inicio:String,
    pub hora_fin: String,
    pub lugar: Option<String>,
    pub coach: String,
}

// Parámetro de búsqueda recibido por la URL
#[derive(Deserialize)]
pub struct BuscarSociosQuery {
    pub q: String,
}

// Información que devolvemos de cada socio
#[derive(Serialize, sqlx::FromRow)]
pub struct SocioBusqueda {
    pub id: i32,
    pub numero_socio: i32,
    pub nombre: String,
    pub apellido_p: String,
    pub apellido_m: Option<String>,
}

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct ActividadInscripcion {
    pub sesion_id: i64,
    pub actividad: String,
    pub inicio: String,
    pub fin: String,
    pub coach: String,
    pub lugar: Option<String>,
    pub cupo: i16,
    pub cupos_disponibles: i64,
}

#[derive(Deserialize)]
pub struct InscripcionRequest {
    pub socio_id: i32,
    pub sesion_id: i64,
    pub tipo_acceso: String,
}

#[derive(Serialize)]
pub struct InscripcionResponse {
    pub id: i64,
    pub socio_id: i32,
    pub sesion_id: i64,
    pub tipo_acceso: String,
    pub mensaje: String,
}

// Información privada del socio autenticado
#[derive(Serialize, sqlx::FromRow)]
pub struct PerfilSocio {
    pub id: i32,
    pub numero_socio: i32,
    pub nombre: String,
    pub apellido_p: String,
    pub apellido_m: Option<String>,
    pub correo: String,
    pub telefono: Option<String>,
    pub fecha_nacimiento: Option<String>,
    pub fecha_alta: String,
}