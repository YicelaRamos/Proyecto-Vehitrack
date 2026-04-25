/**
 * ReporteMantenimiento.jsx - Reporte de historial de mantenimientos por vehículo
 *
 * Permite seleccionar un vehículo y ver su historial de mantenimientos
 * con estadísticas de realizados, pendientes y gasto total.
 * Soporta exportación a PDF y CSV.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import vehiculoService from '../../services/vehiculoService';
import mantenimientoService from '../../services/mantenimientoService';
import reporteService from '../../services/reporteService';
import authService from '../../services/authService';
import './Reportes.css';

const ReporteMantenimiento = () => {

    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();

    const [vehiculos, setVehiculos] = useState([]);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [registros, setRegistros] = useState([]);
    const [estadisticas, setEstadisticas] = useState({ total: 0, realizados: 0, pendientes: 0, totalGastado: 0 });
    const [loading, setLoading] = useState(true);
    const [exportando, setExportando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    useEffect(() => { cargarVehiculos(); }, []);

    // Recarga datos cuando el usuario cambia de vehículo
    useEffect(() => {
        if (vehiculoSeleccionado) cargarDatosMantenimiento();
    }, [vehiculoSeleccionado]);

    // Auto-oculta el mensaje de feedback después de 3 segundos
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const cargarVehiculos = async () => {
        setLoading(true);
        const lista = await vehiculoService.listarPorUsuario();
        setVehiculos(lista);
        if (lista.length > 0) setVehiculoSeleccionado(lista[0]);
        setLoading(false);
    };

    const cargarDatosMantenimiento = async () => {
        if (!vehiculoSeleccionado) return;
        setLoading(true);
        const registrosData = await mantenimientoService.listarPorVehiculo(vehiculoSeleccionado.id_vehiculo);
        const stats = await mantenimientoService.obtenerEstadisticas(vehiculoSeleccionado.id_vehiculo);
        setRegistros(registrosData);
        setEstadisticas(stats);
        setLoading(false);
    };

    const handleExportarPDF = async () => {
        if (!vehiculoSeleccionado || registros.length === 0) return;
        setExportando(true);
        const doc = await reporteService.generarReporteMantenimientoPDF(vehiculoSeleccionado.id_vehiculo, usuario, vehiculoSeleccionado);
        reporteService.descargarPDF(doc, `Reporte_Mantenimiento_${vehiculoSeleccionado.placa}`);
        setMensaje({ texto: 'PDF generado exitosamente', tipo: 'success' });
        setExportando(false);
    };

    const handleExportarCSV = () => {
        if (!vehiculoSeleccionado || registros.length === 0) return;
        const datosCSV = registros.map(r => ({
            Fecha_Programada: r.fecha_programada,
            Fecha_Realizacion: r.fecha_realizacion || 'Pendiente',
            Descripcion: r.descripcion,
            Costo: formatearMoneda(r.costo)
        }));
        reporteService.exportarCSV(datosCSV, `Reporte_Mantenimiento_${vehiculoSeleccionado.placa}`);
        setMensaje({ texto: 'CSV generado exitosamente', tipo: 'success' });
    };

    // ⚠️ formatearMoneda y formatearFecha están duplicadas en los 3 reportes
    // Considerar moverlas a un archivo utils/formatters.js compartido
    const formatearMoneda = (valor) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
    };

    const buttonStyles = {
        pdf: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
        csv: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
    };

    if (!usuario) { navigate('/'); return null; }

    return (
        <Sidebar tituloPagina="🛠️ Reporte de Mantenimientos">

            {mensaje.texto && (
                <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#d4edda', color: '#155724' }}>
                    {mensaje.texto}
                </div>
            )}

            {vehiculos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '15px' }}>
                    No tienes vehículos registrados.
                </div>
            ) : (
                <>
                    {/* Selector de vehículo */}
                    <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', marginBottom: '25px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Seleccionar Vehículo:</label>
                        <select
                            style={{ width: '100%', maxWidth: '400px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                            value={vehiculoSeleccionado?.id_vehiculo || ''}
                            onChange={(e) => {
                                const vehiculo = vehiculos.find(v => v.id_vehiculo === parseInt(e.target.value));
                                setVehiculoSeleccionado(vehiculo);
                            }}
                        >
                            {vehiculos.map(vehiculo => (
                                <option key={vehiculo.id_vehiculo} value={vehiculo.id_vehiculo}>
                                    {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estadísticas del vehículo seleccionado */}
                    {!loading && vehiculoSeleccionado && (
                        <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', marginBottom: '25px' }}>
                            <h3 style={{ margin: '0 0 15px 0' }}>📊 Estadísticas de {vehiculoSeleccionado.placa}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Total de registros</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>{estadisticas.total}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Realizados</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{estadisticas.realizados}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Pendientes</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{estadisticas.pendientes}</div></div>
                                <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Total gastado</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{formatearMoneda(estadisticas.totalGastado)}</div></div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div>Cargando...</div>
                    ) : registros.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '15px' }}>
                            No hay registros de mantenimiento para este vehículo.
                        </div>
                    ) : (
                        <>
                            <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#fff3e0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Fecha Programada</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Fecha Realización</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Descripción</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Costo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registros.map((r, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '12px' }}>{formatearFecha(r.fecha_programada)}</td>
                                                <td style={{ padding: '12px' }}>{r.fecha_realizacion ? formatearFecha(r.fecha_realizacion) : 'Pendiente'}</td>
                                                <td style={{ padding: '12px' }}>{r.descripcion}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>{formatearMoneda(r.costo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '25px', justifyContent: 'flex-end' }}>
                                <button style={buttonStyles.pdf} onClick={handleExportarPDF} disabled={exportando}>📄 Exportar PDF</button>
                                <button style={buttonStyles.csv} onClick={handleExportarCSV}>📊 Exportar CSV</button>
                            </div>
                        </>
                    )}
                </>
            )}
        </Sidebar>
    );
};

export default ReporteMantenimiento;