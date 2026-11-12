import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { obtenerSesiones } from "../services/inscripciones.js";
import { parsearFechaPg } from "../utils/formato.js";

const { nombre: rol, opciones } = menus.recepcionista;

function calcularEstadisticas(sesiones) {
  const hoy = new Date().toDateString();

  return [
    { titulo: "Sesiones con cupo", valor: sesiones.length },
    {
      titulo: "Sesiones de hoy",
      valor: sesiones.filter((s) => parsearFechaPg(s.inicio).toDateString() === hoy).length,
    },
    {
      titulo: "Actividades con sesiones",
      valor: new Set(sesiones.map((s) => s.actividad)).size,
    },
    {
      titulo: "Lugares disponibles",
      valor: sesiones.reduce((total, s) => total + Number(s.cupos_disponibles), 0),
    },
  ];
}

export default function Recepcionista() {
  const [sesiones, setSesiones] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerSesiones()
      .then((datos) => activo && setSesiones(Array.isArray(datos) ? datos : []))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <DashboardLayout titulo="Panel de Recepción" rol={rol} opciones={opciones}>
      <h2>Bienvenido al panel de recepción</h2>

      <p>
        Desde aquí podrás consultar la información de los socios,
        las inscripciones y las actividades deportivas del club.
      </p>

      {error && <p className="dashboard-error">{error}</p>}

      {!error && !sesiones && <p className="dashboard-cargando">Cargando información...</p>}

      {sesiones && (
        <div className="dashboard-tarjetas">
          {calcularEstadisticas(sesiones).map((estadistica) => (
            <div key={estadistica.titulo} className="dashboard-tarjeta">
              <h3>{estadistica.titulo}</h3>
              <p>{estadistica.valor}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
