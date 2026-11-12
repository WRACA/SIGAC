//! Script de semilla (seed) de SIGAC.
//!
//! Llena la base de datos con información de prueba coherente con el esquema de
//! `docs/database.md`. Todo lo que inserta está documentado en `docs/datos-semilla.md`.
//!
//! Se dispara desde la consola del backend escribiendo la palabra clave
//! [`PALABRA_CLAVE`] y pulsando Enter (ver `escuchar_teclado`).
//!
//! # Control de una sola ejecución
//! 1. En el proceso: dos `AtomicBool` impiden ejecuciones simultáneas o repetidas.
//! 2. En la base de datos (control real, compartido por todo el equipo):
//!    todo corre en UNA transacción que primero toma un candado consultivo
//!    (`pg_advisory_xact_lock`) y después verifica si ya existe el usuario
//!    centinela [`CORREO_CENTINELA`]. Si existe, se cancela sin tocar nada.
//! 3. Si algo falla a la mitad, la transacción se revierte completa: nunca queda
//!    una semilla a medias. Además las restricciones UNIQUE (correo, rfc...)
//!    impedirían duplicar los datos aunque se borrara el centinela.

use std::collections::HashMap;
use std::fmt;
use std::sync::atomic::{AtomicBool, Ordering};

use sqlx::{PgConnection, PgPool};
use tokio::io::{AsyncBufReadExt, BufReader};

// =====================================================================
// CONFIGURACIÓN
// =====================================================================

/// Palabra que hay que escribir en la consola del backend para ejecutar la semilla.
pub const PALABRA_CLAVE: &str = "sembrar";

/// Contraseña de TODAS las cuentas de prueba.
const PASSWORD_PRUEBA: &str = "12345678";

/// Si este correo ya existe en `usuario`, la semilla se considera aplicada.
const CORREO_CENTINELA: &str = "recepcion1@sigac.com";

/// Llave del candado consultivo de PostgreSQL (número arbitrario y fijo).
const LLAVE_CANDADO: i64 = 72_102_026;

/// Fecha de "hoy" en la zona horaria del club.
const HOY: &str = "(now() AT TIME ZONE 'America/Mexico_City')::date";

/// Rango de días (relativo a hoy) en el que se generan sesiones.
const SESIONES_DESDE_DIA: i32 = -14;
const SESIONES_HASTA_DIA: i32 = 21;

static EN_CURSO: AtomicBool = AtomicBool::new(false);
static COMPLETADA: AtomicBool = AtomicBool::new(false);

// =====================================================================
// DATOS
// =====================================================================

struct PersonaSeed {
    correo: &'static str,
    nombre: &'static str,
    apellido_p: &'static str,
    apellido_m: &'static str,
    telefono: &'static str,
}

const RECEPCIONISTAS: [PersonaSeed; 3] = [
    PersonaSeed { correo: "recepcion1@sigac.com", nombre: "Laura", apellido_p: "Méndez", apellido_m: "Ríos", telefono: "5551000001" },
    PersonaSeed { correo: "recepcion2@sigac.com", nombre: "Jorge", apellido_p: "Salinas", apellido_m: "Vega", telefono: "5551000002" },
    PersonaSeed { correo: "recepcion3@sigac.com", nombre: "Patricia", apellido_p: "Ortega", apellido_m: "Luna", telefono: "5551000003" },
];

struct CoachSeed {
    persona: PersonaSeed,
    rfc: &'static str,
    biografia: &'static str,
}

// Índices de coaches (posición en COACHES)
const RICARDO: usize = 0;
const MARIANA: usize = 1;
const DANIEL: usize = 2;
const SOFIA: usize = 3;
const ANDRES: usize = 4;
const VALERIA: usize = 5;

const COACHES: [CoachSeed; 6] = [
    CoachSeed {
        persona: PersonaSeed { correo: "coach1@sigac.com", nombre: "Ricardo", apellido_p: "Torres", apellido_m: "Bravo", telefono: "5551100001" },
        rfc: "TOBR850312AB1",
        biografia: "Entrenador de box y acondicionamiento físico con 12 años de experiencia. Certificado en entrenamiento funcional.",
    },
    CoachSeed {
        persona: PersonaSeed { correo: "coach2@sigac.com", nombre: "Mariana", apellido_p: "Castillo", apellido_m: "Ruiz", telefono: "5551100002" },
        rfc: "CARM900725CD2",
        biografia: "Instructora de yoga y pilates. Formación de 500 horas en yoga y especialidad en movilidad y flexibilidad.",
    },
    CoachSeed {
        persona: PersonaSeed { correo: "coach3@sigac.com", nombre: "Daniel", apellido_p: "Herrera", apellido_m: "Soto", telefono: "5551100003" },
        rfc: "HESD880114EF3",
        biografia: "Ciclista amateur e instructor de spinning. Diseña rutinas de intervalos de alta intensidad.",
    },
    CoachSeed {
        persona: PersonaSeed { correo: "coach4@sigac.com", nombre: "Sofía", apellido_p: "Navarro", apellido_m: "Gil", telefono: "5551100004" },
        rfc: "NAGS920503GH4",
        biografia: "Bailarina profesional e instructora de zumba. Combina baile y cardio en clases para todos los niveles.",
    },
    CoachSeed {
        persona: PersonaSeed { correo: "coach5@sigac.com", nombre: "Andrés", apellido_p: "Fuentes", apellido_m: "Lara", telefono: "5551100005" },
        rfc: "FULA870918IJ5",
        biografia: "Exnadador de alto rendimiento y salvavidas certificado. Imparte natación y entrenamiento funcional.",
    },
    CoachSeed {
        persona: PersonaSeed { correo: "coach6@sigac.com", nombre: "Valeria", apellido_p: "Rojas", apellido_m: "Peña", telefono: "5551100006" },
        rfc: "ROPV950221KL6",
        biografia: "Licenciada en ciencias del deporte. Instructora de pilates, yoga y zumba.",
    },
];

struct PlanSeed {
    nombre: &'static str,
    nivel: i16,
    descripcion: &'static str,
    beneficios: &'static str,
    /// (periodicidad, precio)
    precios: [(&'static str, &'static str); 3],
}

const PLANES: [PlanSeed; 3] = [
    PlanSeed {
        nombre: "Básico",
        nivel: 1,
        descripcion: "Acceso a las clases grupales de nivel básico.",
        beneficios: "Yoga, Spinning, Zumba y Stretching incluidos.",
        precios: [("mensual", "499.00"), ("semestral", "2699.00"), ("anual", "4999.00")],
    },
    PlanSeed {
        nombre: "Plus",
        nivel: 2,
        descripcion: "Acceso a clases de nivel básico e intermedio.",
        beneficios: "Todo lo del plan Básico más Entrenamiento Funcional y Pilates.",
        precios: [("mensual", "749.00"), ("semestral", "3999.00"), ("anual", "7499.00")],
    },
    PlanSeed {
        nombre: "Premium",
        nivel: 3,
        descripcion: "Acceso total a todas las actividades del club.",
        beneficios: "Todo lo del plan Plus más Natación y Box.",
        precios: [("mensual", "999.00"), ("semestral", "5399.00"), ("anual", "9999.00")],
    },
];

struct ActividadSeed {
    nombre: &'static str,
    descripcion: &'static str,
    nivel_minimo: i16,
    /// Precio por sesión sin membresía suficiente. `None` = no se vende suelta.
    precio_sin_membresia: Option<&'static str>,
    cupo: i16,
    lugar: &'static str,
}

// Índices de actividades (posición en ACTIVIDADES)
const YOGA: usize = 0;
const SPINNING: usize = 1;
const FUNCIONAL: usize = 2;
const ZUMBA: usize = 3;
const NATACION: usize = 4;
const PILATES: usize = 5;
const BOX: usize = 6;
const STRETCHING: usize = 7;

const ACTIVIDADES: [ActividadSeed; 8] = [
    ActividadSeed { nombre: "Yoga", descripcion: "Posturas, respiración y relajación para mejorar flexibilidad y equilibrio.", nivel_minimo: 1, precio_sin_membresia: Some("120.00"), cupo: 20, lugar: "Salón A" },
    ActividadSeed { nombre: "Spinning", descripcion: "Ciclismo indoor con música e intervalos de intensidad.", nivel_minimo: 1, precio_sin_membresia: Some("130.00"), cupo: 15, lugar: "Sala de Ciclismo" },
    ActividadSeed { nombre: "Entrenamiento Funcional", descripcion: "Circuitos de fuerza y resistencia con peso corporal y accesorios.", nivel_minimo: 2, precio_sin_membresia: Some("150.00"), cupo: 18, lugar: "Salón B" },
    ActividadSeed { nombre: "Zumba", descripcion: "Clase de baile aeróbico con ritmos latinos.", nivel_minimo: 1, precio_sin_membresia: Some("100.00"), cupo: 25, lugar: "Salón A" },
    ActividadSeed { nombre: "Natación", descripcion: "Técnica de estilos y resistencia en alberca semiolímpica.", nivel_minimo: 3, precio_sin_membresia: Some("200.00"), cupo: 12, lugar: "Alberca" },
    ActividadSeed { nombre: "Pilates", descripcion: "Fortalecimiento del core, postura y control del movimiento.", nivel_minimo: 2, precio_sin_membresia: Some("160.00"), cupo: 15, lugar: "Salón B" },
    ActividadSeed { nombre: "Box", descripcion: "Técnica de golpeo, desplazamientos y acondicionamiento.", nivel_minimo: 3, precio_sin_membresia: Some("180.00"), cupo: 12, lugar: "Ring" },
    ActividadSeed { nombre: "Stretching", descripcion: "Estiramientos guiados y movilidad articular.", nivel_minimo: 1, precio_sin_membresia: None, cupo: 20, lugar: "Salón A" },
];

/// (coach, actividad): qué actividades puede impartir cada coach.
const COACH_ACTIVIDAD: [(usize, usize); 15] = [
    (RICARDO, FUNCIONAL), (RICARDO, BOX),
    (MARIANA, YOGA), (MARIANA, PILATES), (MARIANA, STRETCHING),
    (DANIEL, SPINNING), (DANIEL, FUNCIONAL),
    (SOFIA, ZUMBA), (SOFIA, STRETCHING),
    (ANDRES, NATACION), (ANDRES, FUNCIONAL),
    (VALERIA, PILATES), (VALERIA, YOGA), (VALERIA, ZUMBA),
    // Box también lo puede cubrir Daniel como suplente.
    (DANIEL, BOX),
];

/// Plantilla semanal: (dia_semana 1=lunes..7=domingo, hora_inicio, hora_fin, actividad, coach).
/// Lunes a viernes: 5 bloques diarios, incluido el obligatorio de 13:00 a 14:00.
/// Sábado: 4 bloques.
const HORARIOS: [(i16, &str, &str, usize, usize); 29] = [
    // Lunes
    (1, "07:00", "08:00", SPINNING, DANIEL),
    (1, "09:00", "10:00", YOGA, MARIANA),
    (1, "13:00", "14:00", FUNCIONAL, RICARDO),
    (1, "18:00", "19:00", ZUMBA, SOFIA),
    (1, "19:30", "20:30", BOX, RICARDO),
    // Martes
    (2, "07:00", "08:00", NATACION, ANDRES),
    (2, "09:00", "10:00", PILATES, VALERIA),
    (2, "13:00", "14:00", YOGA, MARIANA),
    (2, "18:00", "19:00", FUNCIONAL, DANIEL),
    (2, "19:30", "20:30", STRETCHING, SOFIA),
    // Miércoles
    (3, "07:00", "08:00", SPINNING, DANIEL),
    (3, "09:00", "10:00", ZUMBA, VALERIA),
    (3, "13:00", "14:00", BOX, RICARDO),
    (3, "18:00", "19:00", PILATES, MARIANA),
    (3, "19:30", "20:30", NATACION, ANDRES),
    // Jueves
    (4, "07:00", "08:00", FUNCIONAL, ANDRES),
    (4, "09:00", "10:00", YOGA, VALERIA),
    (4, "13:00", "14:00", SPINNING, DANIEL),
    (4, "18:00", "19:00", ZUMBA, SOFIA),
    (4, "19:30", "20:30", BOX, RICARDO),
    // Viernes
    (5, "07:00", "08:00", NATACION, ANDRES),
    (5, "09:00", "10:00", STRETCHING, MARIANA),
    (5, "13:00", "14:00", PILATES, VALERIA),
    (5, "18:00", "19:00", FUNCIONAL, RICARDO),
    (5, "19:30", "20:30", SPINNING, DANIEL),
    // Sábado
    (6, "08:00", "09:00", YOGA, MARIANA),
    (6, "09:30", "10:30", FUNCIONAL, DANIEL),
    (6, "11:00", "12:00", NATACION, ANDRES),
    (6, "12:30", "13:30", ZUMBA, SOFIA),
];

/// (correo, nombre, apellido_p, apellido_m, fecha_nacimiento).
const SOCIOS: [(&str, &str, &str, &str, &str); 32] = [
    ("ana.martinez@sigac.com", "Ana", "Martínez", "López", "1990-03-14"),
    ("carlos.ramirez@sigac.com", "Carlos", "Ramírez", "Pérez", "1985-07-22"),
    ("fernanda.gomez@sigac.com", "Fernanda", "Gómez", "Díaz", "1998-11-05"),
    ("luis.hernandez@sigac.com", "Luis", "Hernández", "Cruz", "1979-01-30"),
    ("gabriela.sanchez@sigac.com", "Gabriela", "Sánchez", "Morales", "1993-06-18"),
    ("miguel.flores@sigac.com", "Miguel", "Flores", "Jiménez", "2000-09-09"),
    ("daniela.vargas@sigac.com", "Daniela", "Vargas", "Reyes", "1996-12-01"),
    ("jose.castro@sigac.com", "José", "Castro", "Romero", "1988-04-27"),
    ("paola.ortiz@sigac.com", "Paola", "Ortiz", "Guzmán", "1991-08-15"),
    ("alejandro.mendoza@sigac.com", "Alejandro", "Mendoza", "Silva", "1983-02-11"),
    ("valentina.aguilar@sigac.com", "Valentina", "Aguilar", "Ramos", "2002-05-23"),
    ("roberto.chavez@sigac.com", "Roberto", "Chávez", "Medina", "1975-10-08"),
    ("camila.rivera@sigac.com", "Camila", "Rivera", "Torres", "1999-01-19"),
    ("eduardo.moreno@sigac.com", "Eduardo", "Moreno", "Vázquez", "1987-03-03"),
    ("isabel.delgado@sigac.com", "Isabel", "Delgado", "Cortés", "1994-07-07"),
    ("fernando.ruiz@sigac.com", "Fernando", "Ruiz", "Castillo", "1981-11-28"),
    ("lucia.dominguez@sigac.com", "Lucía", "Domínguez", "Herrera", "1997-09-12"),
    ("javier.guerrero@sigac.com", "Javier", "Guerrero", "Núñez", "1990-06-02"),
    ("mariana.pena@sigac.com", "Mariana", "Peña", "Salazar", "2001-02-25"),
    ("diego.rosales@sigac.com", "Diego", "Rosales", "Campos", "1986-12-16"),
    ("natalia.ibarra@sigac.com", "Natalia", "Ibarra", "Fuentes", "1995-04-04"),
    ("sergio.cabrera@sigac.com", "Sergio", "Cabrera", "Luna", "1978-08-21"),
    ("andrea.velazquez@sigac.com", "Andrea", "Velázquez", "Soto", "2003-03-30"),
    ("raul.montes@sigac.com", "Raúl", "Montes", "Orozco", "1984-05-13"),
    ("regina.escobar@sigac.com", "Regina", "Escobar", "Pineda", "1992-10-24"),
    ("arturo.navarro@sigac.com", "Arturo", "Navarro", "Ochoa", "1980-01-07"),
    ("ximena.lozano@sigac.com", "Ximena", "Lozano", "Valdez", "2000-07-17"),
    ("hector.padilla@sigac.com", "Héctor", "Padilla", "Ríos", "1977-09-29"),
    ("renata.juarez@sigac.com", "Renata", "Juárez", "Cervantes", "1996-02-08"),
    ("oscar.maldonado@sigac.com", "Óscar", "Maldonado", "León", "1989-11-11"),
    ("carolina.bautista@sigac.com", "Carolina", "Bautista", "Robles", "1993-12-20"),
    ("tomas.villarreal@sigac.com", "Tomás", "Villarreal", "Acosta", "1982-06-06"),
];

/// Los últimos socios (índices >= este valor) tienen la membresía vencida.
const PRIMER_SOCIO_VENCIDO: usize = 28;

const METODOS_PAGO: [&str; 3] = ["efectivo", "tarjeta", "transferencia"];

// ---------- Reglas derivadas del índice del socio (documentadas en el markdown) ----------

fn nivel_plan_socio(i: usize) -> i16 {
    (i % 3) as i16 + 1
}

fn periodicidad_socio(i: usize) -> &'static str {
    if i >= PRIMER_SOCIO_VENCIDO {
        return "mensual";
    }
    ["mensual", "semestral", "anual", "mensual"][i % 4]
}

/// Días transcurridos desde el inicio de la membresía.
fn dias_desde_inicio_membresia(i: usize) -> i32 {
    if i >= PRIMER_SOCIO_VENCIDO { 60 } else { (i % 5) as i32 * 5 + 2 }
}

/// Días transcurridos desde la fecha de alta del socio.
fn dias_desde_alta(i: usize) -> i32 {
    30 + i as i32 * 12
}

fn duracion(periodicidad: &str) -> &'static str {
    match periodicidad {
        "semestral" => "6 months",
        "anual" => "1 year",
        _ => "1 month",
    }
}

// =====================================================================
// RESULTADO Y ERRORES
// =====================================================================

#[derive(Default)]
pub struct Resumen {
    planes: u64,
    precios: u64,
    usuarios: u64,
    recepcionistas: u64,
    coaches: u64,
    socios: u64,
    actividades: u64,
    coach_actividad: u64,
    horarios: u64,
    sesiones: u64,
    membresias: u64,
    pagos: u64,
    inscritos: u64,
    asistencias: u64,
    faltas: u64,
}

impl fmt::Display for Resumen {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "  plan_membresia ....... {} (nuevos)", self.planes)?;
        writeln!(f, "  plan_precio .......... {} (nuevos)", self.precios)?;
        writeln!(f, "  usuario .............. {} ({} recepcionistas, {} coaches, {} socios)",
            self.usuarios, self.recepcionistas, self.coaches, self.socios)?;
        writeln!(f, "  coach ................ {}", self.coaches)?;
        writeln!(f, "  socio ................ {}", self.socios)?;
        writeln!(f, "  actividad ............ {} (nuevas)", self.actividades)?;
        writeln!(f, "  coach_actividad ...... {} (nuevas)", self.coach_actividad)?;
        writeln!(f, "  horario_actividad .... {}", self.horarios)?;
        writeln!(f, "  sesion ............... {}", self.sesiones)?;
        writeln!(f, "  membresia ............ {}", self.membresias)?;
        writeln!(f, "  pago ................. {}", self.pagos)?;
        write!(f, "  inscripcion .......... {} ({} inscrito, {} asistio, {} falta)",
            self.inscritos + self.asistencias + self.faltas,
            self.inscritos, self.asistencias, self.faltas)
    }
}

pub enum ErrorSeed {
    YaAplicada,
    EnCurso,
    Hash(String),
    BaseDeDatos(sqlx::Error),
}

impl From<sqlx::Error> for ErrorSeed {
    fn from(e: sqlx::Error) -> Self {
        ErrorSeed::BaseDeDatos(e)
    }
}

impl fmt::Display for ErrorSeed {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ErrorSeed::YaAplicada => write!(f, "La semilla ya fue aplicada en esta base de datos. No se hizo ningún cambio."),
            ErrorSeed::EnCurso => write!(f, "La semilla ya se está ejecutando, espera a que termine."),
            ErrorSeed::Hash(e) => write!(f, "No se pudo generar el hash de la contraseña: {e}"),
            ErrorSeed::BaseDeDatos(e) => write!(f, "Error de base de datos, se revirtieron TODOS los cambios: {e}"),
        }
    }
}

// =====================================================================
// ESCUCHA DE TECLADO
// =====================================================================

/// Lee la entrada estándar línea por línea. Cuando se escribe [`PALABRA_CLAVE`]
/// ejecuta la semilla. Cualquier otra entrada se ignora.
pub async fn escuchar_teclado(pool: PgPool) {
    println!("Escribe \"{PALABRA_CLAVE}\" + Enter para cargar los datos de prueba (solo se aplica una vez).");

    let mut lineas = BufReader::new(tokio::io::stdin()).lines();
    while let Ok(Some(linea)) = lineas.next_line().await {
        if !linea.trim().eq_ignore_ascii_case(PALABRA_CLAVE) {
            continue;
        }
        println!("[seed] Cargando datos de prueba...");
        match ejecutar(&pool).await {
            Ok(resumen) => println!("[seed] Datos de prueba cargados correctamente:\n{resumen}"),
            Err(e) => eprintln!("[seed] {e}"),
        }
    }
}

// =====================================================================
// EJECUCIÓN
// =====================================================================

/// Ejecuta la semilla una sola vez. Ver la documentación del módulo.
pub async fn ejecutar(pool: &PgPool) -> Result<Resumen, ErrorSeed> {
    if COMPLETADA.load(Ordering::SeqCst) {
        return Err(ErrorSeed::YaAplicada);
    }
    if EN_CURSO
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err(ErrorSeed::EnCurso);
    }

    let resultado = ejecutar_en_transaccion(pool).await;

    if matches!(resultado, Ok(_) | Err(ErrorSeed::YaAplicada)) {
        COMPLETADA.store(true, Ordering::SeqCst);
    }
    EN_CURSO.store(false, Ordering::SeqCst);
    resultado
}

async fn ejecutar_en_transaccion(pool: &PgPool) -> Result<Resumen, ErrorSeed> {
    // Un solo hash para todas las cuentas (misma contraseña de prueba).
    let hash = tokio::task::spawn_blocking(|| bcrypt::hash(PASSWORD_PRUEBA, bcrypt::DEFAULT_COST))
        .await
        .map_err(|e| ErrorSeed::Hash(e.to_string()))?
        .map_err(|e| ErrorSeed::Hash(e.to_string()))?;

    let mut tx = pool.begin().await?;

    // Candado: si dos instancias del backend intentan sembrar a la vez, la segunda espera aquí.
    sqlx::query("SELECT pg_advisory_xact_lock($1)")
        .bind(LLAVE_CANDADO)
        .execute(&mut *tx)
        .await?;

    let ya_aplicada = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (SELECT 1 FROM usuario WHERE correo = $1)",
    )
    .bind(CORREO_CENTINELA)
    .fetch_one(&mut *tx)
    .await?;

    if ya_aplicada {
        // Al soltar `tx` sin commit se hace rollback.
        return Err(ErrorSeed::YaAplicada);
    }

    let resumen = sembrar(&mut *tx, &hash).await?;
    tx.commit().await?;
    Ok(resumen)
}

async fn sembrar(conn: &mut PgConnection, hash: &str) -> Result<Resumen, sqlx::Error> {
    let mut r = Resumen::default();

    // ---------- 1. Planes de membresía y precios ----------
    let mut plan_por_nivel: HashMap<i16, i32> = HashMap::new();
    for plan in &PLANES {
        r.planes += sqlx::query(
            r#"INSERT INTO plan_membresia (nombre, nivel, descripcion, beneficios)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT DO NOTHING"#,
        )
        .bind(plan.nombre)
        .bind(plan.nivel)
        .bind(plan.descripcion)
        .bind(plan.beneficios)
        .execute(&mut *conn)
        .await?
        .rows_affected();

        // Si el plan ya existía (mismo nivel) se reutiliza.
        let plan_id = sqlx::query_scalar::<_, i32>("SELECT id FROM plan_membresia WHERE nivel = $1")
            .bind(plan.nivel)
            .fetch_one(&mut *conn)
            .await?;
        plan_por_nivel.insert(plan.nivel, plan_id);

        for (periodicidad, precio) in plan.precios {
            r.precios += sqlx::query(
                r#"INSERT INTO plan_precio (plan_id, periodicidad, precio)
                   VALUES ($1, $2::periodicidad, $3::numeric)
                   ON CONFLICT DO NOTHING"#,
            )
            .bind(plan_id)
            .bind(periodicidad)
            .bind(precio)
            .execute(&mut *conn)
            .await?
            .rows_affected();
        }
    }

    // ---------- 2. Recepcionistas ----------
    let mut recepcionistas: Vec<i32> = Vec::new();
    for p in &RECEPCIONISTAS {
        recepcionistas.push(insertar_usuario(conn, hash, "recepcionista", p.correo, p, p.telefono).await?);
    }
    r.recepcionistas = recepcionistas.len() as u64;

    // ---------- 3. Coaches ----------
    // (coach.id, usuario.id)
    let mut coaches: Vec<(i32, i32)> = Vec::new();
    for c in &COACHES {
        let usuario_id = insertar_usuario(conn, hash, "coach", c.persona.correo, &c.persona, c.persona.telefono).await?;
        let coach_id = sqlx::query_scalar::<_, i32>(
            "INSERT INTO coach (usuario_id, rfc, biografia) VALUES ($1, $2, $3) RETURNING id",
        )
        .bind(usuario_id)
        .bind(c.rfc)
        .bind(c.biografia)
        .fetch_one(&mut *conn)
        .await?;
        coaches.push((coach_id, usuario_id));
    }
    r.coaches = coaches.len() as u64;

    // ---------- 4. Actividades ----------
    // (actividad.id, nivel_minimo real en la BD)
    let mut actividades: Vec<(i32, i16)> = Vec::new();
    for a in &ACTIVIDADES {
        r.actividades += sqlx::query(
            r#"INSERT INTO actividad (nombre, descripcion, nivel_minimo, precio_sin_membresia)
               VALUES ($1, $2, $3, $4::numeric)
               ON CONFLICT DO NOTHING"#,
        )
        .bind(a.nombre)
        .bind(a.descripcion)
        .bind(a.nivel_minimo)
        .bind(a.precio_sin_membresia)
        .execute(&mut *conn)
        .await?
        .rows_affected();

        // Si la actividad ya existía con ese nombre se reutiliza.
        let fila = sqlx::query_as::<_, (i32, i16)>(
            "SELECT id, nivel_minimo FROM actividad WHERE nombre = $1",
        )
        .bind(a.nombre)
        .fetch_one(&mut *conn)
        .await?;
        actividades.push(fila);
    }

    // ---------- 5. Qué actividades imparte cada coach ----------
    for (coach, actividad) in COACH_ACTIVIDAD {
        r.coach_actividad += sqlx::query(
            r#"INSERT INTO coach_actividad (coach_id, actividad_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING"#,
        )
        .bind(coaches[coach].0)
        .bind(actividades[actividad].0)
        .execute(&mut *conn)
        .await?
        .rows_affected();
    }

    // ---------- 6. Horario semanal ----------
    let mut horario_ids: Vec<i32> = Vec::new();
    let mut indice_horario: HashMap<i32, usize> = HashMap::new();
    for (idx, (dia, inicio, fin, actividad, coach)) in HORARIOS.iter().enumerate() {
        let datos = &ACTIVIDADES[*actividad];
        let id = sqlx::query_scalar::<_, i32>(
            r#"INSERT INTO horario_actividad
                   (actividad_id, coach_id, dia_semana, hora_inicio, hora_fin, cupo, lugar)
               VALUES ($1, $2, $3, $4::time, $5::time, $6, $7)
               RETURNING id"#,
        )
        .bind(actividades[*actividad].0)
        .bind(coaches[*coach].0)
        .bind(*dia)
        .bind(*inicio)
        .bind(*fin)
        .bind(datos.cupo)
        .bind(datos.lugar)
        .fetch_one(&mut *conn)
        .await?;
        horario_ids.push(id);
        indice_horario.insert(id, idx);
    }
    r.horarios = horario_ids.len() as u64;

    // ---------- 7. Sesiones (desde hoy-14 hasta hoy+21 días) ----------
    // Las ya terminadas quedan como 'realizada'; las demás como 'programada'.
    // (sesion.id, horario_id, ya terminó, días respecto a hoy)
    let sesiones = sqlx::query_as::<_, (i64, Option<i32>, bool, i32)>(&format!(
        r#"INSERT INTO sesion (actividad_id, coach_id, horario_id, inicio, fin, cupo, lugar, estado)
           SELECT h.actividad_id,
                  h.coach_id,
                  h.id,
                  (({HOY} + g.n) + h.hora_inicio) AT TIME ZONE 'America/Mexico_City',
                  (({HOY} + g.n) + h.hora_fin) AT TIME ZONE 'America/Mexico_City',
                  h.cupo,
                  h.lugar,
                  CASE
                      WHEN (({HOY} + g.n) + h.hora_fin) AT TIME ZONE 'America/Mexico_City' <= now()
                      THEN 'realizada'::estado_sesion
                      ELSE 'programada'::estado_sesion
                  END
           FROM horario_actividad h
           CROSS JOIN generate_series($2::int, $3::int) AS g(n)
           WHERE h.id = ANY($1)
             AND EXTRACT(ISODOW FROM ({HOY} + g.n)) = h.dia_semana
           RETURNING id,
                     horario_id,
                     (fin <= now()) AS terminada,
                     ((inicio AT TIME ZONE 'America/Mexico_City')::date - {HOY}) AS dia_rel"#
    ))
    .bind(&horario_ids)
    .bind(SESIONES_DESDE_DIA)
    .bind(SESIONES_HASTA_DIA)
    .fetch_all(&mut *conn)
    .await?;
    r.sesiones = sesiones.len() as u64;

    // ---------- 8. Socios, membresías y pagos ----------
    struct SocioCreado {
        id: i32,
        nivel: i16,
        activa: bool,
        inicio_rel: i32,
        fin_rel: i32,
    }
    let mut socios: Vec<SocioCreado> = Vec::new();

    for (i, &(correo, nombre, apellido_p, apellido_m, nacimiento)) in SOCIOS.iter().enumerate() {
        let telefono = format!("55520{:05}", i + 1);
        let persona = PersonaSeed { correo: "", nombre, apellido_p, apellido_m, telefono: "" };
        let usuario_id = insertar_usuario(conn, hash, "socio", correo, &persona, &telefono).await?;

        let socio_id = sqlx::query_scalar::<_, i32>(&format!(
            r#"INSERT INTO socio (usuario_id, fecha_nacimiento, fecha_alta)
               VALUES ($1, $2::date, {HOY} - $3::int)
               RETURNING id"#
        ))
        .bind(usuario_id)
        .bind(nacimiento)
        .bind(dias_desde_alta(i))
        .fetch_one(&mut *conn)
        .await?;

        let nivel = nivel_plan_socio(i);
        let periodicidad = periodicidad_socio(i);
        let activa = i < PRIMER_SOCIO_VENCIDO;

        let (membresia_id, inicio_rel, fin_rel) = sqlx::query_as::<_, (i32, i32, i32)>(&format!(
            r#"INSERT INTO membresia (socio_id, plan_id, periodicidad, fecha_inicio, fecha_fin, estado)
               VALUES ($1, $2, $3::periodicidad,
                       {HOY} - $4::int,
                       (({HOY} - $4::int) + $5::interval)::date,
                       $6::estado_membresia)
               RETURNING id, (fecha_inicio - {HOY}), (fecha_fin - {HOY})"#
        ))
        .bind(socio_id)
        .bind(plan_por_nivel[&nivel])
        .bind(periodicidad)
        .bind(dias_desde_inicio_membresia(i))
        .bind(duracion(periodicidad))
        .bind(if activa { "activa" } else { "vencida" })
        .fetch_one(&mut *conn)
        .await?;
        r.membresias += 1;

        // Pago de la membresía con el precio vigente del plan.
        r.pagos += sqlx::query(
            r#"INSERT INTO pago (socio_id, concepto, membresia_id, monto, metodo, estado,
                                 referencia, fecha_pago, registrado_por)
               SELECT m.socio_id, 'membresia', m.id, pp.precio, $2::metodo_pago, 'pagado',
                      $3, (m.fecha_inicio + time '10:00') AT TIME ZONE 'America/Mexico_City', $4
               FROM membresia m
               JOIN plan_precio pp
                 ON pp.plan_id = m.plan_id AND pp.periodicidad = m.periodicidad
               WHERE m.id = $1"#,
        )
        .bind(membresia_id)
        .bind(METODOS_PAGO[i % 3])
        .bind(format!("SEED-{:04}", i + 1))
        .bind(recepcionistas[i % 3])
        .execute(&mut *conn)
        .await?
        .rows_affected();

        socios.push(SocioCreado { id: socio_id, nivel, activa, inicio_rel, fin_rel });
    }
    r.socios = socios.len() as u64;
    r.usuarios = r.recepcionistas + r.coaches + r.socios;

    // ---------- 9. Inscripciones / asistencia ----------
    // Regla determinista: el socio i se inscribe a las sesiones del horario h si
    // (i + h) % 3 == 0, su membresía está activa, su plan alcanza el nivel de la
    // actividad, la fecha cae dentro de su membresía y queda cupo.
    let mut ins_socio: Vec<i32> = Vec::new();
    let mut ins_sesion: Vec<i64> = Vec::new();
    let mut ins_estado: Vec<String> = Vec::new();
    let mut ins_registrado: Vec<i32> = Vec::new();

    for (sesion_id, horario_id, terminada, dia_rel) in &sesiones {
        let Some(h) = horario_id.and_then(|id| indice_horario.get(&id).copied()) else {
            continue;
        };
        let (_, _, _, actividad, coach) = HORARIOS[h];
        let nivel_requerido = actividades[actividad].1;
        let cupo = ACTIVIDADES[actividad].cupo as usize;
        let coach_usuario = coaches[coach].1;
        let semana = dia_rel.div_euclid(7);
        let mut ocupados = 0usize;

        for (i, socio) in socios.iter().enumerate() {
            if ocupados >= cupo {
                break;
            }
            let elegible = (i + h) % 3 == 0
                && socio.activa
                && socio.nivel >= nivel_requerido
                && socio.inicio_rel <= *dia_rel
                && *dia_rel <= socio.fin_rel;
            if !elegible {
                continue;
            }

            let (estado, registrado_por) = if !*terminada {
                r.inscritos += 1;
                ("inscrito", recepcionistas[(i + h) % 3])
            } else if (i as i32 + h as i32 + semana).rem_euclid(5) == 0 {
                r.faltas += 1;
                ("falta", coach_usuario)
            } else {
                r.asistencias += 1;
                ("asistio", coach_usuario)
            };

            ins_socio.push(socio.id);
            ins_sesion.push(*sesion_id);
            ins_estado.push(estado.to_string());
            ins_registrado.push(registrado_por);
            ocupados += 1;
        }
    }

    // Una sola consulta para todas las inscripciones.
    sqlx::query(
        r#"INSERT INTO inscripcion (socio_id, sesion_id, tipo_acceso, estado,
                                    fecha_inscripcion, fecha_asistencia, registrado_por)
           SELECT x.socio_id,
                  s.id,
                  'membresia',
                  x.estado::estado_inscripcion,
                  LEAST(now(), s.inicio - interval '2 days'),
                  CASE WHEN x.estado = 'asistio' THEN s.inicio + interval '5 minutes' END,
                  x.registrado_por
           FROM UNNEST($1::int4[], $2::int8[], $3::text[], $4::int4[])
                AS x(socio_id, sesion_id, estado, registrado_por)
           JOIN sesion s ON s.id = x.sesion_id"#,
    )
    .bind(&ins_socio)
    .bind(&ins_sesion)
    .bind(&ins_estado)
    .bind(&ins_registrado)
    .execute(&mut *conn)
    .await?;

    Ok(r)
}

/// Inserta un usuario y devuelve su id. El correo y el teléfono se pasan aparte
/// porque en los socios se generan a partir de su índice.
async fn insertar_usuario(
    conn: &mut PgConnection,
    hash: &str,
    rol: &str,
    correo: &str,
    p: &PersonaSeed,
    telefono: &str,
) -> Result<i32, sqlx::Error> {
    sqlx::query_scalar::<_, i32>(
        r#"INSERT INTO usuario (correo, password_hash, rol, nombre, apellido_p, apellido_m, telefono)
           VALUES ($1, $2, $3::rol_usuario, $4, $5, $6, $7)
           RETURNING id"#,
    )
    .bind(correo)
    .bind(hash)
    .bind(rol)
    .bind(p.nombre)
    .bind(p.apellido_p)
    .bind(p.apellido_m)
    .bind(telefono)
    .fetch_one(&mut *conn)
    .await
}
