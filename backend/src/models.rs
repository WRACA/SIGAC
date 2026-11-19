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

// Rango opcional de fechas locales (YYYY-MM-DD) para consultar sesiones por bloques.
#[derive(Deserialize)]
pub struct RangoFechas {
    pub desde: Option<String>,
    pub hasta: Option<String>,
}

impl RangoFechas {
    // Devuelve un mensaje de error si alguna fecha no tiene el formato YYYY-MM-DD
    // o no es una fecha real.
    pub fn validar(&self) -> Result<(), String> {
        for fecha in [&self.desde, &self.hasta].into_iter().flatten() {
            if !fecha_valida(fecha) {
                return Err(format!("Fecha inválida: {fecha}. Usa el formato AAAA-MM-DD"));
            }
        }
        Ok(())
    }
}

fn fecha_valida(fecha: &str) -> bool {
    let partes: Vec<&str> = fecha.split('-').collect();
    let [anio, mes, dia] = partes.as_slice() else {
        return false;
    };
    if anio.len() != 4 || mes.len() != 2 || dia.len() != 2 {
        return false;
    }
    let (Ok(anio), Ok(mes), Ok(dia)) = (anio.parse::<u32>(), mes.parse::<u32>(), dia.parse::<u32>())
    else {
        return false;
    };
    let bisiesto = (anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0;
    let dias_mes = match mes {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if bisiesto => 29,
        2 => 28,
        _ => return false,
    };
    anio >= 1 && (1..=dias_mes).contains(&dia)
}

// Clase (actividad) disponible para el selector, con el día sugerido al elegirla
#[derive(Serialize, sqlx::FromRow)]
pub struct ClaseResumen {
    pub actividad: String,
    pub fecha_sugerida: String,
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
    pub fecha: String,
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

// Contenido leído del QR del socio (SIGAC:SOCIO:1:<UUID>)
#[derive(Deserialize)]
pub struct InscripcionQrRequest {
    pub contenido: String,
}

// Datos necesarios para registrar asistencia mediante una credencial QR.
#[derive(Deserialize)]
pub struct AsistenciaQrRequest {
    pub contenido: String,
    pub sesion_id: i64,
}

// Inscripción creada a partir del QR
#[derive(Serialize)]
pub struct InscripcionQrResponse {
    pub id: i64,
    pub socio_id: i32,
    pub sesion_id: i64,
    pub tipo_acceso: String,
    pub estado: String,
    pub fecha_inscripcion: String,
    pub inscrito_por: i32, // usuario (recepcionista) que realizó la inscripción
    pub mensaje: String,
}