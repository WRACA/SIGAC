# Datos de prueba (semilla)

Este documento describe **toda** la información que inserta el script de semilla
[`backend/src/seed.rs`](../backend/src/seed.rs). El esquema de las tablas está en [database.md](database.md).

- **Contraseña de todas las cuentas:** `12345678`. En la BD solo se guarda su **hash bcrypt** (`usuario.password_hash`), nunca el texto plano.
- **Todas las cuentas pueden iniciar sesión** en `POST /api/auth/login` (recepcionistas, instructores y socios).
- **Dominio de los correos:** `@sigac.com`.
- **"hoy"** = fecha en el momento de ejecutar la semilla, en la zona `America/Mexico_City`.
  Las fechas se guardan relativas a ese día para que siempre haya clases pasadas y futuras.
- Los `id` los asigna PostgreSQL; aquí se identifican los registros por sus claves naturales (correo, nombre, RFC...).

---

## 1. Cómo se ejecuta y control de una sola vez

1. Levantar el backend: `cargo run` (desde `backend/`).
2. En esa misma consola escribir **`sembrar`** y pulsar Enter.
3. La consola imprime un resumen con el número de filas insertadas por tabla.

El script **solo se aplica una vez por base de datos**:

| Capa | Mecanismo |
|---|---|
| Proceso | Dos `AtomicBool`: si ya terminó, o se está ejecutando, se rechaza la palabra clave. |
| Base de datos | Todo corre en **una sola transacción**. Primero toma un candado `pg_advisory_xact_lock(72102026)` (dos backends a la vez → el segundo espera) y luego revisa si existe el usuario centinela `recepcion1@sigac.com`. Si existe, responde *"La semilla ya fue aplicada"* y no toca nada. |
| Integridad | Si cualquier inserción falla (permisos, conexión, conflicto), se hace **rollback completo**: nunca queda a medias. Las restricciones `UNIQUE` (correo, RFC) impedirían duplicar los datos aunque se borrara el centinela. |

Como el control vive en la propia base de datos, funciona aunque varios integrantes del equipo
corran el backend contra la misma BD de Neon.

**Usuario de BD:** si en `backend/.env` existe `DB_URL_SEED`, se usa esa conexión (útil si `sigac_api`
no tiene permiso de `INSERT` en tablas de catálogo); si no, se usa `DB_URL_API`.

---

## 2. Cuentas de acceso (`usuario`) — 41 en total

| Rol | Cantidad | Correos |
|---|---:|---|
| `recepcionista` | 3 | `recepcion1@sigac.com` … `recepcion3@sigac.com` |
| `coach` (instructor) | 6 | `coach1@sigac.com` … `coach6@sigac.com` |
| `socio` | 32 | nombre.apellido (sin acentos), p. ej. `ana.martinez@sigac.com` — lista completa en 2.3 |

Todas con `activo = true` y contraseña `12345678` (guardada solo como hash bcrypt). Todas pueden iniciar sesión.

### 2.1 Recepcionistas

| Correo | Nombre | Teléfono |
|---|---|---|
| recepcion1@sigac.com | Laura Méndez Ríos | 5551000001 |
| recepcion2@sigac.com | Jorge Salinas Vega | 5551000002 |
| recepcion3@sigac.com | Patricia Ortega Luna | 5551000003 |

### 2.2 Instructores (`usuario` + `coach`)

| Correo | Nombre | Teléfono | RFC | Actividades que imparte (`coach_actividad`) |
|---|---|---|---|---|
| coach1@sigac.com | Ricardo Torres Bravo | 5551100001 | TOBR850312AB1 | Entrenamiento Funcional, Box |
| coach2@sigac.com | Mariana Castillo Ruiz | 5551100002 | CARM900725CD2 | Yoga, Pilates, Stretching |
| coach3@sigac.com | Daniel Herrera Soto | 5551100003 | HESD880114EF3 | Spinning, Entrenamiento Funcional, Box (suplente) |
| coach4@sigac.com | Sofía Navarro Gil | 5551100004 | NAGS920503GH4 | Zumba, Stretching |
| coach5@sigac.com | Andrés Fuentes Lara | 5551100005 | FULA870918IJ5 | Natación, Entrenamiento Funcional |
| coach6@sigac.com | Valeria Rojas Peña | 5551100006 | ROPV950221KL6 | Pilates, Yoga, Zumba |

Biografías (`coach.biografia`):

- **Ricardo:** Entrenador de box y acondicionamiento físico con 12 años de experiencia. Certificado en entrenamiento funcional.
- **Mariana:** Instructora de yoga y pilates. Formación de 500 horas en yoga y especialidad en movilidad y flexibilidad.
- **Daniel:** Ciclista amateur e instructor de spinning. Diseña rutinas de intervalos de alta intensidad.
- **Sofía:** Bailarina profesional e instructora de zumba. Combina baile y cardio en clases para todos los niveles.
- **Andrés:** Exnadador de alto rendimiento y salvavidas certificado. Imparte natación y entrenamiento funcional.
- **Valeria:** Licenciada en ciencias del deporte. Instructora de pilates, yoga y zumba.

### 2.3 Socios (`usuario` + `socio`)

`numero_socio` lo asigna la secuencia `numero_socio_seq`. `fecha_alta` = hoy − (30 + 12·(n−1)) días.

Cada socio recibe además una credencial QR (`credencial_qr`) con estado `activa` y token UUID aleatorio generado por `gen_random_uuid()` (por eso el token cambia en cada base sembrada).

| # | Correo | Nombre | Teléfono | Nacimiento | Alta |
|---|---|---|---|---|---|
| 1 | ana.martinez@sigac.com | Ana Martínez López | 5552000001 | 1990-03-14 | hoy − 30 días |
| 2 | carlos.ramirez@sigac.com | Carlos Ramírez Pérez | 5552000002 | 1985-07-22 | hoy − 42 días |
| 3 | fernanda.gomez@sigac.com | Fernanda Gómez Díaz | 5552000003 | 1998-11-05 | hoy − 54 días |
| 4 | luis.hernandez@sigac.com | Luis Hernández Cruz | 5552000004 | 1979-01-30 | hoy − 66 días |
| 5 | gabriela.sanchez@sigac.com | Gabriela Sánchez Morales | 5552000005 | 1993-06-18 | hoy − 78 días |
| 6 | miguel.flores@sigac.com | Miguel Flores Jiménez | 5552000006 | 2000-09-09 | hoy − 90 días |
| 7 | daniela.vargas@sigac.com | Daniela Vargas Reyes | 5552000007 | 1996-12-01 | hoy − 102 días |
| 8 | jose.castro@sigac.com | José Castro Romero | 5552000008 | 1988-04-27 | hoy − 114 días |
| 9 | paola.ortiz@sigac.com | Paola Ortiz Guzmán | 5552000009 | 1991-08-15 | hoy − 126 días |
| 10 | alejandro.mendoza@sigac.com | Alejandro Mendoza Silva | 5552000010 | 1983-02-11 | hoy − 138 días |
| 11 | valentina.aguilar@sigac.com | Valentina Aguilar Ramos | 5552000011 | 2002-05-23 | hoy − 150 días |
| 12 | roberto.chavez@sigac.com | Roberto Chávez Medina | 5552000012 | 1975-10-08 | hoy − 162 días |
| 13 | camila.rivera@sigac.com | Camila Rivera Torres | 5552000013 | 1999-01-19 | hoy − 174 días |
| 14 | eduardo.moreno@sigac.com | Eduardo Moreno Vázquez | 5552000014 | 1987-03-03 | hoy − 186 días |
| 15 | isabel.delgado@sigac.com | Isabel Delgado Cortés | 5552000015 | 1994-07-07 | hoy − 198 días |
| 16 | fernando.ruiz@sigac.com | Fernando Ruiz Castillo | 5552000016 | 1981-11-28 | hoy − 210 días |
| 17 | lucia.dominguez@sigac.com | Lucía Domínguez Herrera | 5552000017 | 1997-09-12 | hoy − 222 días |
| 18 | javier.guerrero@sigac.com | Javier Guerrero Núñez | 5552000018 | 1990-06-02 | hoy − 234 días |
| 19 | mariana.pena@sigac.com | Mariana Peña Salazar | 5552000019 | 2001-02-25 | hoy − 246 días |
| 20 | diego.rosales@sigac.com | Diego Rosales Campos | 5552000020 | 1986-12-16 | hoy − 258 días |
| 21 | natalia.ibarra@sigac.com | Natalia Ibarra Fuentes | 5552000021 | 1995-04-04 | hoy − 270 días |
| 22 | sergio.cabrera@sigac.com | Sergio Cabrera Luna | 5552000022 | 1978-08-21 | hoy − 282 días |
| 23 | andrea.velazquez@sigac.com | Andrea Velázquez Soto | 5552000023 | 2003-03-30 | hoy − 294 días |
| 24 | raul.montes@sigac.com | Raúl Montes Orozco | 5552000024 | 1984-05-13 | hoy − 306 días |
| 25 | regina.escobar@sigac.com | Regina Escobar Pineda | 5552000025 | 1992-10-24 | hoy − 318 días |
| 26 | arturo.navarro@sigac.com | Arturo Navarro Ochoa | 5552000026 | 1980-01-07 | hoy − 330 días |
| 27 | ximena.lozano@sigac.com | Ximena Lozano Valdez | 5552000027 | 2000-07-17 | hoy − 342 días |
| 28 | hector.padilla@sigac.com | Héctor Padilla Ríos | 5552000028 | 1977-09-29 | hoy − 354 días |
| 29 | renata.juarez@sigac.com | Renata Juárez Cervantes | 5552000029 | 1996-02-08 | hoy − 366 días |
| 30 | oscar.maldonado@sigac.com | Óscar Maldonado León | 5552000030 | 1989-11-11 | hoy − 378 días |
| 31 | carolina.bautista@sigac.com | Carolina Bautista Robles | 5552000031 | 1993-12-20 | hoy − 390 días |
| 32 | tomas.villarreal@sigac.com | Tomás Villarreal Acosta | 5552000032 | 1982-06-06 | hoy − 402 días |

---

## 3. Planes de membresía

### 3.1 `plan_membresia`

| Nombre | Nivel | Descripción | Beneficios |
|---|---:|---|---|
| Básico | 1 | Acceso a las clases grupales de nivel básico. | Yoga, Spinning, Zumba y Stretching incluidos. |
| Plus | 2 | Acceso a clases de nivel básico e intermedio. | Todo lo del plan Básico más Entrenamiento Funcional y Pilates. |
| Premium | 3 | Acceso total a todas las actividades del club. | Todo lo del plan Plus más Natación y Box. |

### 3.2 `plan_precio`

| Plan | Mensual | Semestral | Anual |
|---|---:|---:|---:|
| Básico | $499.00 | $2,699.00 | $4,999.00 |
| Plus | $749.00 | $3,999.00 | $7,499.00 |
| Premium | $999.00 | $5,399.00 | $9,999.00 |

> Si ya existía un plan con el mismo nivel/nombre, o un precio para el mismo plan y periodicidad,
> **no se sobrescribe**: se reutiliza el existente (`ON CONFLICT DO NOTHING`).

---

## 4. Actividades (`actividad`)

| Nombre | Nivel mínimo | Precio sin membresía | Cupo | Lugar | Descripción |
|---|---:|---:|---:|---|---|
| Yoga | 1 | $120.00 | 20 | Salón A | Posturas, respiración y relajación para mejorar flexibilidad y equilibrio. |
| Spinning | 1 | $130.00 | 15 | Sala de Ciclismo | Ciclismo indoor con música e intervalos de intensidad. |
| Entrenamiento Funcional | 2 | $150.00 | 18 | Salón B | Circuitos de fuerza y resistencia con peso corporal y accesorios. |
| Zumba | 1 | $100.00 | 25 | Salón A | Clase de baile aeróbico con ritmos latinos. |
| Natación | 3 | $200.00 | 12 | Alberca | Técnica de estilos y resistencia en alberca semiolímpica. |
| Pilates | 2 | $160.00 | 15 | Salón B | Fortalecimiento del core, postura y control del movimiento. |
| Box | 3 | $180.00 | 12 | Ring | Técnica de golpeo, desplazamientos y acondicionamiento. |
| Stretching | 1 | — (no se vende suelta) | 20 | Salón A | Estiramientos guiados y movilidad articular. |

Cupo y lugar se guardan en `horario_actividad` / `sesion` (la tabla `actividad` no tiene esas columnas).
Si ya existía una actividad con el mismo nombre se reutiliza tal cual.

---

## 5. Horario semanal (`horario_actividad`) — 29 bloques

Lunes a viernes: 5 clases diarias, **incluida siempre una de 13:00 a 14:00**. Sábado: 4 clases. Todas `vigente = true`.

| Hora | Lunes | Martes | Miércoles | Jueves | Viernes |
|---|---|---|---|---|---|
| 07:00–08:00 | Spinning · Daniel | Natación · Andrés | Spinning · Daniel | Entrenamiento Funcional · Andrés | Natación · Andrés |
| 09:00–10:00 | Yoga · Mariana | Pilates · Valeria | Zumba · Valeria | Yoga · Valeria | Stretching · Mariana |
| **13:00–14:00** | **Entrenamiento Funcional · Ricardo** | **Yoga · Mariana** | **Box · Ricardo** | **Spinning · Daniel** | **Pilates · Valeria** |
| 18:00–19:00 | Zumba · Sofía | Entrenamiento Funcional · Daniel | Pilates · Mariana | Zumba · Sofía | Entrenamiento Funcional · Ricardo |
| 19:30–20:30 | Box · Ricardo | Stretching · Sofía | Natación · Andrés | Box · Ricardo | Spinning · Daniel |

| Hora | Sábado |
|---|---|
| 08:00–09:00 | Yoga · Mariana |
| 09:30–10:30 | Entrenamiento Funcional · Daniel |
| 11:00–12:00 | Natación · Andrés |
| 12:30–13:30 | Zumba · Sofía |

El cupo y el lugar de cada bloque son los de su actividad (tabla de la sección 4).
Ningún instructor tiene dos clases a la misma hora.

---

## 6. Sesiones (`sesion`)

Se generan a partir del horario semanal para **cada día desde hoy − 14 hasta hoy + 21** (36 días):

- `actividad_id`, `coach_id`, `cupo`, `lugar` copiados del bloque; `horario_id` = el bloque.
- `inicio` / `fin` = fecha + hora del bloque en `America/Mexico_City`.
- `estado = 'realizada'` si la sesión ya terminó al ejecutar la semilla; si no, `'programada'`
  (una clase que esté ocurriendo en ese momento queda `programada`, así se puede probar el pase de lista).

Total: **≈145–150 sesiones** (depende del día de la semana en que se ejecute).

---

## 7. Membresías (`membresia`) — una por socio

Reglas: plan = nivel `((n−1) mod 3) + 1`; los socios 29–32 tienen la membresía **vencida**
(mensual, iniciada hace 60 días). `fecha_fin` = `fecha_inicio` + duración de la periodicidad.

| # | Socio | Plan (nivel) | Periodicidad | Inicio | Fin | Estado |
|---|---|---|---|---|---|---|
| 1 | Ana Martínez | Básico (1) | mensual | hoy − 2 días | inicio + 1 mes | activa |
| 2 | Carlos Ramírez | Plus (2) | semestral | hoy − 7 días | inicio + 6 meses | activa |
| 3 | Fernanda Gómez | Premium (3) | anual | hoy − 12 días | inicio + 1 año | activa |
| 4 | Luis Hernández | Básico (1) | mensual | hoy − 17 días | inicio + 1 mes | activa |
| 5 | Gabriela Sánchez | Plus (2) | mensual | hoy − 22 días | inicio + 1 mes | activa |
| 6 | Miguel Flores | Premium (3) | semestral | hoy − 2 días | inicio + 6 meses | activa |
| 7 | Daniela Vargas | Básico (1) | anual | hoy − 7 días | inicio + 1 año | activa |
| 8 | José Castro | Plus (2) | mensual | hoy − 12 días | inicio + 1 mes | activa |
| 9 | Paola Ortiz | Premium (3) | mensual | hoy − 17 días | inicio + 1 mes | activa |
| 10 | Alejandro Mendoza | Básico (1) | semestral | hoy − 22 días | inicio + 6 meses | activa |
| 11 | Valentina Aguilar | Plus (2) | anual | hoy − 2 días | inicio + 1 año | activa |
| 12 | Roberto Chávez | Premium (3) | mensual | hoy − 7 días | inicio + 1 mes | activa |
| 13 | Camila Rivera | Básico (1) | mensual | hoy − 12 días | inicio + 1 mes | activa |
| 14 | Eduardo Moreno | Plus (2) | semestral | hoy − 17 días | inicio + 6 meses | activa |
| 15 | Isabel Delgado | Premium (3) | anual | hoy − 22 días | inicio + 1 año | activa |
| 16 | Fernando Ruiz | Básico (1) | mensual | hoy − 2 días | inicio + 1 mes | activa |
| 17 | Lucía Domínguez | Plus (2) | mensual | hoy − 7 días | inicio + 1 mes | activa |
| 18 | Javier Guerrero | Premium (3) | semestral | hoy − 12 días | inicio + 6 meses | activa |
| 19 | Mariana Peña | Básico (1) | anual | hoy − 17 días | inicio + 1 año | activa |
| 20 | Diego Rosales | Plus (2) | mensual | hoy − 22 días | inicio + 1 mes | activa |
| 21 | Natalia Ibarra | Premium (3) | mensual | hoy − 2 días | inicio + 1 mes | activa |
| 22 | Sergio Cabrera | Básico (1) | semestral | hoy − 7 días | inicio + 6 meses | activa |
| 23 | Andrea Velázquez | Plus (2) | anual | hoy − 12 días | inicio + 1 año | activa |
| 24 | Raúl Montes | Premium (3) | mensual | hoy − 17 días | inicio + 1 mes | activa |
| 25 | Regina Escobar | Básico (1) | mensual | hoy − 22 días | inicio + 1 mes | activa |
| 26 | Arturo Navarro | Plus (2) | semestral | hoy − 2 días | inicio + 6 meses | activa |
| 27 | Ximena Lozano | Premium (3) | anual | hoy − 7 días | inicio + 1 año | activa |
| 28 | Héctor Padilla | Básico (1) | mensual | hoy − 12 días | inicio + 1 mes | activa |
| 29 | Renata Juárez | Plus (2) | mensual | hoy − 60 días | inicio + 1 mes | vencida |
| 30 | Óscar Maldonado | Premium (3) | mensual | hoy − 60 días | inicio + 1 mes | vencida |
| 31 | Carolina Bautista | Básico (1) | mensual | hoy − 60 días | inicio + 1 mes | vencida |
| 32 | Tomás Villarreal | Plus (2) | mensual | hoy − 60 días | inicio + 1 mes | vencida |

Resultado: 28 activas (10 Básico, 9 Plus, 9 Premium) y 4 vencidas.

---

## 8. Pagos (`pago`) — uno por membresía

`concepto = 'membresia'`, `estado = 'pagado'`, `monto` = precio del plan según su periodicidad (tabla 3.2).

| Referencia | Socio | Monto | Método | Fecha de pago | Registrado por |
|---|---|---|---|---|---|
| SEED-0001 | Ana Martínez | $499.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0002 | Carlos Ramírez | $3999.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0003 | Fernanda Gómez | $9999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0004 | Luis Hernández | $499.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0005 | Gabriela Sánchez | $749.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0006 | Miguel Flores | $5399.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0007 | Daniela Vargas | $4999.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0008 | José Castro | $749.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0009 | Paola Ortiz | $999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0010 | Alejandro Mendoza | $2699.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0011 | Valentina Aguilar | $7499.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0012 | Roberto Chávez | $999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0013 | Camila Rivera | $499.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0014 | Eduardo Moreno | $3999.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0015 | Isabel Delgado | $9999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0016 | Fernando Ruiz | $499.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0017 | Lucía Domínguez | $749.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0018 | Javier Guerrero | $5399.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0019 | Mariana Peña | $4999.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0020 | Diego Rosales | $749.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0021 | Natalia Ibarra | $999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0022 | Sergio Cabrera | $2699.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0023 | Andrea Velázquez | $7499.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0024 | Raúl Montes | $999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0025 | Regina Escobar | $499.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0026 | Arturo Navarro | $3999.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0027 | Ximena Lozano | $9999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0028 | Héctor Padilla | $499.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0029 | Renata Juárez | $749.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |
| SEED-0030 | Óscar Maldonado | $999.00 | transferencia | inicio de membresía, 10:00 | recepcion3@sigac.com |
| SEED-0031 | Carolina Bautista | $499.00 | efectivo | inicio de membresía, 10:00 | recepcion1@sigac.com |
| SEED-0032 | Tomás Villarreal | $749.00 | tarjeta | inicio de membresía, 10:00 | recepcion2@sigac.com |

---

## 9. Inscripciones y asistencia (`inscripcion`)

Regla determinista (sin aleatoriedad). Sea *n−1* el índice del socio (0–31) y *h* el índice del bloque
en el horario (0–28, en el orden de la sección 5: lunes 07:00 = 0 … sábado 12:30 = 28).
El socio se inscribe a una sesión si se cumple **todo**:

1. `(índice_socio + h) mod 3 = 0`
2. su membresía está **activa** (los socios 29–32 no tienen inscripciones),
3. el nivel de su plan ≥ `nivel_minimo` de la actividad,
4. la fecha de la sesión está dentro de su membresía,
5. todavía hay cupo en la sesión.

Valores de cada inscripción:

| Sesión | `estado` | `fecha_asistencia` | `registrado_por` |
|---|---|---|---|
| Futura / en curso | `inscrito` | NULL | Una de las recepcionistas |
| Pasada, `(índice_socio + h + semana) mod 5 = 0` | `falta` | NULL | Usuario del coach de la sesión |
| Pasada, resto | `asistio` | inicio + 5 min | Usuario del coach de la sesión |

- `tipo_acceso = 'membresia'` en todas.
- `fecha_inscripcion` = inicio de la sesión − 2 días (o el momento de la ejecución, si eso es antes).
- *semana* = ⌊(días entre hoy y la sesión) / 7⌋.

Totales aproximados: **≈800–850 inscripciones** → ≈550–590 `inscrito`, ≈210–230 `asistio`, ≈55 `falta`.
El resumen impreso en consola al ejecutar la semilla muestra los números exactos.

---

## 10. Tablas que NO se llenan

- Pagos con `concepto = 'sesion'`: no hay inscripciones con `tipo_acceso = 'pago'`.
- Usuarios con rol `administrador`.
