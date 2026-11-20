
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import HorarioSemanal, { obtenerInicioSemana } from "../components/HorarioSemanal.jsx";
import { menus } from "../components/menus.js";
import { obtenerMisInscripciones } from "../services/socio.js";
import "../assets/MiHorario.css";

const { nombre: rol, opciones } = menus.socio;

function interpretarFecha(fecha) {
  if (!fecha) return null;

  // Convierte el formato de PostgreSQL a ISO y conserva su zona horaria.
  let formatoISO = fecha.replace(" ", "T");

  // Normaliza offsets como +00 a +00:00.
  formatoISO = formatoISO.replace(/([+-]\d{2})$/, "$1:00");

  const resultado = new Date(formatoISO);

  return Number.isNaN(resultado.getTime()) ? null : resultado;
}

export default function MiHorario() {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [semana, setSemana] = useState(() =>
    obtenerInicioSemana(new Date())
  );

  useEffect(() => {
    async function cargarHorario() {
      try {
        const datos = await obtenerMisInscripciones();
        setInscripciones(datos);
      } catch (err) {
        setError(err.message || "No fue posible cargar tu horario.");
      } finally {
        setCargando(false);
      }
    }

    cargarHorario();
  }, []);

  // Inscripciones como eventos de la cuadrícula semanal
  const eventos = useMemo(
    () =>
      inscripciones.map((inscripcion) => ({
        id: inscripcion.id,
        titulo: inscripcion.actividad,
        inicio: interpretarFecha(inscripcion.inicio),
        fin: interpretarFecha(inscripcion.fin),
        detalles: [
          inscripcion.coach || "Instructor no disponible",
          ...(inscripcion.lugar ? [inscripcion.lugar] : []),
        ],
      })),
    [inscripciones]
  );

  return (
    <DashboardLayout
      titulo="Mi horario"
      rol={rol}
      opciones={opciones}
    >
      <section className="mi-horario">
        <header className="mi-horario-encabezado">
          <span className="mi-horario-etiqueta">ESPACIO PERSONAL</span>
          <p>
            Consulta los días y horarios de las sesiones en las que
            estás inscrito.
          </p>
        </header>

        <HorarioSemanal
          semana={semana}
          onCambiarSemana={setSemana}
          eventos={eventos}
          cargando={cargando}
          error={error}
          textoCargando="Cargando tu horario..."
          textoError="No fue posible cargar tu horario"
          textoVacio="No tienes sesiones esta semana"
          detalleVacio="Prueba consultando otra semana para encontrar tus próximas actividades."
        />
      </section>
    </DashboardLayout>
  );
}
