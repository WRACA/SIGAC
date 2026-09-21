# Actualizaciones de roles, modo de trabajo y arquitectura 20260921

## Roles

|Persona|Rol|
|---|---|
|Cándido| PO |
|Alessandra| QA |
|Wendy|Frontend|
|Roberto|Fullstack|
|Aristeo|Backend|

## Decisiones sobre arquitectura (ver [ADR-0000](docs/decisiones/ADR-0000.md))
La arquitectura actual propone usar ReactJS + hostear la base de datos en supabase + no backend. El ADR correspondiente está ligado a su RFC con varias propuestas de arquitectura.

## Control de versiones y flujo de trabajo (Commits convencionales)
La rama main queda exclusivamente para el merge de otras ramas. Las tareas mayores deberán ser delegadas a su propia rama y de estas abrir más en caso de ser necesario. Las ramas deberán tener su propia nomenclatura, ejemplo:   
`feat(sidebar): se agregó un sidebar en la vista de administrador`
Las ramas para trabajar serán las siguientes:
- main
  - "Tarea1"
    - "nombre de la rama"
  - "Tarea2"
    - "nombre de la otra rama"

Para que quede más claro, ver [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Los más comunes y que se usarán más seguidos son los siguientes:    

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `chore: ...`  

Este commit se hará a una rama llamada `Documentacion` con el commit `docs(DEFINICION): Se abre a discusión los cuestinamientos propuestos por el profesor en la clase de la fecha 2026-09-21. A su vez se especifica el flujo de trabajo discutido entre el equipo de trabajo antes del feedback del profesor.`

Se hace merge después de que haya pasado todas las pruebas (automatizadas y realizadas por QA).

## Dailies y reuniones
Se decidió hacer dailies 3 veces a la semana:    
|Día|Modalidad|Hora|
|---|---|---|
|Martes|Virtual|20:00|
|Miercoles|Virtual|20:00|
|Viernes|Presencial|12:00|

# Guía rápida: ADR y RFC en un repositorio de GitHub

En un proyecto colaborativo es común necesitar una forma ordenada de **proponer cambios**, **discutir alternativas** y **dejar registro de por qué se tomó una decisión**.

Para esto pueden utilizarse principalmente dos tipos de documentos:

- **ADR — Architecture Decision Record**
- **RFC — Request for Comments**

Aunque están relacionados, cumplen funciones distintas.

---

# 1. ADR — Architecture Decision Record

Un **ADR** sirve para registrar una decisión técnica o arquitectónica importante del proyecto.

Su objetivo principal es responder:

> ¿Qué decisión se tomó y por qué?

Un ADR permite que alguien que llegue al proyecto meses después pueda entender por qué se eligió cierta tecnología, arquitectura o estrategia.

## Ejemplos de decisiones que pueden requerir un ADR

- Elegir entre Spring Boot, FastAPI, Django o Rust para el backend.
- Decidir usar Vue en lugar de React.
- Utilizar PostgreSQL como base de datos.
- Separar frontend y backend.
- Adoptar una arquitectura de monolito modular.
- Utilizar REST en lugar de GraphQL.
- Cambiar la estructura general del repositorio.

---

## Ejemplo sencillo de ADR

```md
# ADR-003: Utilizar PostgreSQL como base de datos

Status: Pendiente

## Contexto

El sistema necesita almacenar usuarios, membresías, pagos,
actividades y registros de asistencia.

Actualmente se consideran PostgreSQL y MongoDB.

## Decisión

Utilizar PostgreSQL como base de datos principal.

## Alternativas

### PostgreSQL

Ventajas:

- Modelo relacional adecuado para los datos.
- Buen soporte de transacciones.
- Integridad referencial.
- Amplio soporte en frameworks.

Desventajas:

- Requiere definir previamente parte del esquema.

### MongoDB

Ventajas:

- Esquema flexible.
- Fácil almacenamiento de documentos.

Desventajas:

- Algunas relaciones del sistema serían más difíciles de modelar.
- Menor beneficio para los datos altamente relacionados del proyecto.

## Consecuencias

El backend deberá utilizar un ORM o cliente compatible con PostgreSQL.

También será necesario configurar PostgreSQL en los entornos
de desarrollo y producción.
```

---

# 2. Estados de un ADR

Un ADR puede utilizar estados como:

```text
Pendiente
Aceptado
Rechazado
Reemplazado
Obsoleto
```

Por ejemplo:

```md
Status: Pendiente
```

significa que la decisión todavía está siendo discutida.

Después de llegar a un acuerdo puede cambiarse a:

```md
Status: Aceptado
```

Si posteriormente otro ADR cambia esa decisión:

```md
Status: Reemplazado por ADR-008
```

---

# 3. RFC — Request for Comments

Un **RFC** sirve para presentar una propuesta y solicitar comentarios del equipo antes de implementarla.

Su pregunta principal es:

> ¿Qué proponemos hacer y qué piensa el equipo sobre ello?

Normalmente un RFC contiene más detalles sobre **cómo se realizará un cambio**.

Mientras que el ADR registra principalmente la decisión, el RFC es el espacio donde se desarrolla y discute una propuesta.

---

## Ejemplo sencillo de RFC

```md
# RFC-004: Separación del frontend y backend

Status: En discusión

## Resumen

Se propone separar el frontend y backend del proyecto
en aplicaciones independientes dentro del mismo repositorio.

## Motivación

Actualmente el proyecto no tiene una separación clara entre
la interfaz y la lógica del servidor.

Separarlos permitiría desarrollar, probar y desplegar ambas
partes de manera independiente.

## Propuesta

La estructura del repositorio sería:

project/
├── frontend/
├── backend/
├── docs/
└── README.md

El frontend se comunicaría con el backend mediante una API REST.

## Cambios necesarios

- Crear el directorio `frontend/`.
- Crear el directorio `backend/`.
- Definir los endpoints iniciales de la API.
- Configurar variables de entorno.
- Actualizar la documentación.

## Alternativas

### Mantener una sola aplicación

Simplifica inicialmente el desarrollo, pero aumenta el
acoplamiento entre interfaz y backend.

### Repositorios separados

Permite una independencia mayor, pero agrega complejidad
innecesaria para el tamaño actual del proyecto.

## Preguntas abiertas

- ¿Qué framework debe utilizarse para el frontend?
- ¿Qué framework debe utilizarse para el backend?
- ¿Cómo se manejará la autenticación?
- ¿Cómo se ejecutarán ambos proyectos localmente?
```

---

# 4. Diferencia rápida entre ADR y RFC

| ADR | RFC |
|---|---|
| Architecture Decision Record | Request for Comments |
| Registra una decisión | Propone un cambio |
| Explica por qué se tomó | Explica qué se quiere hacer |
| Puede contener alternativas | Puede contener alternativas |
| Permanece como historial | Sirve principalmente para discusión |
| Termina normalmente como aceptado o rechazado | Puede terminar aceptado, rechazado o convertido en implementación |

Una forma sencilla de recordarlo es:

```text
RFC = ¿Hacemos esto?
ADR = Decidimos hacer esto por estas razones.
```

---

# 5. Flujo recomendado dentro del repositorio

Un flujo sencillo puede ser:

```text
Problema
   ↓
RFC
   ↓
Discusión
   ↓
Decisión
   ↓
ADR
   ↓
Implementación
```

Por ejemplo:

```text
Necesitamos elegir backend
        ↓
RFC-005
Comparación Spring / FastAPI / Rust
        ↓
Comentarios del equipo
        ↓
Se decide utilizar Spring Boot
        ↓
ADR-006
Usar Spring Boot como backend
        ↓
Implementación
```

No todos los cambios necesitan obligatoriamente ambos documentos.

Para decisiones pequeñas puede bastar un ADR.

Para decisiones grandes o polémicas es recomendable discutir primero mediante un RFC.

---

# 6. ¿Dónde guardar los documentos?

Una estructura sencilla puede ser:

```text
docs/
├── adr/
│   ├── ADR-001-arquitectura-inicial.md
│   ├── ADR-002-base-de-datos.md
│   └── ADR-003-backend.md
│
└── rfc/
    ├── RFC-001-separar-frontend-backend.md
    └── RFC-002-autenticacion.md
```

También puede utilizarse:

```text
docs/
├── decisions/
└── proposals/
```

pero utilizar `adr/` y `rfc/` hace más evidente el propósito de cada documento.

---

# 7. ¿Cómo proponer un ADR o RFC?

Una persona del equipo crea el documento en una rama.

Por ejemplo:

```bash
git checkout -b docs/rfc-backend
```

Después agrega:

```text
docs/rfc/RFC-003-backend.md
```

y crea un Pull Request.

Ejemplo de título:

```text
RFC-003: Selección del stack de backend
```

El Pull Request será el lugar principal donde el equipo podrá revisar y discutir la propuesta.

---

# 8. Cómo utilizar los comentarios de GitHub

GitHub permite comentar directamente sobre una línea del documento.

Por ejemplo, si el RFC contiene:

```md
Se propone utilizar FastAPI como backend.
```

un integrante puede seleccionar esa línea y escribir:

> ¿Qué ventajas tendría frente a Spring Boot considerando que el equipo ya utiliza Java?

El autor puede responder:

> Principalmente menor tiempo de desarrollo inicial. Voy a agregar una comparación de ambos frameworks al RFC.

Después puede modificar el documento.

De esta manera la discusión queda registrada junto con el cambio.

---

# 9. Tipos de comentarios útiles

Los comentarios deberían intentar aportar información concreta.

### Pregunta

```text
¿Esta decisión considera cómo se realizará el despliegue?
```

### Solicitud de cambio

```text
Creo que deberíamos incluir PostgreSQL entre las alternativas.
```

### Argumento técnico

```text
Spring Boot tiene mayor costo inicial de configuración,
pero el equipo ya tiene experiencia con Java y Maven.
```

### Identificación de un problema

```text
Esta arquitectura obligaría al frontend a conocer directamente
la estructura de la base de datos.
```

### Aprobación

```text
Estoy de acuerdo con esta propuesta. No tengo cambios adicionales.
```

---

# 10. Evitar comentarios poco útiles

En lugar de:

```text
No me gusta.
```

es preferible:

```text
No estoy de acuerdo con esta opción porque aumentaría el
acoplamiento entre frontend y backend.
```

En lugar de:

```text
Spring es mejor.
```

es preferible:

```text
Consideraría Spring Boot porque actualmente varios integrantes
del equipo conocen Java y permitiría aprovechar esa experiencia.
```

La intención no es solamente decir si algo gusta o no, sino dejar registrado **el razonamiento técnico**.

---

# 11. Conversaciones resueltas

Cuando un comentario haya sido atendido puede marcarse como:

```text
Resolve conversation
```

Por ejemplo:

1. Alguien comenta que falta PostgreSQL en las alternativas.
2. El autor actualiza el RFC.
3. Responde indicando que fue agregado.
4. La conversación se marca como resuelta.

Esto permite distinguir fácilmente qué puntos siguen pendientes.

---

# 12. Cambios durante la discusión

Un RFC no tiene que estar perfecto desde el inicio.

Puede comenzar como:

```md
Status: Borrador
```

y modificarse según los comentarios.

Por ejemplo:

```text
Commit 1
RFC inicial

Commit 2
Agregar comparación PostgreSQL/MongoDB

Commit 3
Agregar estrategia de autenticación

Commit 4
Cambiar propuesta según comentarios
```

GitHub conservará el historial completo de esos cambios.

---

# 13. Cómo cerrar un RFC

Cuando la discusión termina pueden ocurrir tres escenarios.

### Aceptado

```md
Status: Aceptado
```

La propuesta continuará hacia implementación.

### Rechazado

```md
Status: Rechazado
```

Es recomendable registrar brevemente por qué:

```md
## Resultado

La propuesta fue rechazada porque aumentaría considerablemente
la complejidad del despliegue sin aportar beneficios suficientes
para el tamaño actual del proyecto.
```

### Requiere otra propuesta

En ocasiones la discusión muestra que se necesita un RFC nuevo.

Por ejemplo:

```text
RFC-004: Arquitectura general
```

puede generar posteriormente:

```text
RFC-005: Selección de backend
RFC-006: Autenticación
RFC-007: Estrategia de despliegue
```

---

# 14. Cómo cerrar un ADR

Una vez tomada la decisión puede cambiarse:

```md
Status: Pendiente
```

por:

```md
Status: Aceptado
```

El Pull Request puede entonces aprobarse y fusionarse con la rama principal.

Desde ese momento el ADR se convierte en parte del historial técnico del proyecto.

---

# 15. ADR y RFC no deben borrarse

Una de sus funciones principales es conservar el historial.

Supongamos que inicialmente existe:

```text
ADR-003: Utilizar Vue
```

y seis meses después el equipo cambia a React.

No debería eliminarse el ADR anterior.

Puede actualizarse como:

```md
Status: Reemplazado por ADR-011
```

y crear:

```text
ADR-011: Migrar frontend de Vue a React
```

Esto permite reconstruir la evolución del proyecto:

```text
ADR-003
Vue

↓

ADR-011
React
```

---

# 16. Ejemplo completo de interacción

Un integrante crea:

```text
RFC-008: Utilizar FastAPI para el backend
```

y abre un Pull Request.

### Persona A

> ¿Por qué FastAPI en lugar de Spring Boot?

### Autor

> Principalmente por simplicidad inicial. Agregaré una comparación entre ambos.

Se actualiza el RFC.

### Persona B

> Considerando que la mayoría trabaja con Java, creo que deberíamos analizar también el costo de aprendizaje.

### Autor

> Agregado en la sección de consecuencias.

### Persona C

> Con los cambios actuales estoy de acuerdo.

Cuando ya no existen discusiones pendientes:

```text
Status: Aceptado
```

Posteriormente puede crearse:

```text
ADR-009: Utilizar FastAPI como framework de backend
```

donde se registra formalmente la decisión.

---

# 17. Regla práctica para el equipo

Antes de crear un documento puede utilizarse esta regla:

```text
¿Estamos proponiendo algo y queremos opiniones?
→ RFC

¿Estamos registrando una decisión?
→ ADR
```

Y para cambios pequeños:

```text
¿El cambio es trivial y fácilmente reversible?
→ probablemente no necesita ADR ni RFC.
```

Ejemplos de cambios que normalmente **no necesitan ADR/RFC**:

```text
Corregir un typo
Renombrar una variable
Cambiar formato de código
Agregar una prueba pequeña
Actualizar documentación menor
```

Ejemplos que probablemente **sí deberían discutirse**:

```text
Cambiar el framework del backend
Cambiar la base de datos
Modificar la arquitectura
Introducir microservicios
Cambiar autenticación
Cambiar estrategia de despliegue
Modificar la estructura principal del repositorio
```

---

# Resumen

El objetivo de ADR y RFC no es generar documentación por generar documentación.

Su función es que las decisiones importantes del proyecto sean:

- visibles;
- discutibles;
- justificadas;
- rastreables;
- comprensibles para futuros integrantes.

El flujo general puede resumirse como:

```text
RFC
"Propongo esto"

↓

Comentarios
"Discutamos ventajas, problemas y alternativas"

↓

ADR
"Decidimos esto por estas razones"

↓

Código
"Implementamos la decisión"
```

GitHub complementa este proceso mediante **Pull Requests, comentarios por línea, revisiones, commits y conversaciones resueltas**, dejando tanto la decisión como su discusión vinculadas al historial del repositorio.
