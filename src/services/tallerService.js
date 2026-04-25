/**
 * tallerService.js - Servicio de gestión de talleres
 * 
 * Este archivo maneja:
 * - Lista de talleres cercanos (simulados)
 * - Búsqueda de talleres por ciudad/ubicación
 * - Información de contacto y servicios de cada taller
 * 
 * POR AHORA: Datos estáticos simulados
 * DESPUÉS: Se conectará a una API real de mapas o backend
 */

// Los datos de los talleres son simulados

 
const talleresData = [
    {
        id: 1,
        nombre: "Taller Mecánico El Roble",
        direccion: "Calle 50 # 20-30, Barrio El Poblado",
        ciudad: "Medellín",
        telefono: "(604) 123-4567",
        email: "contacto@elroble.com",
        servicios: ["Mecánica General", "Frenos", "Suspensión", "Alineación"],
        lat: 6.2081,
        lng: -75.5675,
        calificacion: 4.5,
        horario: "Lun-Vie: 8am-6pm, Sáb: 8am-1pm"
    },
    {
        id: 2,
        nombre: "AutoServicio La 80",
        direccion: "Calle 80 # 45-12, Barrio Laureles",
        ciudad: "Medellín",
        telefono: "(604) 234-5678",
        email: "servicio@las80.com",
        servicios: ["Cambio de Aceite", "Llantas", "Diagnóstico Electrónico", "Aire Acondicionado"],
        lat: 6.2501,
        lng: -75.5908,
        calificacion: 4.2,
        horario: "Lun-Sáb: 7am-7pm"
    },
    {
        id: 3,
        nombre: "Taller Diesel Express",
        direccion: "Carrera 52 # 34-56, Barrio Belén",
        ciudad: "Medellín",
        telefono: "(604) 345-6789",
        email: "diesel@express.com",
        servicios: ["Motores Diesel", "Inyección Electrónica", "Turbo", "Escáner"],
        lat: 6.1802,
        lng: -75.6123,
        calificacion: 4.7,
        horario: "Lun-Vie: 8am-7pm, Sáb: 8am-3pm"
    },
    {
        id: 4,
        nombre: "Lubricentro Rápido",
        direccion: "Calle 10 # 25-40, Barrio Manrique",
        ciudad: "Medellín",
        telefono: "(604) 456-7890",
        email: "lubricentro@rapido.com",
        servicios: ["Cambio de Aceite", "Filtros", "Lubricación", "Revisión Preventiva"],
        lat: 6.2901,
        lng: -75.5456,
        calificacion: 4.0,
        horario: "Lun-Dom: 8am-8pm"
    },
];

// Funciones Publicas

const tallerService = {
    /**
     * OBTENER TODOS LOS TALLERES
     * @returns {Promise<Array>} Lista completa de talleres
     */
    obtenerTodos: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...talleresData]);
            }, 300);
        });
    },

    /**
     * Obtener taller por ID
     * @param {number} id - ID del taller
     * @returns {Promise<Object|null>} Taller encontrado o null
     */
    obtenerPorId: (id) => {
        return new Promise((resolve) => {
            const taller = talleresData.find(t => t.id === parseInt(id));
            setTimeout(() => {
                resolve(taller || null);
            }, 200);
        });
    },

    /**
     * Buscar talleres por ciudad
     * @param {string} ciudad - Nombre de la ciudad
     * @returns {Promise<Array>} Lista de talleres en esa ciudad
     */
    buscarPorCiudad: (ciudad) => {
        return new Promise((resolve) => {
            const filtrados = talleresData.filter(t => 
                t.ciudad.toLowerCase().includes(ciudad.toLowerCase())
            );
            setTimeout(() => {
                resolve(filtrados);
            }, 200);
        });
    },

    /**
     * Buscar talleres por servicio
     * @param {string} servicio - Nombre del servicio
     * @returns {Promise<Array>} Lista de talleres que ofrecen el servicio
     */
    buscarPorServicio: (servicio) => {
        return new Promise((resolve) => {
            const filtrados = talleresData.filter(t =>
                t.servicios.some(s => s.toLowerCase().includes(servicio.toLowerCase()))
            );
            setTimeout(() => {
                resolve(filtrados);
            }, 200);
        });
    },

    /**
     * Obtener servicios unicos
     * @returns {Promise<Array>} Lista de todos los servicios disponibles
     */
    obtenerServiciosUnicos: () => {
        return new Promise((resolve) => {
            const todosServicios = talleresData.flatMap(t => t.servicios);
            const serviciosUnicos = [...new Set(todosServicios)];
            serviciosUnicos.sort();
            setTimeout(() => {
                resolve(serviciosUnicos);
            }, 200);
        });
    },

    /**
     * Obtener ciudades
     * @returns {Promise<Array>} Lista de ciudades disponibles
     */
    obtenerCiudadesUnicas: () => {
        return new Promise((resolve) => {
            const ciudades = [...new Set(talleresData.map(t => t.ciudad))];
            ciudades.sort();
            setTimeout(() => {
                resolve(ciudades);
            }, 200);
        });
    },

    /**
     * Obtener coordenadas
     * @param {string} ciudad - Nombre de la ciudad
     * @returns {Object} Coordenadas {lat, lng}
     */
    obtenerCentroCiudad: (ciudad) => {
        // Coordenadas de referencia para Medellín
        const centros = {
            "Medellín": { lat: 6.2476, lng: -75.5658 },
            "Bogotá": { lat: 4.7110, lng: -74.0721 },
            "Cali": { lat: 3.4516, lng: -76.5320 },
            "Barranquilla": { lat: 10.9639, lng: -74.7964 },
            "Cartagena": { lat: 10.3910, lng: -75.4794 }
        };
        return centros[ciudad] || centros["Medellín"];
    }
};

export default tallerService;