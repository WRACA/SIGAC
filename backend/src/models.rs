use serde::{Deserialize, Serialize};

// ---------- Datos que llegan del cliente ----------
#[derive(Deserialize)]
pub struct RegisterRequest {
    pub nombre: String,
    pub apellido_p: String,
    pub correo: String,
    pub password: String,
    pub plan_id: i32,
    pub periodicidad: String,
    pub metodo_pago: String,
    pub confirmar_pago: bool,
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
    pub correo: String,
    pub activo: bool,
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

// Credencial QR del socio: solo lo necesario para dibujar el código
#[derive(Serialize)]
pub struct CredencialQr {
    pub contenido: String, // SIGAC:SOCIO:1:<UUID>
}

#[derive(serde::Serialize, sqlx::FromRow, Clone, Debug)]
pub struct SesionInstructor {
    pub sesion_id: i64,
    pub actividad: String,
    pub descripcion: Option<String>,
    pub fecha: String,
    pub hora_inicio: String,
    pub hora_fin: String,
    pub lugar: Option<String>,
    pub estado: String,
    pub estado_tiempo: String,
    pub cupo: i16,
    pub total_inscritos: i64,
    pub cupos_disponibles: i64,
    pub inicio_iso: String,
    pub fin_iso: String,
    pub zona_horaria: String,
    pub en_curso: bool,
}

// Socio inscrito en una sesión del instructor
#[derive(Serialize, sqlx::FromRow)]
pub struct InscritoSesion {
    pub socio_id: i32,
    pub numero_socio: i32,
    pub nombre: String,
    pub estado: String,
    pub fecha_asistencia: Option<String>,
}

#[derive(serde::Serialize, sqlx::FromRow, Clone, Debug)]
pub struct AlumnoClase {
    pub socio_id: i32,
    pub numero_socio: i32,
    pub nombre: String,
    pub apellido_p: String,
    pub apellido_m: Option<String>,
    pub estado_inscripcion: String,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct SesionDetalleInstructor {
    #[serde(flatten)]
    pub sesion: SesionInstructor,
    pub alumnos: Vec<AlumnoClase>,
}

#[derive(Deserialize)]
pub struct AsistenciaRequest {
    pub socio_id: i32,
    pub sesion_id: i64,
}

#[derive(Serialize)]
pub struct AsistenciaResponse {
    pub inscripcion_id: i64,
    pub mensaje: String,
}

// Información de las inscripciones del socio autenticado
#[derive(serde::Serialize, sqlx::FromRow)]
pub struct InscripcionSocio {
    pub id: i64,
    pub sesion_id: i64,
    pub actividad: String,
    pub inicio: String,
    pub fin: String,
    pub coach: String,
    pub lugar: Option<String>,
    pub estado: String,
    pub tipo_acceso: String,
    pub fecha_asistencia: Option<String>,
}

// Resumen general del panel de recepción
#[derive(serde::Serialize, sqlx::FromRow)]
pub struct ResumenRecepcion {
    pub total_socios: i64,
    pub socios_activos: i64,
    pub inscripciones_hoy: i64,
    pub sesiones_hoy: i64,
}

// Información de las sesiones para el panel de recepción
#[derive(serde::Serialize, sqlx::FromRow)]
pub struct SesionRecepcion {
    pub sesion_id: i64,
    pub actividad: String,
    pub inicio: String,
    pub fin: String,
    pub coach: String,
    pub lugar: Option<String>,
    pub cupo: i16,
    pub total_inscritos: i64,
    pub cupos_disponibles: i64,
    pub estado: String,
}

// Respuesta completa del dashboard de recepción
#[derive(serde::Serialize)]
pub struct DashboardRecepcion {
    pub resumen: ResumenRecepcion,
    pub actividades_hoy: Vec<SesionRecepcion>,
    pub proximas_actividades: Vec<SesionRecepcion>,
}

// Planes y precios disponibles para el alta de socios
#[derive(Serialize, sqlx::FromRow)]
pub struct PlanRecepcion {
    pub id: i32,
    pub nombre: String,
    pub nivel: i16,
    pub descripcion: Option<String>,
    pub beneficios: Option<String>,
    pub periodicidad: String,
    pub precio: f64,
}