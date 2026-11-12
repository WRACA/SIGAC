import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerPerfil } from "../services/socio.js";
import { formatearFecha, nombreCompleto } from "../utils/formato.js";
import "../assets/SociosInscritos.css";

const { nombre: rol, opciones } = menus.socio;

export default function PerfilSocio() {
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerPerfil()
      .then((datos) => activo && setPerfil(datos))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <DashboardLayout titulo="Mi perfil" rol={rol} opciones={opciones}>
      <section className="socios-inscritos">
        <div className="socios-inscritos-encabezado">
          <span className="socios-inscritos-etiqueta">MI CUENTA</span>
          <h2>Mi perfil de socio</h2>
          <p>Consulta tus datos registrados en el club.</p>
        </div>

        {error && <p className="dashboard-error">{error}</p>}
        {!error && !perfil && <p className="dashboard-cargando">Cargando perfil...</p>}

        {perfil && (
          <>
            <div className="dashboard-tarjetas" style={{ marginTop: 0 }}>
              <div className="dashboard-tarjeta">
                <h3>Número de socio</h3>
                <p>{perfil.numero_socio}</p>
              </div>
              {/* Espacio reservado para el código QR del socio (siguiente etapa) */}
            </div>

            <div className="socios-inscritos-panel">
              <h3>Datos personales</h3>
              <dl className="dashboard-datos">
                <div>
                  <dt>Nombre completo</dt>
                  <dd>{nombreCompleto(perfil)}</dd>
                </div>
                <div>
                  <dt>Correo electrónico</dt>
                  <dd>{perfil.correo}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{perfil.telefono || "No registrado"}</dd>
                </div>
                <div>
                  <dt>Fecha de nacimiento</dt>
                  <dd>
                    {perfil.fecha_nacimiento
                      ? formatearFecha(perfil.fecha_nacimiento)
                      : "No registrada"}
                  </dd>
                </div>
                <div>
                  <dt>Socio desde</dt>
                  <dd>{formatearFecha(perfil.fecha_alta)}</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
