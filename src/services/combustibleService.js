/**
 * combustibleService.js - Servicio de gestión de combustible
 * 
 * Este archivo maneja todas las operaciones relacionadas con combustible:
 * - Listar registros de combustible de un vehículo
 * - Agregar nuevo registro de combustible
 * - Editar registro existente
 * - Eliminar registro
 * - Calcular eficiencia (km por galón)
 * 
 * Por ahora: Usa localStorage (simula una base de datos)
 */

// Constantes y configuración 

// Clave para guardar la lista de combustible en localStorage
const COMBUSTIBLE_KEY = 'vehitrack_combustible';

// Clave para obtener los vehículos (necesario para calcular kilometraje recorrido)
const VEHICULOS_KEY = 'vehitrack_vehiculos';

// Funciones privadas

/**
 * Inicializa la base de datos de combustible con datos de ejemplo
 * Solo se ejecuta la primera vez que se usa la aplicación
 */
const initCombustible = () => {
    const combustible = localStorage.getItem(COMBUSTIBLE_KEY);
    if (!combustible) {
        const defaultCombustible = [
            {
                id_gasto_combustible: 1,
                id_vehiculo: 1,  // Toyota Corolla (id=1)
                fecha: '2024-01-15',
                cantidad: 15.5,
                costo: 45000,
                kilometraje: 25000,
                kilometraje_recorrido: 0,  // Calculado automáticamente
                eficiencia: 0               // Calculado automáticamente
            },
        ];
        localStorage.setItem(COMBUSTIBLE_KEY, JSON.stringify(defaultCombustible));
    }
};


/**
 * Obtiene todos los registros de combustible
 * @returns {Array} Lista completa de registros
 */
const getCombustible = () => {
    initCombustible();
    return JSON.parse(localStorage.getItem(COMBUSTIBLE_KEY));
};

/**
 * Guarda la lista actualizada de combustible en localStorage
 * @param {Array} combustible - Lista de registros a guardar
 */
const saveCombustible = (combustible) => {
    localStorage.setItem(COMBUSTIBLE_KEY, JSON.stringify(combustible));
};

/**
 * Obtiene todos los vehículos (para calcular kilometraje recorrido)
 * @returns {Array} Lista de vehículos
 */
const getVehiculos = () => {
    const vehiculos = localStorage.getItem(VEHICULOS_KEY);
    return vehiculos ? JSON.parse(vehiculos) : [];
};

/**
 * Calcula el kilometraje recorrido y la eficiencia para un nuevo registro
 * @param {number} idVehiculo - ID del vehículo
 * @param {number} kmActual - Kilometraje actual del nuevo registro
 * @param {number} cantidad - Cantidad de galones/litros cargados
 * @returns {Object} Objeto con kilometraje_recorrido y eficiencia
 */
const calcularEficiencia = (idVehiculo, kmActual, cantidad) => {
    // Obtener el registro anterior más reciente del mismo vehículo
    const todos = getCombustible();
    const registrosVehiculo = todos
        .filter(c => c.id_vehiculo === idVehiculo)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    let kilometraje_recorrido = 0;
    let eficiencia = 0;
    
    if (registrosVehiculo.length > 0) {
        const ultimoRegistro = registrosVehiculo[0];
        kilometraje_recorrido = kmActual - ultimoRegistro.kilometraje;
        
        // Calcular eficiencia (km por galón/litro)
        if (cantidad > 0 && kilometraje_recorrido > 0) {
            eficiencia = kilometraje_recorrido / cantidad;
        }
    }
    
    return { kilometraje_recorrido, eficiencia };
};

// Funciones publicas

const combustibleService = {
    /**
     * Listar registros por vehiculo
     * @param {number} idVehiculo - ID del vehículo
     * @returns {Array} Lista de registros de combustible del vehículo
     */
    listarPorVehiculo: (idVehiculo) => {
        return new Promise((resolve) => {
            const todos = getCombustible();
            // Filtrar por vehículo y ordenar por fecha descendente
            const filtrados = todos
                .filter(c => c.id_vehiculo === parseInt(idVehiculo))
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            setTimeout(() => {
                resolve(filtrados);
            }, 300);  // Simular delay de red
        });
    },

    /**
     * Agregar nuevo registro de combustible
     * @param {Object} registro - Datos del nuevo registro
     * @returns {Object} Resultado de la operación
     */
    agregar: (registro) => {
        return new Promise((resolve) => {
            const todos = getCombustible();
            const vehiculos = getVehiculos();
            
            // Verificar que el vehículo existe
            const vehiculo = vehiculos.find(v => v.id_vehiculo === parseInt(registro.id_vehiculo));
            if (!vehiculo) {
                resolve({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
                return;
            }
            
            // Calcular eficiencia basada en el registro anterior
            const { kilometraje_recorrido, eficiencia } = calcularEficiencia(
                registro.id_vehiculo,
                registro.kilometraje,
                registro.cantidad
            );
            
            // Generar nuevo ID
            const nuevoId = todos.length > 0 
                ? Math.max(...todos.map(c => c.id_gasto_combustible)) + 1 
                : 1;
            
            // Crear nuevo registro
            const nuevoRegistro = {
                id_gasto_combustible: nuevoId,
                id_vehiculo: parseInt(registro.id_vehiculo),
                fecha: registro.fecha,
                cantidad: parseFloat(registro.cantidad),
                costo: parseFloat(registro.costo),
                kilometraje: parseInt(registro.kilometraje),
                kilometraje_recorrido: kilometraje_recorrido,
                eficiencia: parseFloat(eficiencia.toFixed(2))
            };
            
            todos.push(nuevoRegistro);
            saveCombustible(todos);
            
            // Actualizar el kilometraje actual del vehículo en vehiculoService
            const indexVehiculo = vehiculos.findIndex(v => v.id_vehiculo === parseInt(registro.id_vehiculo));
            if (indexVehiculo !== -1) {
                vehiculos[indexVehiculo].kilometraje_actual = parseInt(registro.kilometraje);
                localStorage.setItem(VEHICULOS_KEY, JSON.stringify(vehiculos));
            }
            
            resolve({
                success: true,
                message: 'Registro de combustible agregado exitosamente',
                registro: nuevoRegistro
            });
        });
    },

    /**
     * Editar registro de combustible existente
     * @param {number} id - ID del registro a editar
     * @param {Object} datosActualizados - Nuevos datos
     * @returns {Object} Resultado de la operación
     */
    editar: (id, datosActualizados) => {
        return new Promise((resolve) => {
            const todos = getCombustible();
            const index = todos.findIndex(c => c.id_gasto_combustible === parseInt(id));
            
            if (index === -1) {
                resolve({
                    success: false,
                    message: 'Registro no encontrado'
                });
                return;
            }
            
            // Recalcular eficiencia basada en este registro y el anterior
            const { kilometraje_recorrido, eficiencia } = calcularEficiencia(
                datosActualizados.id_vehiculo,
                datosActualizados.kilometraje,
                datosActualizados.cantidad
            );
            
            // Actualizar registro
            todos[index] = {
                ...todos[index],
                fecha: datosActualizados.fecha,
                cantidad: parseFloat(datosActualizados.cantidad),
                costo: parseFloat(datosActualizados.costo),
                kilometraje: parseInt(datosActualizados.kilometraje),
                kilometraje_recorrido: kilometraje_recorrido,
                eficiencia: parseFloat(eficiencia.toFixed(2))
            };
            
            saveCombustible(todos);
            
            resolve({
                success: true,
                message: 'Registro actualizado exitosamente'
            });
        });
    },

    /**
     * Eliminar registro de combustible
     * @param {number} id - ID del registro a eliminar
     * @returns {Object} Resultado de la operación
     */
    eliminar: (id) => {
        return new Promise((resolve) => {
            const todos = getCombustible();
            const registroExistente = todos.find(c => c.id_gasto_combustible === parseInt(id));
            
            if (!registroExistente) {
                resolve({
                    success: false,
                    message: 'Registro no encontrado'
                });
                return;
            }
            
            const nuevosRegistros = todos.filter(c => c.id_gasto_combustible !== parseInt(id));
            saveCombustible(nuevosRegistros);
            
            resolve({
                success: true,
                message: 'Registro eliminado exitosamente'
            });
        });
    },

    /**
     * Obtener estadisticas de combustible por vehiculo
     * @param {number} idVehiculo - ID del vehículo
     * @returns {Object} Estadísticas (total gastado, promedio, etc.)
     */
    obtenerEstadisticas: async (idVehiculo) => {
        const registros = await combustibleService.listarPorVehiculo(idVehiculo);
        
        if (registros.length === 0) {
            return {
                totalGastado: 0,
                totalGalones: 0,
                promedioEficiencia: 0,
                ultimoRegistro: null
            };
        }
        
        const totalGastado = registros.reduce((sum, r) => sum + r.costo, 0);
        const totalGalones = registros.reduce((sum, r) => sum + r.cantidad, 0);
        const eficienciasValidas = registros.filter(r => r.eficiencia > 0).map(r => r.eficiencia);
        const promedioEficiencia = eficienciasValidas.length > 0 
            ? eficienciasValidas.reduce((a, b) => a + b, 0) / eficienciasValidas.length 
            : 0;
        
        return {
            totalGastado: totalGastado,
            totalGalones: totalGalones,
            promedioEficiencia: parseFloat(promedioEficiencia.toFixed(2)),
            ultimoRegistro: registros[0]
        };
    }
};

export default combustibleService;