# SIGAC
## Objetivos
### 1. Objetivo general
Desarrollar un sistema de software que centralice y digitalice la gestión de las
actividades y servicios organizados por el gimnasio o club deportivo, permitiendo
administrar desde una misma plataforma la información de los usuarios, inscripciones,
actividades, pagos, comunicación y seguimiento, con el propósito de sustituir procesos
manuales y dispersos por un flujo de trabajo organizado, accesible y eficiente.

### 2. Objetivos especificos
1. Concentrar en un solo sitio la información de las actividades organizadas por el
club: fechas, horarios, lugares, cupos, responsables y los demás datos relevantes
para su organización.
2. Digitalizar el proceso de inscripción y registro de participantes, dejando atrás el
uso de listas físicas y evitando así la duplicidad o pérdida de información.
3. Permitir que los usuarios consulten, desde una misma plataforma, las actividades
disponibles, su información, disponibilidad y el estado de su inscripción.
4. Dotar al personal de una herramienta para el control de participantes por
actividad, con la posibilidad de consultar inscritos, disponibilidad de lugares y
asistencia.
5. Centralizar la comunicación relacionada con las actividades, reduciendo la
dependencia de grupos de WhatsApp u otros medios externos para la difusión de
avisos y actualizaciones.
6. Registrar y consultar la información correspondiente a pagos o cuotas de las
actividades que así lo requieran.
7. Mantener un historial de actividades y de participación de los usuarios, de
manera que puedan consultarse actividades anteriores y sus registros asociados.

8. Facilitar al personal administrativo la gestión de las actividades a través de una
plataforma única, disminuyendo el uso de documentos físicos, hojas de cálculo y
aplicaciones independientes.

## Usuarios del sistema

### 1. Recepcionista
Puede ver a todos los socios, darlos de alta y baja en actividades, ayudarlos a gestionar sus membresias.

### 2. Instructor
El instructor leera los codigos QR de los socios inscritos al gimnasio para poder pasar lista de asistencia

### 3. Socio
Es quien participa en las actividades. Debe ser capaz de ver su informacion completa y mostrar su codigo QR a los instructores necesarios

## Requisitos

### Requisitos funcionales
| ID | Requisito | Prior. | Criterio de verificación |
|---|---|---|---|
| **RF-01** | El sistema debe permitir iniciar sesión con correo electrónico y contraseña | Alta | Credenciales válidas conceden acceso; las inválidas muestran un error |
| **RF-02** | El sistema debe restringir las funciones disponibles según el rol del usuario | Alta | Un socio no puede acceder a la gestión de socios |
| **RF-03** | El sistema debe permitir registrar, editar, consultar y desactivar socios | Alta | Operaciones completas verificadas en pruebas |
| **RF-04** | El sistema debe generar automáticamente un código QR único al dar de alta un socio | Alta | Cada socio obtiene un QR distinto y no reutilizable |
| **RF-05** | El sistema debe permitir descargar o imprimir el código QR del socio | Media | El QR se descarga como imagen o PDF |
| **RF-06** | El sistema debe permitir registrar, editar y consultar instructores | Alta | Operaciones completas verificadas en pruebas |
| **RF-07** | El sistema debe permitir registrar actividades con nombre, instructor, descripción y cupo máximo | Alta | La actividad creada aparece en el catálogo |
| **RF-08** | El sistema debe permitir definir uno o más horarios por actividad | Alta | La actividad muestra su calendario semanal |
| **RF-09** | El sistema debe permitir inscribir socios a una actividad | Alta | El socio inscrito aparece en la lista de la clase |
| **RF-10** | El sistema debe impedir inscripciones que superen el cupo máximo | Alta | Al alcanzar el cupo se muestra el mensaje de clase llena |
| **RF-11** | El instructor debe poder abrir la sesión de asistencia de su clase del día | Alta | Se lista la sesión vigente con sus inscritos |
| **RF-12** | El sistema debe registrar la asistencia al escanear el QR con la cámara del dispositivo | Alta | El escaneo genera un registro de asistencia |
| **RF-13** | El registro debe almacenar socio, actividad, fecha y hora de forma automática | Alta | El registro contiene los cuatro datos sin captura manual |
| **RF-14** | El sistema debe validar que el socio esté inscrito y que exista una sesión vigente | Alta | Un QR de socio no inscrito produce una advertencia |
| **RF-15** | El sistema debe impedir el registro duplicado en una misma sesión | Alta | Un segundo escaneo indica que ya está registrado |
| **RF-16** | El sistema debe permitir el registro manual de asistencia como respaldo | Media | El instructor marca la asistencia desde la lista |
| **RF-17** | El sistema debe permitir consultar el historial de asistencia por socio | Media | El perfil del socio muestra sus asistencias |
| **RF-18** | El sistema debe permitir consultar el historial por actividad y fecha | Media | Reporte de sesión visible o descargable |
| **RF-19** | El sistema debe permitir registrar membresías con vigencia y estatus | Alta | Una membresía vencida cambia de estatus automáticamente |
| **RF-20** | El sistema debe registrar pagos y mostrar los pendientes por socio | Media | Listado de adeudos generado por el sistema |
| **RF-21** | El dashboard debe mostrar el total de socios, los activos y los nuevos del mes | Media | Los indicadores coinciden con los datos de la base |
| **RF-22** | El dashboard debe mostrar membresías activas, por vencer y vencidas | Media | Conteos correctos por estatus |
| **RF-23** | El dashboard debe mostrar ocupación y asistencia por actividad | Media | Gráfica de ocupación por clase |
| **RF-24** | El socio debe poder visualizar su propio código QR desde su sesión | Media | El QR es visible en la pantalla del socio |
| **RF-25** | El sistema debe registrar en bitácora las altas, bajas y modificaciones de socios | Baja | Bitácora consultable por el administrador |

### Requisitos no funcionales
| ID | Categoría | Requisito | Criterio de verificación |
|---|---|---|---|
| **RNF-01** | Rendimiento | El registro de asistencia por escaneo debe completarse en menos de 3 segundos. | Medición cronometrada en 20 escaneos. |
| **RNF-02** | Rendimiento | Las pantallas principales deben cargarse en menos de 3 segundos. | Medición con Lighthouse. |
| **RNF-03** | Usabilidad | Un instructor sin capacitación previa debe poder pasar lista tras una demostración de 5 minutos. | Prueba con usuario real. |
| **RNF-04** | Usabilidad | La interfaz debe ser responsiva desde 360 px de ancho. | Prueba en celular, tablet y escritorio. |
| **RNF-05** | Seguridad | Las contraseñas deben almacenarse cifradas con un algoritmo de hash seguro. | Revisión de la base de datos. |
| **RNF-06** | Seguridad | El acceso a cada módulo debe validarse en el servidor, no solo en la interfaz. | Pruebas de acceso directo a rutas protegidas. |
| **RNF-07** | Seguridad | El contenido del QR no debe exponer datos personales, sólo un identificador opaco. | Inspección del contenido del código. |
| **RNF-08** | Seguridad | Toda la comunicación debe realizarse sobre HTTPS. | Verificación del certificado |
| **RNF-09** | Privacidad | Los datos personales serán de uso exclusivo del club (Aviso de privacidad). | Aviso de privacidad incluido en el sistema. |
| **RNF-10** | Disponibilidad | El sistema debe estar disponible al menos el 95% del horario de operación. | Monitoreo durante el piloto. |
| **RNF-11** | Compatibilidad | Debe funcionar en las versiones vigentes de Chrome, Edge y Safari. | Matriz de pruebas por navegador. |
| **RNF-12** | Mantenibilidad | El código debe seguir una estructura modular por dominio y convenciones del equipo. | Revisión por pares en cada Pull Request. |
| **RNF-13** | Escalabilidad | El modelo de datos debe permitir agregar nuevos tipos de club sin rediseñarse. | Revisión del modelo entidad-relación. |
| **RNF-14** | Integridad | La base debe garantizar la unicidad del QR y de la asistencia por socio y sesión. | Restricciones únicas en el esquema. |
| **RNF-15** | Portabilidad | El sistema debe operar desde el navegador, sin instalación. | Prueba de acceso por URL. |
| **RNF-16** | Trazabilidad | Todo registro de asistencia debe conservar su marca de tiempo original e inmutable. | Un intento de edición es rechazado. |
