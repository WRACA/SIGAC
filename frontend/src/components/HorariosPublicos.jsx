import { useEffect, useState } from "react";
import { obtenerActividades, agruparPorActividad } from "../services/actividades.js";
import { formatearHora, nombreDia } from "../utils/formato.js";

// Horarios vigentes de cada actividad (GET /api/actividades, público).
export default function HorariosPublicos() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerActividades()
      .then((datos) => activo && setActividades(agruparPorActividad(Array.isArray(datos) ? datos : [])))
      .catch((err) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="horarios-publicos" id="horarios" aria-labelledby="horarios-titulo">
      <h2 id="horarios-titulo">
        HORARIOS <span>DE CLASES</span>
      </h2>

      {cargando && <p className="horarios-publicos-estado">Cargando horarios...</p>}
      {error && <p className="horarios-publicos-estado error">{error}</p>}
      {!cargando && !error && actividades.length === 0 && (
        <p className="horarios-publicos-estado">Aún no hay horarios publicados.</p>
      )}

      <div className="horarios-publicos-grid">
        {actividades.map((act) => (
          <article key={act.id} className="horarios-publicos-card">
            <h3>{act.actividad}</h3>
            {act.descripcion && <p className="horarios-publicos-desc">{act.descripcion}</p>}
            <ul>
              {act.horarios.map((h) => (
                <li key={`${h.dia_semana}-${h.hora_inicio}-${h.coach}`}>
                  <strong>{nombreDia(h.dia_semana)}</strong>
                  <span>
                    {formatearHora(h.hora_inicio)} – {formatearHora(h.hora_fin)}
                  </span>
                  <span className="horarios-publicos-extra">
                    {h.coach}
                    {h.lugar ? ` · ${h.lugar}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
