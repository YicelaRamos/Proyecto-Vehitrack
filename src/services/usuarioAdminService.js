/**
 * usuarioAdminService.js - Servicio de gestión de usuarios (Administrador)
 * 
 * Este archivo maneja:
 * - Listar todos los usuarios
 * - Obtener usuario por ID
 * - Crear nuevo usuario
 * - Editar usuario existente
 * - Eliminar usuario
 * - Validar contraseña actual para cambios seguros
 * 
 * POR AHORA: Usa localStorage (simula una base de datos)
 * DESPUÉS: Se conectará a tu backend Java
 */

// Constantes y configuracion

const USERS_KEY = 'vehitrack_usuarios';
const CURRENT_USER_KEY = 'vehitrack_current_user';

// Funciones privadasS

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
 * Obtiene el rol del usuario actual
 * @returns {string} 'admin' o 'user'
 */
const getCurrentUserRole = () => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    if (user) {
        const usuario = JSON.parse(user);
        return usuario.rol || 'user';
    }
    return 'user';
};

/**
 * Inicializa la base de datos de usuarios con datos de ejemplo
 */
const initUsers = () => {
    const users = localStorage.getItem(USERS_KEY);
    if (!users) {
        const defaultUsers = [
            {
                id: 1,
                nombre: 'Admin',
                apellido: 'Sistema',
                email: 'admin@vehitrack.com',
                password: '123456',
                rol: 'admin'
            },
            {
                id: 2,
                nombre: 'Juan',
                apellido: 'Perez',
                email: 'juan@ejemplo.com',
                password: '123456',
                rol: 'user'
            },
            {
                id: 3,
                nombre: 'Maria',
                apellido: 'Gomez',
                email: 'maria@ejemplo.com',
                password: '123456',
                rol: 'user'
            }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
};

/**
 * Obtiene todos los usuarios
 * @returns {Array} Lista completa de usuarios
 */
const getUsers = () => {
    initUsers();
    return JSON.parse(localStorage.getItem(USERS_KEY));
};

/**
 * Guarda la lista actualizada de usuarios en localStorage
 * @param {Array} users - Lista de usuarios a guardar
 */
const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Verifica si una contraseña es correcta para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} password - Contraseña a verificar
 * @returns {boolean} True si la contraseña es correcta
 */
const verificarPassword = (userId, password) => {
    const users = getUsers();
    const user = users.find(u => u.id === parseInt(userId));
    return user && user.password === password;
};

// Funciones publicas

const usuarioAdminService = {
    /**
     * Verificar si el usuario actual es Admin
     * @returns {boolean} True si es administrador
     */
    esAdmin: () => {
        return getCurrentUserRole() === 'admin';
    },

    /**
     * Listar todos los usuarios
     * @returns {Promise<Array>} Lista de usuarios (sin contraseñas)
     */
    listarTodos: () => {
        return new Promise((resolve, reject) => {
            // Verificar permisos de administrador
            if (!usuarioAdminService.esAdmin()) {
                reject({ success: false, message: 'No tienes permisos de administrador' });
                return;
            }
            
            const users = getUsers();
            // Eliminar contraseñas por seguridad
            const usersSinPassword = users.map(({ password, ...user }) => user);
            
            setTimeout(() => {
                resolve(usersSinPassword);
            }, 300);
        });
    },

    /**
     * Obtener usuario por ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    obtenerPorId: (id) => {
        return new Promise((resolve, reject) => {
            if (!usuarioAdminService.esAdmin()) {
                reject({ success: false, message: 'No tienes permisos de administrador' });
                return;
            }
            
            const users = getUsers();
            const user = users.find(u => u.id === parseInt(id));
            if (user) {
                const { password, ...userSinPassword } = user;
                resolve(userSinPassword);
            } else {
                resolve(null);
            }
        });
    },

    /**
     * Crear nuevo usuario
     * @param {Object} usuario - Datos del nuevo usuario
     * @returns {Promise<Object>} Resultado de la operación
     */
    crear: (usuario) => {
        return new Promise((resolve, reject) => {
            if (!usuarioAdminService.esAdmin()) {
                reject({ success: false, message: 'No tienes permisos de administrador' });
                return;
            }
            
            const users = getUsers();
            
            // Verificar si el email ya existe
            const emailExiste = users.some(u => u.email === usuario.email);
            if (emailExiste) {
                resolve({
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                });
                return;
            }
            
            // Generar nuevo ID
            const nuevoId = users.length > 0 
                ? Math.max(...users.map(u => u.id)) + 1 
                : 1;
            
            // Crear nuevo usuario
            const nuevoUsuario = {
                id: nuevoId,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                password: usuario.password || '123456', // Contraseña por defecto
                rol: usuario.rol || 'user'
            };
            
            users.push(nuevoUsuario);
            saveUsers(users);
            
            const { password, ...usuarioCreado } = nuevoUsuario;
            resolve({
                success: true,
                message: 'Usuario creado exitosamente',
                usuario: usuarioCreado
            });
        });
    },

    /**
     * Editar usuario existente (con validación de contraseña actual)
     * @param {number} id - ID del usuario a editar
     * @param {Object} datos - Datos actualizados
     * @param {string} passwordActual - Contraseña actual del usuario logueado (para seguridad)
     * @returns {Promise<Object>} Resultado de la operación
     */
    editar: (id, datos, passwordActual) => {
        return new Promise((resolve, reject) => {
            if (!usuarioAdminService.esAdmin()) {
                reject({ success: false, message: 'No tienes permisos de administrador' });
                return;
            }
            
            const users = getUsers();
            const index = users.findIndex(u => u.id === parseInt(id));
            
            if (index === -1) {
                resolve({
                    success: false,
                    message: 'Usuario no encontrado'
                });
                return;
            }
            
            // Verificar contraseña actual (seguridad)
            const currentUserId = getCurrentUserId();
            if (!verificarPassword(currentUserId, passwordActual)) {
                resolve({
                    success: false,
                    message: 'Contraseña actual incorrecta. No se pueden guardar los cambios.'
                });
                return;
            }
            
            // Verificar si el nuevo email ya existe (si cambió)
            if (datos.email !== users[index].email) {
                const emailExiste = users.some(u => u.email === datos.email && u.id !== parseInt(id));
                if (emailExiste) {
                    resolve({
                        success: false,
                        message: 'El correo electrónico ya está registrado por otro usuario'
                    });
                    return;
                }
            }
            
            // Actualizar datos
            users[index].nombre = datos.nombre;
            users[index].apellido = datos.apellido;
            users[index].email = datos.email;
            
            // Actualizar contraseña si se proporcionó una nueva
            if (datos.nuevaPassword && datos.nuevaPassword.trim() !== '') {
                users[index].password = datos.nuevaPassword;
            }
            
            // Actualizar rol (solo si es admin editando)
            if (datos.rol) {
                users[index].rol = datos.rol;
            }
            
            saveUsers(users);
            
            const { password, ...usuarioEditado } = users[index];
            resolve({
                success: true,
                message: 'Usuario actualizado exitosamente',
                usuario: usuarioEditado
            });
        });
    },

    /**
     * Eliminar usuario
     * @param {number} id - ID del usuario a eliminar
     * @param {string} passwordActual - Contraseña actual del usuario logueado
     * @returns {Promise<Object>} Resultado de la operación
     */
    eliminar: (id, passwordActual) => {
        return new Promise((resolve, reject) => {
            if (!usuarioAdminService.esAdmin()) {
                reject({ success: false, message: 'No tienes permisos de administrador' });
                return;
            }
            
            const users = getUsers();
            const usuarioAEliminar = users.find(u => u.id === parseInt(id));
            
            if (!usuarioAEliminar) {
                resolve({
                    success: false,
                    message: 'Usuario no encontrado'
                });
                return;
            }
            
            // No permitir eliminar a sí mismo
            const currentUserId = getCurrentUserId();
            if (parseInt(id) === currentUserId) {
                resolve({
                    success: false,
                    message: 'No puedes eliminar tu propio usuario'
                });
                return;
            }
            
            // Verificar contraseña actual (seguridad)
            if (!verificarPassword(currentUserId, passwordActual)) {
                resolve({
                    success: false,
                    message: 'Contraseña actual incorrecta. No se puede eliminar el usuario.'
                });
                return;
            }
            
            const nuevosUsers = users.filter(u => u.id !== parseInt(id));
            saveUsers(nuevosUsers);
            
            resolve({
                success: true,
                message: `Usuario ${usuarioAEliminar.nombre} ${usuarioAEliminar.apellido} eliminado exitosamente`
            });
        });
    },

    /**
     * Validar contraseña actual
     * @param {string} password - Contraseña a verificar
     * @returns {Promise<boolean>} True si es correcta
     */
    validarPasswordActual: async (password) => {
        const currentUserId = getCurrentUserId();
        return verificarPassword(currentUserId, password);
    }
};

export default usuarioAdminService;