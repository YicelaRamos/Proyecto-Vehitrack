/**
 * mantenimientoService.js - Servicio de gestión de mantenimientos
 * 
 * Este archivo maneja todas las operaciones relacionadas con mantenimientos:
 * - Listar mantenimientos de un vehículo
 * - Agregar nuevo mantenimiento (programado o realizado)
 * - Editar mantenimiento existente
 * - Eliminar mantenimiento
 * - Marcar mantenimiento como realizado
 * - Obtener alertas de mantenimientos pendientes
 */

// Constantes y configuración 

// Clave para guardar la lista de mantenimientos en localStorage
const MANTENIMIENTO_KEY = 'vehitrack_mantenimiento';

// Clave para obtener los vehículos
const VEHICULOS_KEY = 'vehitrack_vehiculos';

// Funciones privadas

// Inicializa la base de datos de mantenimientos con datos de ejemplo

const initMantenimiento = () => {
    const mantenimientos = localStorage.getItem(MANTENIMIENTO_KEY);
    if (!mantenimientos) {
        const defaultMantenimientos = [
            {
                id_mantenimiento: 1,
                id_vehiculo: 1,  // Toyota Corolla
                fecha_programada: '2024-03-15',
                fecha_realizacion: '2024-03-15',
                descripcion: 'Cambio de aceite y filtros',
                costo: 150000,
                kilometraje_mantenimiento: 25000,
                estado: 'REALIZADO'
            },
            {
                id_mantenimiento: 2,
                id_vehiculo: 1,  // Toyota Corolla
                fecha_programada: '2024-06-20',
                fecha_realizacion: null,
                descripcion: 'Rotación de llantas y alineación',
                costo: 80000,
                kilometraje_mantenimiento: 30000,
                estado: 'PENDIENTE'
            },
        ];
        localStorage.setItem(MANTENIMIENTO_KEY, JSON.stringify(defaultMantenimientos));
    }
};

/**
 * Obtiene todos los mantenimientos
 * @returns {Array} Lista completa de mantenimientos
 */
const getMantenimientos = () => {
    initMantenimiento();
    return JSON.parse(localStorage.getItem(MANTENIMIENTO_KEY));
};

/**
 * Guarda la lista actualizada de mantenimientos en localStorage
 * @param {Array} mantenimientos - Lista de mantenimientos a guardar
 */
const saveMantenimientos = (mantenimientos) => {
    localStorage.setItem(MANTENIMIENTO_KEY, JSON.stringify(mantenimientos));
};

/**
 * Obtiene todos los vehículos
 * @returns {Array} Lista de vehículos
 */
const getVehiculos = () => {
    const vehiculos = localStorage.getItem(VEHICULOS_KEY);
    return vehiculos ? JSON.parse(vehiculos) : [];
};

// Funciones publicas

const mantenimientoService = {
    /**
     * Listar mantenimiento por vehiculo
     * @param {number} idVehiculo - ID del vehículo
     * @returns {Array} Lista de mantenimientos del vehículo ordenados por fecha
     */
    listarPorVehiculo: (idVehiculo) => {
        return new Promise((resolve) => {
            const todos = getMantenimientos();
            const vehiculos = getVehiculos();
            
            // Filtrar por vehículo
            let filtrados = todos.filter(m => m.id_vehiculo === parseInt(idVehiculo));
            
            // Agregar información de la placa
            const vehiculo = vehiculos.find(v => v.id_vehiculo === parseInt(idVehiculo));
            filtrados = filtrados.map(m => ({
                ...m,
                placa: vehiculo ? vehiculo.placa : 'N/A'
            }));
            
            // Ordenar por fecha programada descendente
            filtrados.sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));
            
            setTimeout(() => {
                resolve(filtrados);
            }, 300);
        });
    },

    /**
     * Agregar nuevo mantenimiento
     * @param {Object} mantenimiento - Datos del nuevo mantenimiento
     * @returns {Object} Resultado de la operación
     */
    agregar: (mantenimiento) => {
        return new Promise((resolve) => {
            const todos = getMantenimientos();
            
            // Generar nuevo ID
            const nuevoId = todos.length > 0 
                ? Math.max(...todos.map(m => m.id_mantenimiento)) + 1 
                : 1;
            
            // Determinar estado basado en fecha_realizacion
            const estado = mantenimiento.fecha_realizacion ? 'REALIZADO' : 'PENDIENTE';
            
            // Crear nuevo mantenimiento
            const nuevoMantenimiento = {
                id_mantenimiento: nuevoId,
                id_vehiculo: parseInt(mantenimiento.id_vehiculo),
                fecha_programada: mantenimiento.fecha_programada,
                fecha_realizacion: mantenimiento.fecha_realizacion || null,
                descripcion: mantenimiento.descripcion,
                costo: parseFloat(mantenimiento.costo) || 0,
                kilometraje_mantenimiento: parseInt(mantenimiento.kilometraje_mantenimiento) || 0,
                estado: estado
            };
            
            todos.push(nuevoMantenimiento);
            saveMantenimientos(todos);
            
            resolve({
                success: true,
                message: 'Mantenimiento registrado exitosamente',
                mantenimiento: nuevoMantenimiento
            });
        });
    },

    /**
     * Editar mantenimiento existente
     * @param {number} id - ID del mantenimiento a editar
     * @param {Object} datosActualizados - Nuevos datos
     * @returns {Object} Resultado de la operación
     */
    editar: (id, datosActualizados) => {
        return new Promise((resolve) => {
            const todos = getMantenimientos();
            const index = todos.findIndex(m => m.id_mantenimiento === parseInt(id));
            
            if (index === -1) {
                resolve({
                    success: false,
                    message: 'Mantenimiento no encontrado'
                });
                return;
            }
            
            const estado = datosActualizados.fecha_realizacion ? 'REALIZADO' : 'PENDIENTE';
            
            todos[index] = {
                ...todos[index],
                fecha_programada: datosActualizados.fecha_programada,
                fecha_realizacion: datosActualizados.fecha_realizacion || null,
                descripcion: datosActualizados.descripcion,
                costo: parseFloat(datosActualizados.costo) || 0,
                kilometraje_mantenimiento: parseInt(datosActualizados.kilometraje_mantenimiento) || 0,
                estado: estado
            };
            
            saveMantenimientos(todos);
            
            resolve({
                success: true,
                message: 'Mantenimiento actualizado exitosamente'
            });
        });
    },

    /**
     * Eliminar mantenimiento
     * @param {number} id - ID del mantenimiento a eliminar
     * @returns {Object} Resultado de la operación
     */
    eliminar: (id) => {
        return new Promise((resolve) => {
            const todos = getMantenimientos();
            const existe = todos.find(m => m.id_mantenimiento === parseInt(id));
            
            if (!existe) {
                resolve({
                    success: false,
                    message: 'Mantenimiento no encontrado'
                });
                return;
            }
            
            const nuevos = todos.filter(m => m.id_mantenimiento !== parseInt(id));
            saveMantenimientos(nuevos);
            
            resolve({
                success: true,
                message: 'Mantenimiento eliminado exitosamente'
            });
        });
    },

    /**
     * Marcar mantenimiento como realizado
     * @param {number} id - ID del mantenimiento
     * @returns {Object} Resultado de la operación
     */
    marcarComoRealizado: (id) => {
        return new Promise((resolve) => {
            const todos = getMantenimientos();
            const index = todos.findIndex(m => m.id_mantenimiento === parseInt(id));
            
            if (index === -1) {
                resolve({
                    success: false,
                    message: 'Mantenimiento no encontrado'
                });
                return;
            }
            
            // Si ya está realizado, no hacer nada
            if (todos[index].fecha_realizacion) {
                resolve({
                    success: false,
                    message: 'Este mantenimiento ya está marcado como realizado'
                });
                return;
            }
            
            // Marcar como realizado con la fecha actual
            const hoy = new Date().toISOString().split('T')[0];
            todos[index].fecha_realizacion = hoy;
            todos[index].estado = 'REALIZADO';
            
            saveMantenimientos(todos);
            
            resolve({
                success: true,
                message: 'Mantenimiento marcado como realizado'
            });
        });
    },

    /**
     * Obtener alertas de mantenimiento pendientes
     * @param {number} idUsuario - ID del usuario
     * @returns {Array} Lista de mantenimientos pendientes con información del vehículo
     */
    obtenerAlertasPendientes: (idUsuario) => {
        return new Promise((resolve) => {
            const todos = getMantenimientos();
            const vehiculos = getVehiculos();
            
            // Filtrar vehículos del usuario
            const vehiculosUsuario = vehiculos.filter(v => v.id_usuario === idUsuario);
            const idsVehiculosUsuario = vehiculosUsuario.map(v => v.id_vehiculo);
            
            // Filtrar mantenimientos pendientes de esos vehículos
            const pendientes = todos.filter(m => 
                idsVehiculosUsuario.includes(m.id_vehiculo) && 
                !m.fecha_realizacion
            );
            
            // Agregar información de placa
            const alertas = pendientes.map(m => {
                const vehiculo = vehiculosUsuario.find(v => v.id_vehiculo === m.id_vehiculo);
                return {
                    ...m,
                    placa: vehiculo ? vehiculo.placa : 'N/A',
                    diasRestantes: Math.ceil((new Date(m.fecha_programada) - new Date()) / (1000 * 60 * 60 * 24))
                };
            });
            
            // Ordenar por fecha programada (más cercana primero)
            alertas.sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));
            
            setTimeout(() => {
                resolve(alertas);
            }, 300);
        });
    },
    
    /**
     * Obtener estadisticas de mantenimiento por vehiculo
     * @param {number} idVehiculo - ID del vehículo
     * @returns {Object} Estadísticas
     */
    obtenerEstadisticas: async (idVehiculo) => {
        const registros = await mantenimientoService.listarPorVehiculo(idVehiculo);
        
        const realizados = registros.filter(m => m.fecha_realizacion);
        const pendientes = registros.filter(m => !m.fecha_realizacion);
        const totalGastado = realizados.reduce((sum, m) => sum + m.costo, 0);
        
        return {
            total: registros.length,
            realizados: realizados.length,
            pendientes: pendientes.length,
            totalGastado: totalGastado
        };
    }
};

export default mantenimientoService;