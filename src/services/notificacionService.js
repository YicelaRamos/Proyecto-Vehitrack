/**
 * notificacionService.js - Servicio de gestión de notificaciones y alertas
 * 
 * Este archivo maneja:
 * - Alertas de documentos vencidos/próximos (SOAT, RTM)
 * - Alertas de mantenimientos pendientes
 * - Cálculo de estados (VENCIDO, PRÓXIMO, OK)
 * - Renovación de documentos
 * - Contador total de alertas
 * 
 * Por ahora: Usa localStorage (simula una base de datos) 
 */

// Constantes y cofiguración

// Claves para localStorage
const VEHICULOS_KEY = 'vehitrack_vehiculos';
const MANTENIMIENTO_KEY = 'vehitrack_mantenimiento';
const CURRENT_USER_KEY = 'vehitrack_current_user';

// Constantes para cálculo de días
const DIAS_ALERTA = 15;  // Alertar cuando falten 15 días o menos

// Funciones privadas

/**
 * Obtiene el ID del usuario actualmente logueado
 * @returns {number} ID del usuario o 0 si no hay sesión
 */
const getCurrentUserId = () => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    if (user) {
        const usuario = JSON.parse(user);
        return usuario.id;
    }
    return 0;
};

/**
 * Obtiene todos los vehículos
 * @returns {Array} Lista de vehículos
 */
const getVehiculos = () => {
    const vehiculos = localStorage.getItem(VEHICULOS_KEY);
    return vehiculos ? JSON.parse(vehiculos) : [];
};

/**
 * Obtiene todos los mantenimientos
 * @returns {Array} Lista de mantenimientos
 */
const getMantenimientos = () => {
    const mantenimientos = localStorage.getItem(MANTENIMIENTO_KEY);
    return mantenimientos ? JSON.parse(mantenimientos) : [];
};

/**
 * Calcula el estado de un documento basado en su fecha de vencimiento
 * @param {string} fechaVencimiento - Fecha en formato YYYY-MM-DD
 * @returns {Object} Estado y días restantes
 */
const calcularEstadoDocumento = (fechaVencimiento) => {
    if (!fechaVencimiento) return { estado: null, diasRestantes: null };
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaVencimiento);
    const diffTime = fecha - hoy;
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
        return { estado: 'VENCIDO', diasRestantes };
    } else if (diasRestantes <= DIAS_ALERTA) {
        return { estado: 'PRÓXIMO', diasRestantes };
    } else {
        return { estado: 'OK', diasRestantes };
    }
};

/**
 * Obtiene mantenimientos pendientes de un vehículo
 * @param {number} idVehiculo - ID del vehículo
 * @returns {Array} Lista de mantenimientos pendientes
 */
const getMantenimientosPendientesPorVehiculo = (idVehiculo) => {
    const todos = getMantenimientos();
    return todos.filter(m => 
        m.id_vehiculo === idVehiculo && 
        !m.fecha_realizacion  // Pendiente (sin fecha de realización)
    );
};

// Funciones publicas

const notificacionService = {
    /**
     * Obtener todas las alertas del usuario
     * @returns {Promise<Object>} Objeto con alertasDocumentos, alertasMantenimiento y total
     */
    obtenerAlertas: () => {
        return new Promise((resolve) => {
            const userId = getCurrentUserId();
            const vehiculos = getVehiculos();
            
            // Filtrar vehículos del usuario actual
            const misVehiculos = vehiculos.filter(v => v.id_usuario === userId);
            
            // Alertas de documentos(SOAT y RTM)
           
            const alertasDocumentos = [];
            
            misVehiculos.forEach(vehiculo => {
                // Calcular estado del SOAT
                const soat = calcularEstadoDocumento(vehiculo.vencimiento_soat);
                if (soat.estado === 'VENCIDO' || soat.estado === 'PRÓXIMO') {
                    alertasDocumentos.push({
                        id_vehiculo: vehiculo.id_vehiculo,
                        placa: vehiculo.placa,
                        marca: vehiculo.marca,
                        modelo: vehiculo.modelo,
                        tipoDocumento: 'SOAT',
                        fechaVencimiento: vehiculo.vencimiento_soat,
                        estado: soat.estado,
                        diasRestantes: soat.diasRestantes
                    });
                }
                
                // Calcular estado del RTM
                const rtm = calcularEstadoDocumento(vehiculo.vencimiento_rtm);
                if (rtm.estado === 'VENCIDO' || rtm.estado === 'PRÓXIMO') {
                    alertasDocumentos.push({
                        id_vehiculo: vehiculo.id_vehiculo,
                        placa: vehiculo.placa,
                        marca: vehiculo.marca,
                        modelo: vehiculo.modelo,
                        tipoDocumento: 'RTM',
                        fechaVencimiento: vehiculo.vencimiento_rtm,
                        estado: rtm.estado,
                        diasRestantes: rtm.diasRestantes
                    });
                }
            });
            
            // Alertas de mantenimiento pendientes

            const alertasMantenimiento = [];
            
            misVehiculos.forEach(vehiculo => {
                const mantenimientosPendientes = getMantenimientosPendientesPorVehiculo(vehiculo.id_vehiculo);
                
                mantenimientosPendientes.forEach(m => {
                    // Calcular días restantes para la fecha programada
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const fechaProg = new Date(m.fecha_programada);
                    const diffTime = fechaProg - hoy;
                    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    alertasMantenimiento.push({
                        id_mantenimiento: m.id_mantenimiento,
                        id_vehiculo: vehiculo.id_vehiculo,
                        placa: vehiculo.placa,
                        descripcion: m.descripcion,
                        fecha_programada: m.fecha_programada,
                        kilometraje: m.kilometraje_mantenimiento,
                        costo: m.costo,
                        diasRestantes: diasRestantes
                    });
                });
            });
            
            // Ordenar alertas de mantenimiento por fecha (más cercana primero)
            alertasMantenimiento.sort((a, b) => a.diasRestantes - b.diasRestantes);
            
            // Total de alertas
    
            const total = alertasDocumentos.length + alertasMantenimiento.length;
            
            setTimeout(() => {
                resolve({
                    alertasDocumentos,
                    alertasMantenimiento,
                    total
                });
            }, 300);
        });
    },
    
    /**
     * Renovar Documento (SOAT o RTM)
     * @param {number} idVehiculo - ID del vehículo
     * @param {string} tipoDocumento - 'SOAT' o 'RTM'
     * @param {string} nuevaFecha - Nueva fecha de vencimiento (YYYY-MM-DD)
     * @returns {Promise<Object>} Resultado de la operación
     */
    renovarDocumento: (idVehiculo, tipoDocumento, nuevaFecha) => {
        return new Promise((resolve) => {
            const vehiculos = getVehiculos();
            const index = vehiculos.findIndex(v => v.id_vehiculo === parseInt(idVehiculo));
            
            if (index === -1) {
                resolve({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
                return;
            }
            
            // Actualizar la fecha correspondiente
            if (tipoDocumento === 'SOAT') {
                vehiculos[index].vencimiento_soat = nuevaFecha;
            } else if (tipoDocumento === 'RTM') {
                vehiculos[index].vencimiento_rtm = nuevaFecha;
            }
            
            localStorage.setItem(VEHICULOS_KEY, JSON.stringify(vehiculos));
            
            resolve({
                success: true,
                message: `${tipoDocumento} renovado exitosamente. Nueva fecha: ${nuevaFecha}`
            });
        });
    },
    
    /**
     * Obtener contador de alertas (para mostrar en el sidebar)
     * @returns {Promise<number>} Total de alertas activas
     */
    obtenerTotalAlertas: async () => {
        const alertas = await notificacionService.obtenerAlertas();
        return alertas.total;
    },
    
    /**
     * Verificar si hay alertas activas
     * @returns {Promise<boolean>} True si hay al menos una alerta
     */
    hayAlertas: async () => {
        const total = await notificacionService.obtenerTotalAlertas();
        return total > 0;
    },
    
    /**
     * Obtener resumen de alertas por vehiculo
     * @returns {Promise<Array>} Resumen por vehículo
     */
    obtenerResumenPorVehiculo: async () => {
        const alertas = await notificacionService.obtenerAlertas();
        const userId = getCurrentUserId();
        const vehiculos = getVehiculos();
        const misVehiculos = vehiculos.filter(v => v.id_usuario === userId);
        
        const resumen = misVehiculos.map(vehiculo => {
            const alertasDoc = alertas.alertasDocumentos.filter(a => a.id_vehiculo === vehiculo.id_vehiculo);
            const alertasMant = alertas.alertasMantenimiento.filter(a => a.id_vehiculo === vehiculo.id_vehiculo);
            
            return {
                id_vehiculo: vehiculo.id_vehiculo,
                placa: vehiculo.placa,
                totalAlertas: alertasDoc.length + alertasMant.length,
                alertasDocumentos: alertasDoc.length,
                alertasMantenimiento: alertasMant.length
            };
        });
        
        return resumen;
    }
};

export default notificacionService;