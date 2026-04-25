/**
 * authService.js - Servicio de Autenticación
 * 
 * Este archivo maneja toda la lógica relacionada con:
 * - Login de usuarios
 * - Registro de nuevos usuarios
 * - Gestión de sesión (localStorage)
 * - Verificación de autenticación
 * 
 * IMPORTANTE: Por ahora usa localStorage (simula una base de datos)
 * Más adelante se conecta a un backend real (Java/NetBeans)
 */

// Constantes y configuracion

// Clave para guardar la lista de usuarios en localStorage
const USERS_KEY = 'vehitrack_usuarios';

// Clave para guardar el usuario actualmente logueado
const CURRENT_USER_KEY = 'vehitrack_current_user';


// Funciones privadas (solo se usan dentro de este servicio)


/**
 * Inicializa la base de datos de usuarios con un usuario de ejemplo
 * Solo se ejecuta la primera vez que se usa la aplicación
 */
const initUsers = () => {
    // Obtener los usuarios guardados en localStorage
    const users = localStorage.getItem(USERS_KEY);
    
    // Si no hay usuarios, se creo uno de ejemplo
    if (!users) {
        const defaultUsers = [
            {
                id: 1,                           // ID único del usuario
                nombre: 'Admin',                 // Nombre
                apellido: 'Sistema',             // Apellido
                email: 'admin@vehitrack.com',    // Correo electrónico
                password: '123456'               // Contraseña (sin encriptar por ahora)
            }
        ];
        // Guardar el usuario de ejemplo en localStorage
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
};

/**
 * Obtiene todos los usuarios registrados
 * @returns {Array} Lista de usuarios
 */
const getUsers = () => {
    initUsers(); // Asegurar que hay usuarios iniciales
    return JSON.parse(localStorage.getItem(USERS_KEY));
};

/**
 * Guarda la lista actualizada de usuarios en localStorage
 * @param {Array} users - Lista de usuarios a guardar
 */
const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Funciones publicas(las que usan los componentesp)

const authService = {
    /**
     * Iniciar seccion (Login)
     * @param {string} email - Correo electrónico del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise} Retorna un objeto con success, message y usuario
     * 
     * Ejemplo de uso:
     * const resultado = await authService.login('admin@vehitrack.com', '123456');
     * if (resultado.success) {
     *     console.log('Login exitoso', resultado.usuario);
     * }
     */
    login: (email, password) => {
        // Retornamos una Promise porque simulamos una llamada asíncrona a un servidor
        return new Promise((resolve) => {
            // Obtener todos los usuarios registrados
            const users = getUsers();
            
            // Buscar usuario que coincida con email y contraseña
            const user = users.find(u => u.email === email && u.password === password);
            
            // Simulamos un pequeño retraso de red (500ms) para que se sienta real
            setTimeout(() => {
                if (user) {
                    // Login exitoso
                    // Creamos una copia del usuario SIN la contraseña (por seguridad)
                    const { password, ...userWithoutPassword } = user;
                    
                    resolve({
                        success: true,                    // Indica que fue exitoso
                        message: 'Login exitoso',         // Mensaje para el usuario
                        usuario: userWithoutPassword     // Datos del usuario (sin password)
                    });
                } else {
                    // Login fallido
                    resolve({
                        success: false,
                        message: 'Correo o contraseña incorrectos'
                    });
                }
            }, 500); // 500 milisegundos de delay simulado
        });
    },

    /**
     * Registrar nuevo usuario
     * @param {Object} userData - Datos del nuevo usuario
     * @param {string} userData.nombre - Nombre del usuario
     * @param {string} userData.apellido - Apellido del usuario
     * @param {string} userData.email - Correo electrónico
     * @param {string} userData.password - Contraseña
     * @returns {Promise} Retorna éxito o error del registro
     */
    register: (userData) => {
        return new Promise((resolve) => {
            // Obtener usuarios existentes
            const users = getUsers();
            
            // Verificar si el email ya está registrado (no puede haber duplicados)
            const emailExists = users.some(u => u.email === userData.email);
            
            if (emailExists) {
                // El email ya existe, no se puede registrar
                resolve({
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                });
                return;
            }
            
            // Crear nuevo usuario con un ID automático
            const newUser = {
                id: users.length + 1,           // ID = cantidad actual + 1
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.email,
                password: userData.password      // Guardamos la contraseña (más adelante se encripta)
            };
            
            // Agregar el nuevo usuario a la lista
            users.push(newUser);
            
            // Guardar la lista actualizada en localStorage
            saveUsers(users);
            
            // Retornar éxito
            resolve({
                success: true,
                message: 'Usuario registrado exitosamente'
            });
        });
    },

    /**
     * Guardar usuario logueado (Sesión activa)
     * @param {Object} user - Datos del usuario (sin contraseña)
     * 
     * Esta función se llama después de un login exitoso
     * para recordar que el usuario está logueado
     */
    setCurrentUser: (user) => {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    },

    /**
     * Obtener usuario actualmente logueado
     * @returns {Object|null} Datos del usuario o null si no hay sesión
     * 
     * Útil para mostrar el nombre del usuario en el panel
     */
    getCurrentUser: () => {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    /**
     * Cerrar sección(LOGOUT)
     * Elimina al usuario actual de localStorage
     */
    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    /**
     * Verificar si hay una sesion activa
     * @returns {boolean} true si hay usuario logueado, false si no
     * 
     * Útil para proteger rutas (no dejar entrar sin login)
     */
    isAuthenticated: () => {
        return localStorage.getItem(CURRENT_USER_KEY) !== null;
    }
};

// Exportar el servicio para otros componentes
export default authService;