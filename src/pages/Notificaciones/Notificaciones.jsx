/**
 * Notificaciones.jsx - Centro de alertas de documentos y mantenimientos
 *
 * Muestra dos secciones: alertas de documentos obligatorios (SOAT/RTM)
 * con estado vencido o próximo a vencer, y mantenimientos pendientes.
 * Permite renovar documentos directamente desde un modal con selector de fecha.
 * El contador del título se actualiza con el total de alertas activas.
 *
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import notificacionService from '../../services/notificacionService';
import authService from '../../services/authService';
import './Notificaciones.css'; // Se importa pero actualmente no se usa (todo inline)

const Notificaciones = () => {

    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();

    const [alertasDocumentos, setAlertasDocumentos] = useState([]);
    const [alertasMantenimiento, setAlertasMantenimiento] = useState([]);
    const [totalAlertas, setTotalAlertas] = useState(0);
    const [loading, setLoading] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [documentoRenovar, setDocumentoRenovar] = useState({ idVehiculo: null, placa: '', tipo: '' });
    const [nuevaFecha, setNuevaFecha] = useState('');
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Al montar el componente, cargamos todas las alertas
    useEffect(() => { cargarAlertas(); }, []);

    // Efecto para que los mensajes de éxito/error desaparezcan solos a los 3 segundos.
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const cargarAlertas = async () => {
        setLoading(true);
        const alertas = await notificacionService.obtenerAlertas();
        setAlertasDocumentos(alertas.alertasDocumentos);
        setAlertasMantenimiento(alertas.alertasMantenimiento);
        setTotalAlertas(alertas.total);
        setLoading(false);
    };

    // Abre el modal de renovación y precarga la fecha de hoy como mínimo seleccionable.
    // Así evitamos que el usuario elija una fecha anterior a hoy por error.
    const abrirModalRenovacion = (idVehiculo, placa, tipo) => {
        setDocumentoRenovar({ idVehiculo, placa, tipo });
        setNuevaFecha(new Date().toISOString().split('T')[0]);
        setModalAbierto(true);
    };

    const handleRenovar = async () => {
        if (!nuevaFecha) {
            setMensaje({ texto: 'Por favor selecciona una fecha', tipo: 'error' });
            return;
        }
        const result = await notificacionService.renovarDocumento(
            documentoRenovar.idVehiculo,
            documentoRenovar.tipo,
            nuevaFecha
        );
        if (result.success) {
            setMensaje({ texto: result.message, tipo: 'success' });
            setModalAbierto(false);
            cargarAlertas(); // Recargamos la lista para que desaparezca la alerta renovada
        } else {
            setMensaje({ texto: result.message, tipo: 'error' });
        }
    };

    const handleGestionarMantenimiento = (idVehiculo) => {
        navigate(`/mantenimientos/${idVehiculo}`);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'No definida';
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
    };

    // Convierte los días restantes en un texto amigable para el usuario.
    // Maneja casos especiales como "vence hoy", "vence mañana", o "vencido hace X días".
    const obtenerTextoDias = (dias) => {
        if (dias < 0) return `Vencido hace ${Math.abs(dias)} días`;
        if (dias === 0) return 'Vence hoy';
        if (dias === 1) return 'Vence mañana';
        return `Vence en ${dias} días`;
    };

    // Estilos en línea reutilizables. Se usan en lugar de clases CSS.
    // La desventaja es que no podemos aprovechar la animación pulse definida en el CSS.
    const buttonStyles = {
        danger: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' },
        warning: { backgroundColor: '#ffc107', color: '#212529', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' },
        info: { backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', width: '100%' }
    };

    if (!usuario) { navigate('/'); return null; }

    return (
        <Sidebar tituloPagina={`🔔 Centro de Alertas ${totalAlertas > 0 ? `(${totalAlertas})` : ''}`}>

            {/* Mensaje flotante de éxito/error */}
            {mensaje.texto && (
                <div style={{
                    padding: '10px', borderRadius: '8px', marginBottom: '20px',
                    backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da',
                    color: mensaje.tipo === 'success' ? '#155724' : '#721c24'
                }}>
                    {mensaje.texto}
                </div>
            )}

            {/* Cuando no hay alertas, mostramos un mensaje positivo de "todo en orden" */}
            {!loading && alertasDocumentos.length === 0 && alertasMantenimiento.length === 0 && (
                <div style={{
                    backgroundColor: '#d4edda', borderRadius: '15px', padding: '20px',
                    marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px'
                }}>
                    <div style={{ fontSize: '32px' }}>✅</div>
                    <div>
                        <strong>¡Todo en orden!</strong>
                        <p style={{ margin: '5px 0 0' }}>No tienes documentos vencidos ni mantenimientos pendientes para hoy.</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div>Cargando notificaciones...</div>
            ) : (
                <>
                    {/* SECCIÓN: Documentos obligatorios (SOAT / RTM) */}
                    {alertasDocumentos.length > 0 && (
                        <>
                            <h3 style={{ color: '#dc3545', marginBottom: '15px' }}>⚠️ Control de Documentos Obligatorios</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                {alertasDocumentos.map((alerta, index) => (
                                    <div key={index} style={{ backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                        <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0' }}>
                                            <div>
                                                <h5 style={{ margin: '0 0 5px 0' }}>{alerta.tipoDocumento}: {alerta.placa}</h5>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>{alerta.marca} {alerta.modelo}</div>
                                            </div>
                                            {/* Badge que cambia según el estado (VENCIDO o PRÓXIMO) */}
                                            <span style={{
                                                backgroundColor: alerta.estado === 'VENCIDO' ? '#dc3545' : '#ffc107',
                                                color: alerta.estado === 'VENCIDO' ? 'white' : '#212529',
                                                padding: '4px 12px', borderRadius: '20px',
                                                fontSize: '12px', fontWeight: 'bold'
                                            }}>
                                                {alerta.estado}
                                            </span>
                                        </div>
                                        <div style={{ padding: '15px' }}>
                                            <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '10px', marginBottom: '15px' }}>
                                                <div style={{ fontSize: '10px', color: '#6c757d' }}>Vencimiento</div>
                                                <div style={{ fontWeight: 'bold', color: alerta.estado === 'VENCIDO' ? '#dc3545' : '#333' }}>
                                                    {formatearFecha(alerta.fechaVencimiento)}
                                                </div>
                                                <div style={{ fontSize: '12px', marginTop: '5px', color: '#6c757d' }}>
                                                    {obtenerTextoDias(alerta.diasRestantes)}
                                                </div>
                                            </div>
                                            {/* Botón para renovar el documento (abre modal) */}
                                            <button
                                                style={alerta.estado === 'VENCIDO' ? buttonStyles.danger : buttonStyles.warning}
                                                onClick={() => abrirModalRenovacion(alerta.id_vehiculo, alerta.placa, alerta.tipoDocumento)}
                                            >
                                                🔄 Renovar {alerta.tipoDocumento}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* SECCIÓN: Mantenimientos preventivos pendientes */}
                    {alertasMantenimiento.length > 0 && (
                        <>
                            <h3 style={{ color: '#17a2b8', marginBottom: '15px' }}>🛠️ Mantenimientos Preventivos Pendientes</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {alertasMantenimiento.map((alerta) => (
                                    <div key={alerta.id_mantenimiento} style={{
                                        backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderLeft: '4px solid #17a2b8'
                                    }}>
                                        <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold', color: '#17a2b8' }}>Vehículo: {alerta.placa}</span>
                                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>Servicio Sugerido</div>
                                            </div>
                                            <span style={{ backgroundColor: '#17a2b8', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>PENDIENTE</span>
                                        </div>
                                        <div style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{alerta.descripcion}</div>
                                            <div style={{ fontSize: '13px', color: '#17a2b8', fontWeight: 'bold', marginTop: '10px' }}>
                                                📅 Fecha Programada: {formatearFecha(alerta.fecha_programada)}
                                                {/* Si la fecha ya pasó, mostramos un indicador (Vencido) */}
                                                {alerta.diasRestantes <= 0 && <span style={{ color: '#dc3545', marginLeft: '10px' }}>(Vencido)</span>}
                                            </div>
                                            {alerta.kilometraje > 0 && (
                                                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>
                                                    🔧 Kilometraje sugerido: {alerta.kilometraje.toLocaleString()} km
                                                </div>
                                            )}
                                            <button
                                                style={{ ...buttonStyles.info, marginTop: '15px', cursor: 'pointer' }}
                                                onClick={() => handleGestionarMantenimiento(alerta.id_vehiculo)}
                                            >
                                                📍 Gestionar en Taller
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* MODAL DE RENOVACIÓN DE DOCUMENTO */}
            {modalAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <div style={{
                            backgroundColor: '#0a2351', color: 'white', padding: '18px 24px',
                            borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>Renovar {documentoRenovar.tipo} - {documentoRenovar.placa}</h3>
                            <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }} onClick={() => setModalAbierto(false)}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p>Estás actualizando el documento del vehículo con placa <strong>{documentoRenovar.placa}</strong></p>
                            <div style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nueva Fecha de Vencimiento:</label>
                                <input
                                    type="date"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    value={nuevaFecha}
                                    onChange={(e) => setNuevaFecha(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} // No permite fechas pasadas
                                />
                                <small style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px', display: 'block' }}>
                                    La alerta desaparecerá automáticamente al guardar una fecha futura.
                                </small>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setModalAbierto(false)}>
                                Cancelar
                            </button>
                            <button style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }} onClick={handleRenovar}>
                                ✅ Actualizar y Limpiar Alerta
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </Sidebar>
    );
};

export default Notificaciones;