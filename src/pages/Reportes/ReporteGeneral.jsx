/**
 * ReporteGeneral.jsx - Reporte consolidado de toda la flota del usuario
 *
 * Muestra un resumen de gastos agrupados por vehículo, sumando combustible
 * y mantenimientos. Incluye totales generales y estado de documentos (SOAT/RTM).
 * Soporta exportación a PDF y CSV.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import vehiculoService from '../../services/vehiculoService';
import combustibleService from '../../services/combustibleService';
import mantenimientoService from '../../services/mantenimientoService';
import reporteService from '../../services/reporteService';
import authService from '../../services/authService';
import './Reportes.css';

const ReporteGeneral = () => {

    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();

    const [vehiculos, setVehiculos] = useState([]);
    const [datosVehiculos, setDatosVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportando, setExportando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [totales, setTotales] = useState({ totalCombustible: 0, totalMantenimiento: 0, totalGeneral: 0, totalVehiculos: 0 });

    useEffect(() => { cargarDatosGenerales(); }, []);

    // Auto-ocultar mensaje después de 3 segundos
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    // Carga estadísticas de combustible y mantenimiento para cada vehículo en paralelo.
    // Usamos un bucle for...of con await dentro para asegurar que se procesen secuencialmente,
    // porque cada llamada es independiente y no queremos saturar el servidor con muchas peticiones simultáneas.
    // Esto podría optimizarse con Promise.all si el backend lo soporta bien.
    const cargarDatosGenerales = async () => {
        setLoading(true);
        const vehiculosLista = await vehiculoService.listarPorUsuario();
        setVehiculos(vehiculosLista);

        let datos = [];
        let totalComb = 0;
        let totalMant = 0;

        for (const vehiculo of vehiculosLista) {
            const statsCombustible = await combustibleService.obtenerEstadisticas(vehiculo.id_vehiculo);
            const statsMantenimiento = await mantenimientoService.obtenerEstadisticas(vehiculo.id_vehiculo);

            datos.push({
                ...vehiculo,
                totalCombustible: statsCombustible.totalGastado,
                totalMantenimiento: statsMantenimiento.totalGastado,
                totalVehiculo: statsCombustible.totalGastado + statsMantenimiento.totalGastado
            });

            totalComb += statsCombustible.totalGastado;
            totalMant += statsMantenimiento.totalGastado;
        }

        setDatosVehiculos(datos);
        setTotales({ totalCombustible: totalComb, totalMantenimiento: totalMant, totalGeneral: totalComb + totalMant, totalVehiculos: vehiculosLista.length });
        setLoading(false);
    };

    const handleExportarPDF = async () => {
        if (vehiculos.length === 0) return;
        setExportando(true);
        const doc = await reporteService.generarReporteGeneralPDF(vehiculos, usuario);
        reporteService.descargarPDF(doc, `Reporte_General_Flota`);
        setMensaje({ texto: 'PDF generado exitosamente', tipo: 'success' });
        setExportando(false);
    };

    const handleExportarCSV = () => {
        if (datosVehiculos.length === 0) return;
        const datosCSV = datosVehiculos.map(v => ({
            Placa: v.placa,
            Marca: v.marca,
            Modelo: v.modelo,
            Año: v.anio,
            Total_Combustible: formatearMoneda(v.totalCombustible),
            Total_Mantenimiento: formatearMoneda(v.totalMantenimiento),
            Total_Gastado: formatearMoneda(v.totalVehiculo)
        }));
        reporteService.exportarCSV(datosCSV, `Reporte_General_Flota`);
        setMensaje({ texto: 'CSV generado exitosamente', tipo: 'success' });
    };

    //Las mismas funciones de formato aparecen en los tres reportes. Extraer a un helper común.
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
        <Sidebar tituloPagina="📊 Reporte General de Flota">

            {mensaje.texto && (
                <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#d4edda', color: '#155724' }}>
                    {mensaje.texto}
                </div>
            )}

            {loading ? (
                <div>Cargando reporte general...</div>
            ) : vehiculos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '15px' }}>
                    No tienes vehículos registrados.
                </div>
            ) : (
                <>
                    {/* Tarjeta con totales de la flota */}
                    <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', marginBottom: '25px' }}>
                        <h3 style={{ margin: '0 0 15px 0' }}>📊 Resumen General de la Flota</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Total de vehículos</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0a2351' }}>{totales.totalVehiculos}</div></div>
                            <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Total gastado en combustible</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{formatearMoneda(totales.totalCombustible)}</div></div>
                            <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Total gastado en mantenimientos</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{formatearMoneda(totales.totalMantenimiento)}</div></div>
                            <div><div style={{ fontSize: '12px', color: '#6c757d' }}>Total general gastado</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{formatearMoneda(totales.totalGeneral)}</div></div>
                        </div>
                    </div>

                    {/* Tabla de vehículos con gastos y estado de documentos */}
                    <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0a2351', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Placa</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Vehículo</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Año</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>KM Actual</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>SOAT</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>RTM</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Gastado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosVehiculos.map((v, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#e94560' }}>{v.placa}</td>
                                        <td style={{ padding: '12px' }}>{v.marca} {v.modelo}</td>
                                        <td style={{ padding: '12px' }}>{v.anio}</td>
                                        <td style={{ padding: '12px' }}>{v.kilometraje_actual?.toLocaleString() || 0} km</td>
                                        {/* Badge de color: rojo si está vencido, verde si vigente */}
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ backgroundColor: new Date(v.vencimiento_soat) < new Date() ? '#dc3545' : '#28a745', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
                                                {formatearFecha(v.vencimiento_soat)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ backgroundColor: new Date(v.vencimiento_rtm) < new Date() ? '#dc3545' : '#28a745', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
                                                {formatearFecha(v.vencimiento_rtm)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>{formatearMoneda(v.totalVehiculo)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                                    <td colSpan="6" style={{ padding: '12px', textAlign: 'right' }}>TOTAL GENERAL:</td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#dc3545' }}>{formatearMoneda(totales.totalGeneral)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Botones de exportación */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '25px', justifyContent: 'flex-end' }}>
                        <button style={buttonStyles.pdf} onClick={handleExportarPDF} disabled={exportando}>📄 Exportar PDF</button>
                        <button style={buttonStyles.csv} onClick={handleExportarCSV}>📊 Exportar CSV</button>
                    </div>
                </>
            )}
        </Sidebar>
    );
};

export default ReporteGeneral;