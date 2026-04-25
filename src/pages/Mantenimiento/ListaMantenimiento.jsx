/**
 * ListaMantenimiento.jsx - Historial y gestión de mantenimientos de un vehículo
 *
 * Muestra los mantenimientos de un vehículo específico (obtenido por URL param).
 * Permite registrar nuevos mantenimientos, editar
 * mediante modal, marcar como completado y eliminar. Incluye tarjetas de
 * estadísticas y badges de estado.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mantenimientoService from '../../services/mantenimientoService';
import vehiculoService from '../../services/vehiculoService';
import authService from '../../services/authService';
import FormMantenimiento from './FormMantenimiento';
import Sidebar from '../../components/Sidebar';
import './ListaMantenimiento.css';

const ListaMantenimiento = () => {
    const navigate = useNavigate();
    const { idVehiculo } = useParams(); // ID del vehículo viene en la URL (ej: /mantenimientos/5)

    const [mantenimientos, setMantenimientos] = useState([]);
    const [vehiculo, setVehiculo] = useState(null);
    const [estadisticas, setEstadisticas] = useState({ total: 0, realizados: 0, pendientes: 0, totalGastado: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [mantenimientoEditando, setMantenimientoEditando] = useState(null);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const usuario = authService.getCurrentUser();

    // Al montar o cambiar el idVehiculo, cargamos todos los datos necesarios
    useEffect(() => {
        if (idVehiculo) cargarDatos();
    }, [idVehiculo]);

    // Efecto para que los mensajes de éxito/error desaparezcan solos a los 3 segundos.
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const cargarDatos = async () => {
        setLoading(true);
        // Cargamos información del vehículo (placa, marca, modelo)
        const vehiculoData = await vehiculoService.obtenerPorId(idVehiculo);
        setVehiculo(vehiculoData);
        // Cargamos la lista de mantenimientos del vehículo
        const mantenimientosData = await mantenimientoService.listarPorVehiculo(idVehiculo);
        setMantenimientos(mantenimientosData);
        // Cargamos estadísticas (totales, realizados, pendientes, gasto)
        const stats = await mantenimientoService.obtenerEstadisticas(idVehiculo);
        setEstadisticas(stats);
        setLoading(false);
    };

    // Esta función maneja tanto la creación como la edición, según si hay mantenimientoEditando.
    const handleGuardarMantenimiento = async (datosMantenimiento) => {
        let result;
        if (mantenimientoEditando) {
            // Modo edición: actualizamos el mantenimiento existente
            result = await mantenimientoService.editar(
                mantenimientoEditando.id_mantenimiento,
                { ...datosMantenimiento, id_vehiculo: idVehiculo }
            );
        } else {
            // Modo creación: agregamos un nuevo mantenimiento
            result = await mantenimientoService.agregar({
                ...datosMantenimiento,
                id_vehiculo: parseInt(idVehiculo)
            });
        }
        if (result.success) {
            setMensaje({ texto: result.message, tipo: 'success' });
            setShowModal(false);
            setMantenimientoEditando(null);
            cargarDatos(); // Recargamos la lista y estadísticas
        } else {
            setMensaje({ texto: result.message, tipo: 'error' });
        }
    };

    // Marcar un mantenimiento pendiente como realizado (se pone la fecha de hoy automáticamente en el backend)
    const handleCompletar = async (id, descripcion) => {
        if (window.confirm(`¿Confirmas que el mantenimiento "${descripcion}" se completó hoy?`)) {
            const result = await mantenimientoService.marcarComoRealizado(id);
            if (result.success) {
                setMensaje({ texto: result.message, tipo: 'success' });
                cargarDatos();
            } else {
                setMensaje({ texto: result.message, tipo: 'error' });
            }
        }
    };

    const handleEliminar = async (id, descripcion) => {
        if (window.confirm(`¿Estás seguro de eliminar el mantenimiento "${descripcion}"?`)) {
            const result = await mantenimientoService.eliminar(id);
            if (result.success) {
                setMensaje({ texto: result.message, tipo: 'success' });
                cargarDatos();
            } else {
                setMensaje({ texto: result.message, tipo: 'error' });
            }
        }
    };

    const handleEditar = (mantenimiento) => {
        setMantenimientoEditando(mantenimiento);
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setMantenimientoEditando(null);
    };

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

    // Verifica si una fecha programada ya pasó (se considera "vencido" solo si aún no se realizó)
    const verificarVencido = (fechaProgramada) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Normalizamos a medianoche para comparar solo fechas
        return new Date(fechaProgramada) < hoy;
    };

    // Si no hay usuario logueado, redirigimos al login
    if (!usuario) {
        navigate('/');
        return null;
    }

    if (loading) {
        return (
            <Sidebar tituloPagina="Mantenimientos">
                <div className="loading-spinner">Cargando mantenimientos...</div>
            </Sidebar>
        );
    }

    return (
        <Sidebar tituloPagina={`Mantenimientos - ${vehiculo?.placa} (${vehiculo?.marca} ${vehiculo?.modelo})`}>
            {/* Mensaje flotante de éxito/error */}
            {mensaje.texto && (
                <div className={`alert-${mensaje.tipo === 'success' ? 'success' : 'error'}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* Botón para volver a la lista de vehículos (atajo, aunque el sidebar ya tiene navegación) */}
            <div style={{ marginBottom: '20px' }}>
                <button className="mantenimiento-volver-btn" onClick={() => navigate('/vehiculos')}>
                    ⬅️ Volver a Vehículos
                </button>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="mantenimiento-stats">
                <div className="mantenimiento-stat-card">
                    <h3>Total Mantenimientos</h3>
                    <p className="stat-value">{estadisticas.total}</p>
                </div>
                <div className="mantenimiento-stat-card warning">
                    <h3>Pendientes</h3>
                    <p className="stat-value">{estadisticas.pendientes}</p>
                </div>
                <div className="mantenimiento-stat-card success">
                    <h3>Realizados</h3>
                    <p className="stat-value">{estadisticas.realizados}</p>
                </div>
                <div className="mantenimiento-stat-card info">
                    <h3>Total Gastado</h3>
                    <p className="stat-value">{formatearMoneda(estadisticas.totalGastado)}</p>
                </div>
            </div>

            {/* Layout de dos columnas: tabla (izquierda) + formulario rápido (derecha) */}
            <div className="mantenimiento-double-column">
                {/* Tabla de historial de mantenimientos */}
                <div className="mantenimiento-table-container">
                    <h5>📋 Registros de Taller</h5>
                    {mantenimientos.length === 0 ? (
                        <div className="mantenimiento-empty">No hay registros de mantenimiento aún.</div>
                    ) : (
                        <table className="mantenimiento-table">
                            <thead>
                                <tr>
                                    <th>Fecha Prog.</th>
                                    <th>Fecha Real.</th>
                                    <th>Descripción</th>
                                    <th>KM</th>
                                    <th className="text-end">Costo</th>
                                    <th>Estado / Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mantenimientos.map((m) => {
                                    // Un mantenimiento está vencido si no tiene fecha de realización y la fecha programada es anterior a hoy
                                    const isVencido = !m.fecha_realizacion && verificarVencido(m.fecha_programada);
                                    return (
                                        <tr key={m.id_mantenimiento}>
                                            <td>{m.fecha_programada}</td>
                                            <td>
                                                {m.fecha_realizacion
                                                    ? <span className="badge-realizado">{m.fecha_realizacion}</span>
                                                    : <span className="badge-pendiente">Pendiente</span>
                                                }
                                            </td>
                                            <td>{m.descripcion}</td>
                                            <td>{m.kilometraje_mantenimiento?.toLocaleString() || '—'} KM</td>
                                            <td className="text-end fw-bold text-success">{formatearMoneda(m.costo)}</td>
                                            <td>
                                                {!m.fecha_realizacion ? (
                                                    <>
                                                        <button className="mantenimiento-btn-completar" onClick={() => handleCompletar(m.id_mantenimiento, m.descripcion)}>✅ Completar</button>
                                                        <button className="mantenimiento-btn-edit" onClick={() => handleEditar(m)}>✏️ Editar</button>
                                                        <button className="mantenimiento-btn-delete" onClick={() => handleEliminar(m.id_mantenimiento, m.descripcion)}>🗑️ Eliminar</button>
                                                    </>
                                                ) : (
                                                    <span className="text-success fw-bold small">✨ Finalizado</span>
                                                )}
                                                {isVencido && !m.fecha_realizacion && (
                                                    <span className="badge-vencido" style={{ marginLeft: '8px' }}>VENCIDO</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Formulario rápido para registrar un nuevo mantenimiento */}
                <div className="mantenimiento-form-container">
                    <h5>📝 Nuevo Mantenimiento</h5>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        // Leemos los datos directamente del FormData (no usamos estado para simplificar)
                        const formData = new FormData(e.target);
                        handleGuardarMantenimiento({
                            fecha_programada: formData.get('fecha_programada'),
                            fecha_realizacion: formData.get('fecha_realizacion') || null,
                            descripcion: formData.get('descripcion'),
                            costo: parseFloat(formData.get('costo')) || 0,
                            kilometraje_mantenimiento: parseInt(formData.get('kilometraje_mantenimiento')) || 0
                        });
                        e.target.reset(); // Limpiamos el formulario después de guardar
                    }}>
                        <div className="mantenimiento-form-group">
                            <label className="mantenimiento-form-label">Fecha Programada *</label>
                            <input type="date" name="fecha_programada" className="mantenimiento-form-input" required />
                        </div>
                        <div className="mantenimiento-form-group">
                            <label className="mantenimiento-form-label">Fecha Realización (Opcional)</label>
                            <input type="date" name="fecha_realizacion" className="mantenimiento-form-input" />
                            <small className="ayuda-texto">Dejar vacío si es una programación futura</small>
                        </div>
                        <div className="mantenimiento-form-group">
                            <label className="mantenimiento-form-label">Descripción *</label>
                            <textarea name="descripcion" className="mantenimiento-form-textarea" placeholder="Ej: Cambio de aceite y filtros" required></textarea>
                        </div>
                        <div className="mantenimiento-form-group">
                            <label className="mantenimiento-form-label">Kilometraje del Servicio *</label>
                            <input type="number" name="kilometraje_mantenimiento" className="mantenimiento-form-input" placeholder="Ej: 15000" required />
                        </div>
                        <div className="mantenimiento-form-group">
                            <label className="mantenimiento-form-label">Costo del Servicio</label>
                            <input type="number" step="0.01" name="costo" className="mantenimiento-form-input" placeholder="0.00" />
                        </div>
                        <button type="submit" className="mantenimiento-form-submit">Guardar Registro</button>
                    </form>
                </div>
            </div>

            {/* Modal de edición de mantenimiento (aparece solo cuando showModal es true) */}
            {showModal && (
                <FormMantenimiento
                    mantenimientoEditando={mantenimientoEditando}
                    idVehiculo={idVehiculo}
                    onGuardar={handleGuardarMantenimiento}
                    onCancelar={cerrarModal}
                />
            )}
        </Sidebar>
    );
};

export default ListaMantenimiento;