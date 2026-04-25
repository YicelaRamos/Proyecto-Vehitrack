/**
 * reporteService.js - Servicio de generación de reportes
 * 
 * Este archivo maneja:
 * - Generación de reportes de combustible
 * - Generación de reportes de mantenimiento
 * - Generación de reporte general de flota
 * - Exportación a PDF
 * - Exportación a CSV (Excel)
 * 
 * @module reporteService
 */


// Importaciones


import jsPDF from 'jspdf';
import 'jspdf-autotable';
import combustibleService from './combustibleService';
import mantenimientoService from './mantenimientoService';
import vehiculoService from './vehiculoService';


// Funciones privadas


/**
 * Formatea una fecha para mostrar en reportes
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada (DD/MM/YYYY)
 */
const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Formatea un número como moneda colombiana
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado
 */
const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
};

/**
 * Agrega el encabezado del reporte al PDF
 * @param {jsPDF} doc - Documento PDF
 * @param {string} titulo - Título del reporte
 * @param {string} subtitulo - Subtítulo del reporte
 * @param {Object} usuario - Datos del usuario logueado
 * @param {Object} vehiculo - Datos del vehículo (opcional)
 */
const agregarEncabezadoPDF = (doc, titulo, subtitulo, usuario, vehiculo = null) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 35, 81);
    doc.text('VEHITRACK', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(titulo, 14, 35);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado por: ${usuario.nombre} ${usuario.apellido}`, 14, 48);
    doc.text(`Fecha de reporte: ${new Date().toLocaleString('es-CO')}`, 14, 55);
    
    if (vehiculo) {
        doc.text(`Vehículo: ${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}`, 14, 62);
    }
    
    doc.line(14, 68, 196, 68);
};

/**
 * Agrega el pie de página al PDF
 * @param {jsPDF} doc - Documento PDF
 */
const agregarPiePaginaPDF = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `VehiTrack - Sistema de Gestión de Vehículos - Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }
};


// Funciones publicas

const reporteService = {
    /**
     * Genera reporte de combustible en PDF
     * @param {number} idVehiculo - ID del vehículo
     * @param {Object} usuario - Datos del usuario logueado
     * @param {Object} vehiculo - Datos del vehículo
     * @returns {jsPDF} Documento PDF listo para descargar
     */
    generarReporteCombustiblePDF: async (idVehiculo, usuario, vehiculo) => {
        const registros = await combustibleService.listarPorVehiculo(idVehiculo);
        const estadisticas = await combustibleService.obtenerEstadisticas(idVehiculo);
        
        const doc = new jsPDF();
        
        agregarEncabezadoPDF(doc, 'REPORTE DE COMBUSTIBLE', '', usuario, vehiculo);
        
        let yPosition = 75;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('RESUMEN DE CONSUMO', 14, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de registros: ${registros.length}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Total gastado: ${formatearMoneda(estadisticas.totalGastado)}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Total de galones/litros: ${estadisticas.totalGalones.toFixed(2)}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Eficiencia promedio: ${estadisticas.promedioEficiencia} km/galón`, 14, yPosition);
        yPosition += 12;
        
        const tableData = registros.map(r => [
            formatearFecha(r.fecha),
            r.cantidad.toFixed(2),
            `${r.kilometraje.toLocaleString()} km`,
            r.kilometraje_recorrido > 0 ? `${r.kilometraje_recorrido.toLocaleString()} km` : '—',
            r.eficiencia > 0 ? `${r.eficiencia} km/gal` : '—',
            formatearMoneda(r.costo)
        ]);
        
        doc.autoTable({
            startY: yPosition,
            head: [['Fecha', 'Cantidad', 'Kilometraje', 'Recorrido', 'Eficiencia', 'Costo']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [108, 117, 125], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            margin: { left: 14, right: 14 }
        });
        
        agregarPiePaginaPDF(doc);
        
        return doc;
    },
    
    /**
     * Genera reporte de mantenimiento en PDF
     * @param {number} idVehiculo - ID del vehículo
     * @param {Object} usuario - Datos del usuario logueado
     * @param {Object} vehiculo - Datos del vehículo
     * @returns {jsPDF} Documento PDF listo para descargar
     */
    generarReporteMantenimientoPDF: async (idVehiculo, usuario, vehiculo) => {
        const registros = await mantenimientoService.listarPorVehiculo(idVehiculo);
        const estadisticas = await mantenimientoService.obtenerEstadisticas(idVehiculo);
        
        const doc = new jsPDF();
        
        agregarEncabezadoPDF(doc, 'REPORTE DE MANTENIMIENTO', '', usuario, vehiculo);
        
        let yPosition = 75;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('RESUMEN DE MANTENIMIENTOS', 14, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de registros: ${estadisticas.total}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Mantenimientos realizados: ${estadisticas.realizados}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Mantenimientos pendientes: ${estadisticas.pendientes}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Total gastado en mantenimientos: ${formatearMoneda(estadisticas.totalGastado)}`, 14, yPosition);
        yPosition += 12;
        
        const tableData = registros.map(m => [
            formatearFecha(m.fecha_programada),
            m.fecha_realizacion ? formatearFecha(m.fecha_realizacion) : 'PENDIENTE',
            m.descripcion,
            `${m.kilometraje_mantenimiento?.toLocaleString() || '—'} km`,
            formatearMoneda(m.costo)
        ]);
        
        doc.autoTable({
            startY: yPosition,
            head: [['Fecha Programada', 'Fecha Realización', 'Descripción', 'Kilometraje', 'Costo']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [220, 53, 69], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            margin: { left: 14, right: 14 }
        });
        
        agregarPiePaginaPDF(doc);
        
        return doc;
    },
    
    /**
     * Genera reporte general en pdf
     * @param {Array} vehiculos - Lista de vehículos del usuario
     * @param {Object} usuario - Datos del usuario logueado
     * @returns {jsPDF} Documento PDF listo para descargar
     */
    generarReporteGeneralPDF: async (vehiculos, usuario) => {
        const doc = new jsPDF();
        
        agregarEncabezadoPDF(doc, 'REPORTE GENERAL DE FLOTA', '', usuario);
        
        let yPosition = 75;
        
        let totalGeneralGastado = 0;
        
        for (let i = 0; i < vehiculos.length; i++) {
            const vehiculo = vehiculos[i];
            
            const statsCombustible = await combustibleService.obtenerEstadisticas(vehiculo.id_vehiculo);
            const statsMantenimiento = await mantenimientoService.obtenerEstadisticas(vehiculo.id_vehiculo);
            
            totalGeneralGastado += statsCombustible.totalGastado + statsMantenimiento.totalGastado;
            
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
                agregarEncabezadoPDF(doc, 'REPORTE GENERAL DE FLOTA (continuación)', '', usuario);
                yPosition = 75;
            }
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(10, 35, 81);
            doc.text(`Vehículo: ${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}`, 14, yPosition);
            yPosition += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`Año: ${vehiculo.anio}`, 14, yPosition);
            yPosition += 6;
            doc.text(`Kilometraje actual: ${vehiculo.kilometraje_actual?.toLocaleString() || 0} km`, 14, yPosition);
            yPosition += 6;
            doc.text(`Total gastado en combustible: ${formatearMoneda(statsCombustible.totalGastado)}`, 14, yPosition);
            yPosition += 6;
            doc.text(`Total gastado en mantenimiento: ${formatearMoneda(statsMantenimiento.totalGastado)}`, 14, yPosition);
            yPosition += 6;
            doc.text(`Total gastado: ${formatearMoneda(statsCombustible.totalGastado + statsMantenimiento.totalGastado)}`, 14, yPosition);
            yPosition += 12;
            
            doc.line(14, yPosition, 196, yPosition);
            yPosition += 6;
        }
        
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
            agregarEncabezadoPDF(doc, 'REPORTE GENERAL DE FLOTA - RESUMEN', '', usuario);
            yPosition = 75;
        } else {
            yPosition += 6;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(10, 35, 81);
        doc.text('RESUMEN GENERAL DE LA FLOTA', 14, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Total de vehículos en flota: ${vehiculos.length}`, 14, yPosition);
        yPosition += 6;
        doc.text(`Total general gastado: ${formatearMoneda(totalGeneralGastado)}`, 14, yPosition);
        
        agregarPiePaginaPDF(doc);
        
        return doc;
    },
    
    /**
     * Exporta cvs (Excel)
     * @param {Array} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    exportarCSV: (data, filename) => {
        if (!data || data.length === 0) {
            console.warn('No hay datos para exportar');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Descargar PDF (función auxiliar)
     * @param {jsPDF} doc - Documento PDF
     * @param {string} filename - Nombre del archivo
     */
    descargarPDF: (doc, filename) => {
        doc.save(`${filename}.pdf`);
    }
};

export default reporteService;