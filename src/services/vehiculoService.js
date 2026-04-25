/**
 * vehiculoService.js - Servicio de gestión de vehículos
 * 
 * Este archivo maneja todas las operaciones relacionadas con vehículos:
 * - Listar vehículos del usuario logueado
 * - Agregar nuevo vehículo
 * - Editar vehículo existente
 * - Eliminar vehículo
 * - Obtener vehículo por ID
 * 
 * POR AHORA: Usa localStorage (simula una base de datos)
 */
// Constantes y configuración

// Clave para guardar la lista de vehículos en localStorage
const VEHICULOS_KEY = 'vehitrack_vehiculos';

// Clave para obtener el usuario actual (para filtrar vehículos por usuario)
const CURRENT_USER_KEY = 'vehitrack_current_user';
// FUNCIONES PRIVADA

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
 * Inicializa la base de datos de vehículos con datos de ejemplo
 * Solo se ejecuta la primera vez que se usa la aplicación
 */
const initVehiculos = () => {
    const vehiculos = localStorage.getItem(VEHICULOS_KEY);
    if (!vehiculos) {
        const defaultVehiculos = [
            {
                id_vehiculo: 1,
                id_usuario: 1,  // Admin (id=1)
                tipo: 'Carro',
                marca: 'Toyota',
                modelo: 'Corolla',
                anio: 2020,
                placa: 'ABC-123',
                kilometraje_actual: 25000,
                vencimiento_soat: '2025-12-31',
                vencimiento_rtm: '2025-06-30'
            },
            {
                id_vehiculo: 2,
                id_usuario: 1,  // Admin (id=1)
                tipo: 'Moto',
                marca: 'Yamaha',
                modelo: 'MT-03',
                anio: 2021,
                placa: 'XYZ-789',
                kilometraje_actual: 8000,
                vencimiento_soat: '2025-10-15',
                vencimiento_rtm: '2025-04-20'
            }
        ];
        localStorage.setItem(VEHICULOS_KEY, JSON.stringify(defaultVehiculos));
    }
};

/**
 * Obtiene todos los vehículos de la base de datos local
 * @returns {Array} Lista completa de vehículos
 */
const getVehiculos = () => {
    initVehiculos();  // Asegurar que hay datos iniciales
    return JSON.parse(localStorage.getItem(VEHICULOS_KEY));
};

/**
 * Guarda la lista actualizada de vehículos en localStorage
 * @param {Array} vehiculos - Lista de vehículos a guardar
 */
const saveVehiculos = (vehiculos) => {
    localStorage.setItem(VEHICULOS_KEY, JSON.stringify(vehiculos));
};
// FUNCIONES PÚBLICA

const vehiculoService = {
    /**
     * Listar vehiculos del usuario actual
     * Obtiene solo los vehículos que pertenecen al usuario logueado
     * @returns {Array} Lista de vehículos del usuario
     */
    listarPorUsuario: () => {
        return new Promise((resolve) => {
            const userId = getCurrentUserId();
            const allVehiculos = getVehiculos();
            
            // Filtrar vehículos por el ID del usuario actual
            const misVehiculos = allVehiculos.filter(v => v.id_usuario === userId);
            
            setTimeout(() => {
                resolve(misVehiculos);
            }, 300);  // Simular delay de red
        });
    },

    /**
     * Obtener vehiculo por ID
     * @param {number} id - ID del vehículo a buscar
     * @returns {Object|null} Vehículo encontrado o null
     */
    obtenerPorId: (id) => {
        return new Promise((resolve) => {
            const allVehiculos = getVehiculos();
            const vehiculo = allVehiculos.find(v => v.id_vehiculo === parseInt(id));
            
            setTimeout(() => {
                resolve(vehiculo || null);
            }, 300);
        });
    },

    /**
     * Agregar nuevo vehiculo
     * @param {Object} vehiculo - Datos del nuevo vehículo (sin id)
     * @returns {Object} Resultado de la operación
     */
    agregar: (vehiculo) => {
        return new Promise((resolve) => {
            const allVehiculos = getVehiculos();
            const userId = getCurrentUserId();
            
            // Verificar que la placa no exista para este usuario
            const placaExiste = allVehiculos.some(v => 
                v.placa === vehiculo.placa && v.id_usuario === userId
            );
            
            if (placaExiste) {
                resolve({
                    success: false,
                    message: 'Ya tienes un vehículo con esta placa registrado'
                });
                return;
            }
            
            // Generar nuevo ID (el mayor + 1)
            const nuevoId = allVehiculos.length > 0 
                ? Math.max(...allVehiculos.map(v => v.id_vehiculo)) + 1 
                : 1;
            
            // Crear nuevo vehículo con ID y usuario actual
            const nuevoVehiculo = {
                id_vehiculo: nuevoId,
                id_usuario: userId,
                tipo: vehiculo.tipo,
                marca: vehiculo.marca,
                modelo: vehiculo.modelo,
                anio: parseInt(vehiculo.anio),
                placa: vehiculo.placa.toUpperCase(),
                kilometraje_actual: parseInt(vehiculo.kilometraje_actual) || 0,
                vencimiento_soat: vehiculo.vencimiento_soat,
                vencimiento_rtm: vehiculo.vencimiento_rtm
            };
            
            allVehiculos.push(nuevoVehiculo);
            saveVehiculos(allVehiculos);
            
            resolve({
                success: true,
                message: 'Vehículo registrado exitosamente',
                vehiculo: nuevoVehiculo
            });
        });
    },

    /**
     * Editar vehiculo existente
     * @param {number} id - ID del vehículo a editar
     * @param {Object} datosActualizados - Nuevos datos del vehículo
     * @returns {Object} Resultado de la operación
     */
    editar: (id, datosActualizados) => {
        return new Promise((resolve) => {
            const allVehiculos = getVehiculos();
            const index = allVehiculos.findIndex(v => v.id_vehiculo === parseInt(id));
            
            if (index === -1) {
                resolve({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
                return;
            }
            
            // Verificar que la placa no exista en otro vehículo del mismo usuario
            const userId = getCurrentUserId();
            const placaExiste = allVehiculos.some(v => 
                v.placa === datosActualizados.placa.toUpperCase() && 
                v.id_usuario === userId && 
                v.id_vehiculo !== parseInt(id)
            );
            
            if (placaExiste) {
                resolve({
                    success: false,
                    message: 'Ya tienes otro vehículo con esta placa registrado'
                });
                return;
            }
            
            // Actualizar vehículo
            allVehiculos[index] = {
                ...allVehiculos[index],
                tipo: datosActualizados.tipo,
                marca: datosActualizados.marca,
                modelo: datosActualizados.modelo,
                anio: parseInt(datosActualizados.anio),
                placa: datosActualizados.placa.toUpperCase(),
                kilometraje_actual: parseInt(datosActualizados.kilometraje_actual) || 0,
                vencimiento_soat: datosActualizados.vencimiento_soat,
                vencimiento_rtm: datosActualizados.vencimiento_rtm
            };
            
            saveVehiculos(allVehiculos);
            
            resolve({
                success: true,
                message: 'Vehículo actualizado exitosamente'
            });
        });
    },

    /**
     * Eliminar vehiculo
     * @param {number} id - ID del vehículo a eliminar
     * @returns {Object} Resultado de la operación
     */
    eliminar: (id) => {
        return new Promise((resolve) => {
            const allVehiculos = getVehiculos();
            const vehiculoExistente = allVehiculos.find(v => v.id_vehiculo === parseInt(id));
            
            if (!vehiculoExistente) {
                resolve({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
                return;
            }
            
            const nuevosVehiculos = allVehiculos.filter(v => v.id_vehiculo !== parseInt(id));
            saveVehiculos(nuevosVehiculos);
            
            resolve({
                success: true,
                message: 'Vehículo eliminado exitosamente'
            });
        });
    },
    
    /**
     * Actualizar solo el kilometraje
     * @param {number} id - ID del vehículo
     * @param {number} nuevoKm - Nuevo kilometraje
     * @returns {Object} Resultado de la operación
     */
    actualizarKilometraje: (id, nuevoKm) => {
        return new Promise((resolve) => {
            const allVehiculos = getVehiculos();
            const index = allVehiculos.findIndex(v => v.id_vehiculo === parseInt(id));
            
            if (index === -1) {
                resolve({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
                return;
            }
            
            allVehiculos[index].kilometraje_actual = parseInt(nuevoKm);
            saveVehiculos(allVehiculos);
            
            resolve({
                success: true,
                message: 'Kilometraje actualizado exitosamente'
            });
        });
    }
};

export default vehiculoService;