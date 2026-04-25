/**
 * favoritoService.js - Servicio de gestión de talleres favoritos
 * 
 * Este archivo maneja:
 * - Listar talleres favoritos del usuario
 * - Agregar taller a favoritos
 * - Eliminar taller de favoritos
 * - Verificar si un taller está en favoritos
 * 
 * Se usa localStorage (simula una base de datos)
 */

// Constantes y configuracion

const FAVORITOS_KEY = 'vehitrack_favoritos';
const CURRENT_USER_KEY = 'vehitrack_current_user';

// Lista de talleres disponibles (para simular)
const TALLERES_DISPONIBLES = [
    { id: 1, nombre: "Taller Mecánico El Roble", lat: 6.2081, lng: -75.5675, direccion: "Calle 50 # 20-30, Barrio El Poblado" },
    { id: 2, nombre: "AutoServicio La 80", lat: 6.2501, lng: -75.5908, direccion: "Calle 80 # 45-12, Barrio Laureles" },
    { id: 3, nombre: "Taller Diesel Express", lat: 6.1802, lng: -75.6123, direccion: "Carrera 52 # 34-56, Barrio Belén" },
    { id: 4, nombre: "Lubricentro Rápido", lat: 6.2901, lng: -75.5456, direccion: "Calle 10 # 25-40, Barrio Manrique" },
    { id: 5, nombre: "Taller Especializado Honda", lat: 6.1974, lng: -75.5724, direccion: "Carrera 43A # 15-78, Barrio El Poblado" },
];

// Funciones privada

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
 * Inicializa la base de datos de favoritos con datos de ejemplo
 */
const initFavoritos = () => {
    const favoritos = localStorage.getItem(FAVORITOS_KEY);
    if (!favoritos) {
        const defaultFavoritos = [
            {
                id_favorito: 1,
                id_usuario: 1,  // Admin
                nombre_taller: "Taller Mecánico El Roble",
                latitud: 6.2081,
                longitud: -75.5675,
                direccion: "Calle 50 # 20-30, Barrio El Poblado"
            },
        ];
        localStorage.setItem(FAVORITOS_KEY, JSON.stringify(defaultFavoritos));
    }
};

/**
 * Obtiene todos los favoritos
 * @returns {Array} Lista completa de favoritos
 */
const getFavoritos = () => {
    initFavoritos();
    return JSON.parse(localStorage.getItem(FAVORITOS_KEY));
};

/**
 * Guarda la lista actualizada de favoritos en localStorage
 * @param {Array} favoritos - Lista de favoritos a guardar
 */
const saveFavoritos = (favoritos) => {
    localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
};

// Funciones publica

const favoritoService = {
    /**
     * Listar favoritos del usuario actual
     * @returns {Promise<Array>} Lista de talleres favoritos del usuario
     */
    listarPorUsuario: () => {
        return new Promise((resolve) => {
            const userId = getCurrentUserId();
            const todos = getFavoritos();
            const misFavoritos = todos.filter(f => f.id_usuario === userId);
            
            setTimeout(() => {
                resolve(misFavoritos);
            }, 300);
        });
    },

    /**
     * Agregar taller a favoritos
     * @param {Object} taller - Datos del taller a agregar
     * @returns {Promise<Object>} Resultado de la operación
     */
    agregar: (taller) => {
        return new Promise((resolve) => {
            const userId = getCurrentUserId();
            const todos = getFavoritos();
            
            // Verificar si ya está en favoritos
            const yaExiste = todos.some(f => 
                f.id_usuario === userId && 
                f.nombre_taller === taller.nombre
            );
            
            if (yaExiste) {
                resolve({
                    success: false,
                    message: 'Este taller ya está en tus favoritos'
                });
                return;
            }
            
            // Generar nuevo ID
            const nuevoId = todos.length > 0 
                ? Math.max(...todos.map(f => f.id_favorito)) + 1 
                : 1;
            
            // Crear nuevo favorito
            const nuevoFavorito = {
                id_favorito: nuevoId,
                id_usuario: userId,
                nombre_taller: taller.nombre,
                latitud: taller.lat,
                longitud: taller.lng,
                direccion: taller.direccion
            };
            
            todos.push(nuevoFavorito);
            saveFavoritos(todos);
            
            resolve({
                success: true,
                message: 'Taller agregado a favoritos',
                favorito: nuevoFavorito
            });
        });
    },

    /**
     * Eliminar taller de favoritos
     * @param {number} idFavorito - ID del favorito a eliminar
     * @returns {Promise<Object>} Resultado de la operación
     */
    eliminar: (idFavorito) => {
        return new Promise((resolve) => {
            const todos = getFavoritos();
            const existe = todos.find(f => f.id_favorito === parseInt(idFavorito));
            
            if (!existe) {
                resolve({
                    success: false,
                    message: 'Favorito no encontrado'
                });
                return;
            }
            
            const nuevos = todos.filter(f => f.id_favorito !== parseInt(idFavorito));
            saveFavoritos(nuevos);
            
            resolve({
                success: true,
                message: 'Taller eliminado de favoritos'
            });
        });
    },

    /**
     * Verificar si un taller esta en favoritos
     * @param {string} nombreTaller - Nombre del taller
     * @returns {Promise<boolean>} True si está en favoritos
     */
    esFavorito: async (nombreTaller) => {
        const favoritos = await favoritoService.listarPorUsuario();
        return favoritos.some(f => f.nombre_taller === nombreTaller);
    },

    /**
     * Obtener ID de favorito por nombre
     * @param {string} nombreTaller - Nombre del taller
     * @returns {Promise<number|null>} ID del favorito o null
     */
    obtenerIdPorNombre: async (nombreTaller) => {
        const favoritos = await favoritoService.listarPorUsuario();
        const favorito = favoritos.find(f => f.nombre_taller === nombreTaller);
        return favorito ? favorito.id_favorito : null;
    },

    /**
     * Obtener lista de talleres disponibles(para agregar a favoritos)
     * @returns {Array} Lista de talleres disponibles
     */
    obtenerTalleresDisponibles: () => {
        return TALLERES_DISPONIBLES;
    }
};

export default favoritoService;