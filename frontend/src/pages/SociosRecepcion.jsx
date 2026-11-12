import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { buscarSocios, registrarSocio } from "../services/inscripciones.js";
import { nombreCompleto } from "../utils/formato.js";
import "../assets/SociosInscritos.css";

const altaInicial = { nombre: "", apellido_p: "", correo: "", password: "" };

export default function SociosRecepcion() {
  const { nombre: rol, opciones } = menus.recepcionista;

  // Búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [socios, setSocios] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const ultimaBusqueda = useRef(0);

  // Alta de socio
  const [alta, setAlta] = useState(altaInicial);
  const [guardando, setGuardando] = useState(false);
  const [mensajeAlta, setMensajeAlta] = useState("");
  const [errorAlta, setErrorAlta] = useState("");

  // Búsqueda con debounce de 300 ms; descarta respuestas viejas
  useEffect(() => {
    const texto = busqueda.trim();
    const id = ++ultimaBusqueda.current;

    if (!texto) {
      setSocios([]);
      setErrorBusqueda("");
      setBuscando(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const datos = await buscarSocios(texto);
        if (id !== ultimaBusqueda.current) return;
        setSocios(Array.isArray(datos) ? datos : []);
        setErrorBusqueda("");
      } catch (err) {
        if (id !== ultimaBusqueda.current) return;
        setSocios([]);
        setErrorBusqueda(err.message);
      } finally {
        if (id === ultimaBusqueda.current) setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const cambiarAlta = (e) => {
    setAlta((actual) => ({ ...actual, [e.target.name]: e.target.value }));
  };

  const darDeAlta = async (e) => {
    e.preventDefault();
    setMensajeAlta("");
    setErrorAlta("");

    if (alta.password.length < 8 || alta.password.length > 72) {
      setErrorAlta("La contraseña debe tener entre 8 y 72 caracteres.");
      return;
    }

    setGuardando(true);
    try {
      const usuario = await registrarSocio({
        nombre: alta.nombre.trim(),
        apellido_p: alta.apellido_p.trim(),
        correo: alta.correo.trim(),
        password: alta.password,
      });
      setMensajeAlta(`Socio ${usuario.nombre} (${usuario.correo}) dado de alta correctamente.`);
      setAlta(altaInicial);
      // Mostrar al nuevo socio en la búsqueda
      setBusqueda(`${alta.nombre.trim()} ${alta.apellido_p.trim()}`);
    } catch (err) {
      setErrorAlta(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <DashboardLayout titulo="Socios" rol={rol} opciones={opciones}>
      <section className="socios-inscritos">
        <div className="socios-inscritos-encabezado">
          <span className="socios-inscritos-etiqueta">RECEPCIÓN</span>
          <h2>Gestión de socios</h2>
          <p>Busca socios por nombre o número de socio y da de alta nuevos socios.</p>
        </div>

        {/* BÚSQUEDA */}
        <div className="socios-inscritos-panel">
          <h3>Buscar socio</h3>
          <label htmlFor="buscar-socio">Nombre o número de socio</label>
          <input
            id="buscar-socio"
            type="search"
            className="dashboard-input"
            placeholder="Ej. María López o 1024"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            maxLength={100}
          />

          {errorBusqueda && <p className="dashboard-error">{errorBusqueda}</p>}

          {busqueda.trim() && !errorBusqueda && (
            <div className="socios-inscritos-tabla-contenedor" style={{ marginTop: 20 }}>
              {buscando ? (
                <p className="dashboard-cargando">Buscando...</p>
              ) : socios.length > 0 ? (
                <table className="socios-inscritos-tabla">
                  <thead>
                    <tr>
                      <th>No. socio</th>
                      <th>Nombre</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socios.map((socio) => (
                      <tr key={socio.id}>
                        <td>{socio.numero_socio}</td>
                        <td>{nombreCompleto(socio)}</td>
                        <td>
                          <Link
                            to={`/recepcion/inscripciones?q=${encodeURIComponent(socio.numero_socio)}`}
                            className="dashboard-enlace-boton"
                          >
                            Inscribir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="socios-inscritos-vacio">No se encontraron socios.</p>
              )}
            </div>
          )}
        </div>

        {/* ALTA */}
        <div className="socios-inscritos-panel">
          <h3>Dar de alta socio</h3>
          <form onSubmit={darDeAlta} className="dashboard-datos">
            <div>
              <label htmlFor="alta-nombre">Nombre</label>
              <input
                id="alta-nombre"
                name="nombre"
                className="dashboard-input"
                required
                maxLength={100}
                value={alta.nombre}
                onChange={cambiarAlta}
                disabled={guardando}
              />
            </div>
            <div>
              <label htmlFor="alta-apellido">Apellido paterno</label>
              <input
                id="alta-apellido"
                name="apellido_p"
                className="dashboard-input"
                required
                maxLength={100}
                value={alta.apellido_p}
                onChange={cambiarAlta}
                disabled={guardando}
              />
            </div>
            <div>
              <label htmlFor="alta-correo">Correo electrónico</label>
              <input
                id="alta-correo"
                name="correo"
                type="email"
                className="dashboard-input"
                required
                value={alta.correo}
                onChange={cambiarAlta}
                disabled={guardando}
              />
            </div>
            <div>
              <label htmlFor="alta-password">Contraseña inicial</label>
              <input
                id="alta-password"
                name="password"
                type="password"
                className="dashboard-input"
                placeholder="Mínimo 8 caracteres"
                required
                value={alta.password}
                onChange={cambiarAlta}
                disabled={guardando}
              />
            </div>
            <div>
              <button type="submit" className="dashboard-enlace-boton" disabled={guardando}>
                {guardando ? "Guardando..." : "Dar de alta"}
              </button>
            </div>
          </form>

          {mensajeAlta && <p className="dashboard-exito">{mensajeAlta}</p>}
          {errorAlta && <p className="dashboard-error">{errorAlta}</p>}
        </div>
      </section>
    </DashboardLayout>
  );
}
