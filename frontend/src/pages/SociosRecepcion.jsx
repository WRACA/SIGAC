import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { menus } from "../components/menus.js";
import { buscarSocios, registrarSocio, obtenerPlanes,} from "../services/inscripciones.js";
import { nombreCompleto } from "../utils/formato.js";
import "../assets/SociosInscritos.css";

const altaInicial = {
  nombre: "",
  apellido_p: "",
  correo: "",
  password: "",
  plan_id: "",
  periodicidad: "mensual",
  metodo_pago: "efectivo",
  confirmar_pago: false,
};

export default function SociosRecepcion() {
  const { nombre: rol, opciones } = menus.recepcionista;

  // Búsqueda de socios
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

  // Planes y precios
  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [errorPlanes, setErrorPlanes] = useState("");

  // Cargar planes y precios desde el backend
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        const datos = await obtenerPlanes();
        const lista = Array.isArray(datos) ? datos : [];

        setPlanes(lista);

        if (lista.length > 0) {
          setAlta((actual) => ({
            ...actual,
            plan_id: String(lista[0].id),
          }));
        } else {
          setErrorPlanes("No hay planes disponibles para seleccionar.");
        }
      } catch (err) {
        setErrorPlanes(err.message || "No se pudieron cargar los planes.");
      } finally {
        setCargandoPlanes(false);
      }
    };

    cargarPlanes();
  }, []);

  // Plan seleccionado y sus precios disponibles
  const planesDisponibles = planes.filter(
    (plan) => plan.id === Number(alta.plan_id)
  );

  const precioSeleccionado = planesDisponibles.find(
    (plan) => plan.periodicidad === alta.periodicidad
  )?.precio;

  const periodicidadesDisponibles = [
    ...new Set(planesDisponibles.map((plan) => plan.periodicidad)),
  ];

  // Búsqueda con debounce de 300 ms
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
        setErrorBusqueda(err.message || "Error al buscar socios.");
      } finally {
        if (id === ultimaBusqueda.current) {
          setBuscando(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Actualizar campos del formulario
  const cambiarAlta = (e) => {
    const { name, value, type, checked } = e.target;

    setAlta((actual) => ({
      ...actual,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Registrar socio, membresía y pago
  const darDeAlta = async (e) => {
    e.preventDefault();

    setMensajeAlta("");
    setErrorAlta("");

    if (cargandoPlanes || planes.length === 0) {
      setErrorAlta("No hay planes disponibles para registrar al socio.");
      return;
    }

    if (!alta.plan_id || precioSeleccionado === undefined) {
      setErrorAlta("Selecciona un plan y una periodicidad disponibles.");
      return;
    }

    if (!alta.confirmar_pago) {
      setErrorAlta("Debes confirmar que recibiste el pago.");
      return;
    }

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
        plan_id: Number(alta.plan_id),
        periodicidad: alta.periodicidad,
        metodo_pago: alta.metodo_pago,
        confirmar_pago: alta.confirmar_pago,
      });

      setMensajeAlta(
        `Socio ${usuario.nombre} (${usuario.correo}) dado de alta correctamente.`
      );

      // Limpiar los datos personales y conservar una selección válida
      setAlta({
        ...altaInicial,
        plan_id: String(planes[0].id),
      });

      // Mostrar al nuevo socio en la búsqueda
      setBusqueda(
        `${alta.nombre.trim()} ${alta.apellido_p.trim()}`
      );
    } catch (err) {
      setErrorAlta(err.message || "No se pudo dar de alta al socio.");
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
          <p>
            Busca socios por nombre o número de socio y da de alta nuevos socios.
          </p>
        </div>

        {/* BÚSQUEDA */}
        <div className="socios-inscritos-panel">
          <h3>Buscar socio</h3>

          <label htmlFor="buscar-socio">
            Nombre o número de socio
          </label>

          <input
            id="buscar-socio"
            type="search"
            className="dashboard-input"
            placeholder="Ej. María López o 1024"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            maxLength={100}
          />

          {errorBusqueda && (
            <p className="dashboard-error">{errorBusqueda}</p>
          )}

          {busqueda.trim() && !errorBusqueda && (
            <div
              className="socios-inscritos-tabla-contenedor"
              style={{ marginTop: 20 }}
            >
              {buscando ? (
                <p className="dashboard-cargando">Buscando...</p>
              ) : socios.length > 0 ? (
                <table className="socios-inscritos-tabla">
                  <thead>
                    <tr>
                      <th>No. socio</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {socios.map((socio) => (
                      <tr key={socio.id}>
                        <td>{socio.numero_socio}</td>
                        <td>{nombreCompleto(socio)}</td>
                        <td>{socio.correo}</td>
                        <td>
                          <span
                            className={
                              socio.activo
                                ? "estado-activo"
                                : "estado-inactivo"
                            }
                          >
                            {socio.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          {socio.activo ? (
                            <Link
                              to={`/recepcion/inscripciones?q=${encodeURIComponent(
                                socio.numero_socio
                              )}`}
                              className="dashboard-enlace-boton"
                            >
                              Inscribir
                            </Link>
                          ) : (
                            <span>No disponible</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="socios-inscritos-vacio">
                  No se encontraron socios.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ALTA DE SOCIO */}
        <div className="socios-inscritos-panel">
          <h3>Dar de alta socio</h3>

          <form onSubmit={darDeAlta} className="dashboard-datos">
            {/* Datos personales */}
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
              <label htmlFor="alta-apellido">
                Apellido paterno
              </label>
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
              <label htmlFor="alta-correo">
                Correo electrónico
              </label>
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
              <label htmlFor="alta-password">
                Contraseña inicial
              </label>
              <input
                id="alta-password"
                name="password"
                type="password"
                className="dashboard-input"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                maxLength={72}
                required
                value={alta.password}
                onChange={cambiarAlta}
                disabled={guardando}
              />
            </div>

            {/* Membresía */}
            <div>
              <label htmlFor="alta-plan">
                Plan de membresía
              </label>

              <select
                id="alta-plan"
                name="plan_id"
                className="dashboard-input"
                value={alta.plan_id}
                onChange={cambiarAlta}
                disabled={guardando || cargandoPlanes || planes.length === 0}
                required
              >
                <option value="">Selecciona un plan</option>

                {[
                  ...new Map(
                    planes.map((plan) => [plan.id, plan])
                  ).values(),
                ].map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="alta-periodicidad">
                Periodicidad
              </label>

              <select
                id="alta-periodicidad"
                name="periodicidad"
                className="dashboard-input"
                value={alta.periodicidad}
                onChange={cambiarAlta}
                disabled={
                  guardando ||
                  cargandoPlanes ||
                  periodicidadesDisponibles.length === 0
                }
                required
              >
                {periodicidadesDisponibles.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio automático */}
            <div>
              <label>Precio de la membresía</label>

              <p>
                {cargandoPlanes
                  ? "Cargando precios..."
                  : precioSeleccionado !== undefined
                    ? Number(precioSeleccionado).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })
                    : "Precio no disponible"}
              </p>
            </div>

            {/* Método de pago */}
            <div>
              <label htmlFor="alta-metodo-pago">
                Método de pago
              </label>

              <select
                id="alta-metodo-pago"
                name="metodo_pago"
                className="dashboard-input"
                value={alta.metodo_pago}
                onChange={cambiarAlta}
                disabled={guardando}
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Confirmación obligatoria */}
            <div>
              <label>
                <input
                  type="checkbox"
                  name="confirmar_pago"
                  checked={alta.confirmar_pago}
                  onChange={cambiarAlta}
                  disabled={guardando}
                  required
                />
                {" "}Confirmo que recibí el pago de la membresía.
              </label>
            </div>

            {errorPlanes && (
              <p className="dashboard-error">{errorPlanes}</p>
            )}

            <div>
              <button
                type="submit"
                className="dashboard-enlace-boton"
                disabled={guardando || cargandoPlanes || planes.length === 0}
              >
                {guardando ? "Guardando..." : "Dar de alta socio"}
              </button>
            </div>
          </form>

          {mensajeAlta && (
            <p className="dashboard-exito">{mensajeAlta}</p>
          )}

          {errorAlta && (
            <p className="dashboard-error">{errorAlta}</p>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}