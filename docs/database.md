# Modelo de datos

```dbml
Project club_deportivo {
  database_type: 'PostgreSQL'
  Note: 'Gestión de club deportivo: socios, coaches, membresías, actividades, sesiones y pagos'
}

// =====================================================
// ENUMS
// =====================================================
Enum rol_usuario {
  socio
  coach
  recepcionista
  administrador
}

Enum estado_credencial {
  activa
  inactiva
  revocada
}

Enum periodicidad {
  mensual
  semestral
  anual
}

Enum estado_membresia {
  activa
  vencida
  cancelada
}

Enum estado_sesion {
  programada
  en_curso
  realizada
  cancelada
}

Enum tipo_acceso {
  membresia
  pago
}

Enum estado_inscripcion {
  inscrito
  asistio
  falta
  cancelada
}

Enum concepto_pago {
  membresia
  sesion
}

Enum metodo_pago {
  efectivo
  tarjeta
  transferencia
  otro
}

Enum estado_pago {
  pagado
  pendiente
  reembolsado
}

// =====================================================
// USUARIOS Y PERFILES
// =====================================================
Table usuario {
  id int [pk, increment]
  correo varchar(255) [not null, unique, note: 'Credencial de login. Única fuente del correo']
  password_hash varchar(255) [not null, note: 'Hash (argon2/bcrypt), nunca texto plano']
  rol rol_usuario [not null]
  nombre varchar(100) [not null]
  apellido_p varchar(100) [not null]
  apellido_m varchar(100)
  telefono varchar(20)
  activo boolean [not null, default: true]
  ultimo_acceso timestamptz
  creado_en timestamptz [not null, default: `now()`]
  actualizado_en timestamptz [not null, default: `now()`]

  indexes {
    rol
  }

  Note: 'Todos los que inician sesión. Recepcionistas y administrativos solo existen aquí (rol)'
}

Table socio {
  id int [pk, increment]
  usuario_id int [not null, unique]
  numero_socio int [not null, unique, default: `nextval('numero_socio_seq')`, note: 'Número de socio visible para el cliente']
  fecha_nacimiento date
  fecha_alta date [not null, default: `current_date`]

  Note: 'Perfil 1:1 con usuario (rol = socio)'
}

Table credencial_qr {
  id int [pk, increment]
  socio_id int [not null]
  token uuid [not null, unique, default: `gen_random_uuid()`, note: 'UUID v4 aleatorio. Contenido del QR: SIGAC:SOCIO:1:<token>']
  estado estado_credencial [not null, default: 'activa']
  creado_en timestamptz [not null, default: `now()`]
  revocado_en timestamptz

  indexes {
    socio_id [name: 'ix_credencial_qr_socio']
    socio_id [unique, name: 'uq_credencial_qr_socio_activa', note: 'Parcial: WHERE estado = activa']
  }

  checks {
    `(estado = 'activa') = (revocado_en IS NULL)` [name: 'ck_credencial_qr_revocacion']
  }

  Note: 'Credenciales QR de socios. Máximo una activa por socio. Solo las activas son válidas'
}

Table coach {
  id int [pk, increment]
  usuario_id int [not null, unique]
  rfc varchar(13) [not null, unique]
  biografia text [note: 'Se muestra en la página informativa']

  Note: 'Perfil 1:1 con usuario (rol = coach)'
}

// =====================================================
// MEMBRESÍAS
// =====================================================
Table plan_membresia {
  id int [pk, increment]
  nombre varchar(100) [not null, unique]
  nivel smallint [not null, unique, note: '1 = básico ... N = más alto. Tier 3+ => nivel >= 3']
  descripcion text
  beneficios text
  activo boolean [not null, default: true]

  checks {
    `nivel > 0` [name: 'ck_plan_nivel_positivo']
  }

  Note: 'Tiers de membresía'
}

Table plan_precio {
  id int [pk, increment]
  plan_id int [not null]
  periodicidad periodicidad [not null]
  precio decimal(10,2) [not null]
  activo boolean [not null, default: true]

  indexes {
    (plan_id, periodicidad) [unique]
  }

  checks {
    `precio >= 0` [name: 'ck_precio_no_negativo']
  }

  Note: 'Precio de cada tier según periodicidad (mensual, semestral, anual)'
}

Table membresia {
  id int [pk, increment]
  socio_id int [not null]
  plan_id int [not null]
  periodicidad periodicidad [not null]
  fecha_inicio date [not null]
  fecha_fin date [not null]
  estado estado_membresia [not null, default: 'activa']
  creado_en timestamptz [not null, default: `now()`]

  indexes {
    (socio_id, estado)
    fecha_fin
    plan_id
  }

  checks {
    `fecha_fin > fecha_inicio` [name: 'ck_membresia_fechas']
  }

  Note: 'Historial de membresías por socio. Cada renovación es una fila nueva'
}

// =====================================================
// ACTIVIDADES, COACHES Y HORARIOS
// =====================================================
Table actividad {
  id int [pk, increment]
  nombre varchar(100) [not null, unique]
  descripcion text
  nivel_minimo smallint [not null, default: 1, note: 'Nivel de plan_membresia necesario para acceder incluido']
  precio_sin_membresia decimal(10,2) [note: 'Precio por sesión si el socio no tiene el nivel. NULL = no se vende suelta']
  creado_en timestamptz [not null, default: `now()`]
  actualizado_en timestamptz [not null, default: `now()`]
  eliminado_en timestamptz [note: 'SOFT DELETE: NULL = visible, con fecha = eliminada']

  indexes {
    eliminado_en
  }

  checks {
    `nivel_minimo > 0` [name: 'ck_actividad_nivel']
    `precio_sin_membresia is null or precio_sin_membresia >= 0` [name: 'ck_actividad_precio']
  }

  Note: 'Catálogo de actividades. NUNCA se borra con DELETE, solo se marca eliminado_en'
}

Table coach_actividad {
  coach_id int [not null]
  actividad_id int [not null]

  indexes {
    (coach_id, actividad_id) [pk]
  }

  Note: 'Qué actividades puede impartir cada coach'
}

Table horario_actividad {
  id int [pk, increment]
  actividad_id int [not null]
  coach_id int [not null]
  dia_semana smallint [not null, note: '1 = lunes ... 7 = domingo']
  hora_inicio time [not null]
  hora_fin time [not null]
  cupo smallint [not null]
  lugar varchar(100)
  vigente boolean [not null, default: true]

  indexes {
    (actividad_id, dia_semana)
    coach_id
  }

  checks {
    `dia_semana between 1 and 7` [name: 'ck_horario_dia']
    `hora_fin > hora_inicio` [name: 'ck_horario_horas']
    `cupo > 0` [name: 'ck_horario_cupo']
  }

  Note: 'Plantilla semanal recurrente. Alimenta la página informativa y sirve para generar sesiones'
}

Table sesion {
  id bigint [pk, increment]
  actividad_id int [not null]
  coach_id int [not null]
  horario_id int [note: 'NULL si es una sesión extraordinaria']
  inicio timestamptz [not null]
  fin timestamptz [not null]
  cupo smallint [not null]
  lugar varchar(100)
  estado estado_sesion [not null, default: 'programada']
  creado_en timestamptz [not null, default: `now()`]

  indexes {
    inicio
    (actividad_id, inicio)
    (coach_id, inicio)
    (horario_id, inicio) [unique]
  }

  checks {
    `fin > inicio` [name: 'ck_sesion_fechas']
    `cupo > 0` [name: 'ck_sesion_cupo']
  }

  Note: 'Ocurrencia concreta de una actividad en una fecha y hora'
}

// =====================================================
// INSCRIPCIONES / ASISTENCIA
// =====================================================
Table inscripcion {
  id bigint [pk, increment]
  socio_id int [not null]
  sesion_id bigint [not null]
  tipo_acceso tipo_acceso [not null, note: 'membresia = incluido por su tier; pago = pagó la sesión']
  estado estado_inscripcion [not null, default: 'inscrito']
  fecha_inscripcion timestamptz [not null, default: `now()`]
  fecha_asistencia timestamptz [note: 'Cuando se registra la asistencia']
  registrado_por int [note: 'Usuario (recepcionista/coach) que marcó la asistencia']

  indexes {
    (socio_id, sesion_id) [unique]
    sesion_id
    estado
  }

  Note: 'Reserva del socio a una sesión. Su estado reemplaza la tabla asistencia'
}

// =====================================================
// PAGOS
// =====================================================
Table pago {
  id bigint [pk, increment]
  socio_id int [not null]
  concepto concepto_pago [not null]
  membresia_id int [note: 'Solo si concepto = membresia']
  inscripcion_id bigint [note: 'Solo si concepto = sesion']
  monto decimal(10,2) [not null]
  metodo metodo_pago [not null]
  estado estado_pago [not null, default: 'pagado']
  referencia varchar(100) [note: 'Folio, ticket o referencia bancaria']
  fecha_pago timestamptz [not null, default: `now()`]
  registrado_por int [note: 'Usuario que capturó el pago']

  indexes {
    fecha_pago
    socio_id
    (concepto, fecha_pago)
  }

  checks {
    `monto > 0` [name: 'ck_pago_monto']
    `(concepto = 'membresia' and membresia_id is not null and inscripcion_id is null) or (concepto = 'sesion' and inscripcion_id is not null and membresia_id is null)` [name: 'ck_pago_concepto']
  }

  Note: 'Pagos de membresías y de sesiones sueltas'
}

// =====================================================
// RELACIONES (todas con delete: restrict, nada se borra en cascada)
// =====================================================
Ref: socio.usuario_id - usuario.id [delete: restrict]
Ref: coach.usuario_id - usuario.id [delete: restrict]
Ref: credencial_qr.socio_id > socio.id [delete: restrict]

Ref: plan_precio.plan_id > plan_membresia.id [delete: restrict]
Ref: membresia.socio_id > socio.id [delete: restrict]
Ref: membresia.plan_id > plan_membresia.id [delete: restrict]

Ref: coach_actividad.coach_id > coach.id [delete: restrict]
Ref: coach_actividad.actividad_id > actividad.id [delete: restrict]

Ref: horario_actividad.(coach_id, actividad_id) > coach_actividad.(coach_id, actividad_id) [delete: restrict]
Ref: sesion.(coach_id, actividad_id) > coach_actividad.(coach_id, actividad_id) [delete: restrict]
Ref: sesion.horario_id > horario_actividad.id [delete: restrict]

Ref: inscripcion.socio_id > socio.id [delete: restrict]
Ref: inscripcion.sesion_id > sesion.id [delete: restrict]
Ref: inscripcion.registrado_por > usuario.id [delete: restrict]

Ref: pago.socio_id > socio.id [delete: restrict]
Ref: pago.membresia_id > membresia.id [delete: restrict]
Ref: pago.inscripcion_id > inscripcion.id [delete: restrict]
Ref: pago.registrado_por > usuario.id [delete: restrict]
```
