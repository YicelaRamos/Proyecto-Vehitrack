/**
 * ListaCombustible.jsx - Historial y registro de combustible de un vehículo
 *
 * Muestra los registros de combustible de un vehículo específico (por URL param).
 * Permite registrar nuevas cargas desde un formulario inline, editar mediante
 * modal y eliminar con confirmación. Incluye tarjetas de estadísticas de gasto,
 * galones y eficiencia promedio. El kilometraje ingresado actualiza el odómetro.
 * 
 * NOTA: La eficiencia (km/gal) se calcula automáticamente en el backend
 * basándose en el kilometraje recorrido entre cargas. Si falta el registro anterior,
 * la eficiencia puede mostrar 0 o valores atípicos.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import combustibleService from '../../services/combustibleService';
import vehiculoService from '../../services/vehiculoService';
import authService from '../../services/authService';
import FormCombustible from './FormCombustible';
import Sidebar from '../../components/Sidebar';
import './ListaCombustible.css';

const ListaCombustible = () => {
    const navigate = useNavigate();
    const { idVehiculo } = useParams(); // ID del vehículo desde la URL (ej: /combustible/5)

    // Estados principales
    const [registros, setRegistros] = useState([]);
    const [vehiculo, setVehiculo] = useState(null);
    const [estadisticas, setEstadisticas] = useState({ totalGastado: 0, totalGalones: 0, promedioEficiencia: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [registroEditando, setRegistroEditando] = useState(null);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const usuario = authService.getCurrentUser();

    // Al montar o cambiar el idVehiculo, cargamos todos los datos
    useEffect(() => {
        if (idVehiculo) cargarDatos();
    }, [idVehiculo]);

    // Auto-ocultar mensaje de feedback después de 3 segundos (mejor UX)
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const cargarDatos = async () => {
        setLoading(true);
        // Cargamos info del vehículo (placa, marca, modelo)
        const vehiculoData = await vehiculoService.obtenerPorId(idVehiculo);
        setVehiculo(vehiculoData);
        // Cargamos lista de registros de combustible
        const registrosData = await combustibleService.listarPorVehiculo(idVehiculo);
        setRegistros(registrosData);
        // Cargamos estadísticas (gasto total, galones acumulados, eficiencia promedio)
        const stats = await combustibleService.obtenerEstadisticas(idVehiculo);
        setEstadisticas(stats);
        setLoading(false);
    };

    // Maneja tanto la creación como la edición, según si hay registroEditando
    const handleGuardarRegistro = async (datosRegistro) => {
        let result;
        if (registroEditando) {
            // Modo edición: actualizamos registro existente
            result = await combustibleService.editar(registroEditando.id_gasto_combustible, {
                ...datosRegistro,
                id_vehiculo: idVehiculo
            });
        } else {
            // Modo creación: agregamos nuevo registro
            result = await combustibleService.agregar({
                ...datosRegistro,
                id_vehiculo: parseInt(idVehiculo)
            });
        }
        if (result.success) {
            setMensaje({ texto: result.message, tipo: 'success' });
            setShowModal(false);
            setRegistroEditando(null);
            cargarDatos(); // Refrescamos todo
        } else {
            setMensaje({ texto: result.message, tipo: 'error' });
        }
    };

    const handleEliminar = async (id, fecha) => {
        if (window.confirm(`¿Estás seguro de eliminar el registro del ${fecha}?`)) {
            const result = await combustibleService.eliminar(id);
            if (result.success) {
                setMensaje({ texto: result.message, tipo: 'success' });
                cargarDatos();
            } else {
                setMensaje({ texto: result.message, tipo: 'error' });
            }
        }
    };

    const handleEditar = (registro) => {
        setRegistroEditando(registro);
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setRegistroEditando(null);
    };

    const formatearMoneda = (valor) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

    // Redirigir si no hay sesión
    if (!usuario) {
        navigate('/');
        return null;
    }

    if (loading) {
        return (
            <Sidebar tituloPagina="Combustible">
                <div className="loading-spinner">Cargando registros de combustible...</div>
            </Sidebar>
        );
    }

    return (
        <Sidebar tituloPagina={`Combustible - ${vehiculo?.placa} (${vehiculo?.marca} ${vehiculo?.modelo})`}>
            {/* Mensaje flotante de éxito/error */}
            {mensaje.texto && (
                <div className={`alert-${mensaje.tipo === 'success' ? 'success' : 'error'}`}>
                    {mensaje.texto}
                </div>
            )}

            {/* Botón rápido para volver a la lista de vehículos */}
            <div style={{ marginBottom: '20px' }}>
                <button className="combustible-volver-btn" onClick={() => navigate('/vehiculos')}>
                    ⬅️ Volver a Vehículos
                </button>
            </div>

            {/* Tarjetas de estadísticas con gradientes de color */}
            <div className="combustible-stats">
                <div className="combustible-stat-card">
                    <h3>Total Gastado</h3>
                    <p className="stat-value">{formatearMoneda(estadisticas.totalGastado)}</p>
                </div>
                <div className="combustible-stat-card verde">
                    <h3>Total Galones/Litros</h3>
                    <p className="stat-value">{estadisticas.totalGalones.toFixed(2)}</p>
                </div>
                <div className="combustible-stat-card naranja">
                    <h3>Eficiencia Promedio</h3>
                    <p className="stat-value">
                        {estadisticas.promedioEficiencia} km/{estadisticas.totalGalones > 0 ? 'gal' : '—'}
                    </p>
                </div>
            </div>

            {/* Layout de dos columnas: tabla (izquierda) + formulario inline (derecha) */}
            <div className="combustible-double-column">
                {/* Tabla de historial de combustibles */}
                <div className="combustible-table-container">
                    <h5>📋 Historial de Tanqueos</h5>
                    {registros.length === 0 ? (
                        <div className="combustible-empty">No hay registros de combustible aún.</div>
                    ) : (
                        <table className="combustible-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Cantidad (Gal/Lit)</th>
                                    <th>Kilometraje</th>
                                    <th>Recorrido</th>
                                    <th>Eficiencia</th>
                                    <th className="text-end">Costo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registros.map((registro) => (
                                    <tr key={registro.id_gasto_combustible}>
                                        <td>{registro.fecha}</td>
                                        <td>{registro.cantidad.toFixed(2)}</td>
                                        <td>{registro.kilometraje.toLocaleString()} km</td>
                                        <td>
                                            {registro.kilometraje_recorrido > 0 
                                                ? `${registro.kilometraje_recorrido.toLocaleString()} km` 
                                                : '—'}
                                        </td>
                                        <td>
                                            {registro.eficiencia > 0
                                                ? <span className="badge-eficiencia">{registro.eficiencia} km/gal</span>
                                                : '—'}
                                        </td>
                                        <td className="text-end fw-bold text-success">{formatearMoneda(registro.costo)}</td>
                                        <td>
                                            <button className="combustible-btn-edit" onClick={() => handleEditar(registro)}>✏️ Editar</button>
                                            <button className="combustible-btn-delete" onClick={() => handleEliminar(registro.id_gasto_combustible, registro.fecha)}>🗑️ Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Formulario rápido para agregar nuevo registro de combustible */}
                <div className="combustible-form-container">
                    <h5>📝 Registrar Nuevo Gasto</h5>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        handleGuardarRegistro({
                            fecha: formData.get('fecha'),
                            cantidad: parseFloat(formData.get('cantidad')),
                            costo: parseFloat(formData.get('costo')),
                            kilometraje: parseInt(formData.get('kilometraje'))
                        });
                        e.target.reset();
                    }}>
                        <div className="combustible-form-group">
                            <label className="combustible-form-label">Fecha de Compra</label>
                            <input type="date" name="fecha" className="combustible-form-input" required />
                        </div>
                        <div className="combustible-form-group">
                            <label className="combustible-form-label">Cantidad (Galones/Litros)</label>
                            <input type="number" step="0.01" name="cantidad" className="combustible-form-input" placeholder="0.00" required />
                        </div>
                        <div className="combustible-form-group">
                            <label className="combustible-form-label">Costo Total</label>
                            <input type="number" step="0.01" name="costo" className="combustible-form-input" placeholder="0.00" required />
                        </div>
                        <div className="combustible-form-group">
                            <label className="combustible-form-label">Kilometraje Actual</label>
                            <input type="number" name="kilometraje" className="combustible-form-input" placeholder="Ej: 12500" required />
                            <small className="ayuda-texto">
                                Este valor actualizará el odómetro del vehículo
                            </small>
                        </div>
                        <button type="submit" className="combustible-form-submit">Registrar Gasto ⛽</button>
                    </form>
                </div>
            </div>

            {/* Modal de edición de registro (aparece solo cuando hay un registro seleccionado) */}
            {showModal && (
                <FormCombustible
                    registroEditando={registroEditando}
                    idVehiculo={idVehiculo}
                    onGuardar={handleGuardarRegistro}
                    onCancelar={cerrarModal}
                />
            )}
        </Sidebar>
    );
};

export default ListaCombustible;