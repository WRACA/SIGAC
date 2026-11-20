import { useCallback, useEffect, useRef, useState } from "react";
import { finSemana, hoyISO, inicioSemana } from "../utils/fechas.js";

// Carga las clases disponibles y las sesiones de UNA semana (lunes–domingo).
// Solo se conserva en memoria la semana solicitada; mientras llega una semana
// nueva se siguen mostrando los datos de la anterior para evitar parpadeos.
//
// cargarSesiones({ desde, hasta }) y cargarClases() deben devolver promesas.
// filtrar: función opcional para descartar sesiones (p. ej. canceladas).
// intervalo: ms para volver a consultar la semana visible en segundo plano.
export function useSesionesSemana({ cargarSesiones, cargarClases, filtrar, intervalo }) {
  // Lunes de la semana pedida
  const [desdePedido, setDesdePedido] = useState(() => inicioSemana(hoyISO()));
  // Última semana que llegó del servidor
  const [datos, setDatos] = useState({ semana: null, sesiones: [] });
  const [clases, setClases] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  // Las funciones se leen desde refs para no reiniciar los efectos en cada render
  const cargarSesionesRef = useRef(cargarSesiones);
  const cargarClasesRef = useRef(cargarClases);
  const filtrarRef = useRef(filtrar);
  cargarSesionesRef.current = cargarSesiones;
  cargarClasesRef.current = cargarClases;
  filtrarRef.current = filtrar;

  // Clases: al montar y al recargar
  useEffect(() => {
    let activo = true;
    cargarClasesRef
      .current()
      .then((lista) => activo && setClases(Array.isArray(lista) ? lista : []))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, [version]);

  // Sesiones de la semana pedida (y refresco periódico en segundo plano)
  useEffect(() => {
    let activo = true;
    const semana = { desde: desdePedido, hasta: finSemana(desdePedido) };

    const consultar = async (silencioso) => {
      if (!silencioso) setCargando(true);
      try {
        const respuesta = await cargarSesionesRef.current(semana);
        if (!activo) return; // respuesta de una semana que ya no se pidió
        let lista = Array.isArray(respuesta) ? respuesta : [];
        if (filtrarRef.current) lista = lista.filter(filtrarRef.current);
        setDatos({ semana, sesiones: lista });
        setError("");
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo && !silencioso) setCargando(false);
      }
    };

    consultar(false);
    const id = intervalo ? window.setInterval(() => consultar(true), intervalo) : null;

    return () => {
      activo = false;
      if (id) window.clearInterval(id);
    };
  }, [desdePedido, version, intervalo]);

  // Cambia a la semana que contiene la fecha (no consulta si ya es la misma)
  const irAFecha = useCallback((fecha) => {
    if (fecha) setDesdePedido(inicioSemana(fecha));
  }, []);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return {
    clases: clases ?? [],
    sesiones: datos.sesiones,
    semana: datos.semana,
    // true cuando ya llegaron las clases y al menos una semana
    listo: clases !== null && datos.semana !== null,
    cargando,
    error,
    irAFecha,
    recargar,
  };
}
