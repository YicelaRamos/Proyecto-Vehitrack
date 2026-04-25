/**
 * ListaUsuarios.jsx - Gestión de usuarios del sistema (solo administradores)
 *
 * Muestra la lista completa de usuarios registrados con opciones para editar
 * y eliminar. Ambas acciones requieren que el admin confirme su contraseña actual.
 * Si el usuario no tiene rol 'admin', se bloquea el acceso con pantalla de error.
 *
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usuarioAdminService from '../../services/usuarioAdminService';
import authService from '../../services/authService';
import './ListaUsuarios.css';

const ListaUsuarios = () => {

    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();  // Usuario logueado (el admin)

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [modalConfirmAbierto, setModalConfirmAbierto] = useState(false);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
    const [passwordActual, setPasswordActual] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [esAdmin, setEsAdmin] = useState(false);

    // Al montar el componente, verificamos si el usuario es admin.
    // Si lo es, cargamos la lista de usuarios. Si no, mostramos mensaje de error.
    useEffect(() => {
        const admin = usuarioAdminService.esAdmin();
        setEsAdmin(admin);

        if (admin) {
            cargarUsuarios();
        } else {
            setLoading(false);
            setMensaje({ texto: 'No tienes permisos de administrador para acceder a esta página', tipo: 'error' });
        }
    }, []);

    // Efecto para que los mensajes de éxito/error desaparezcan solos a los 3 segundos.
    // Así no se acumulan y la interfaz se ve limpia.
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            const lista = await usuarioAdminService.listarTodos();
            setUsuarios(lista);
        } catch (error) {
            setMensaje({ texto: error.message || 'Error cargando usuarios', tipo: 'error' });
        }
        setLoading(false);
    };

    // Abre el modal de edición y resetea los campos de contraseña.
    const abrirModalEditar = (usuario) => {
        setUsuarioEditando(usuario);
        setPasswordActual('');
        setNuevaPassword('');
        setConfirmPassword('');
        setErrorPassword('');
        setModalEditarAbierto(true);
    };

    // Validación antes de guardar la edición:
    // - La contraseña actual debe estar presente (obligatoria por seguridad)
    // - Si se ingresó una nueva contraseña, debe coincidir con su confirmación
    const validarPassword = () => {
        if (!passwordActual.trim()) {
            setErrorPassword('Debes ingresar tu contraseña actual para guardar cambios');
            return false;
        }
        if (nuevaPassword && nuevaPassword !== confirmPassword) {
            setErrorPassword('Las nuevas contraseñas no coinciden');
            return false;
        }
        setErrorPassword('');
        return true;
    };

    // Guarda los cambios del usuario editado.
    // ⚠️ Ojo: se usa getElementById para leer los valores. Esto funciona pero no es lo ideal en React.
    // Sería mejor tener un estado para esos campos. Por ahora se deja así por simplicidad.
    const handleGuardarUsuario = async () => {
        if (!validarPassword()) return;

        // Lectura directa del DOM (no recomendado en React, pero funcional para este ejemplo)
        const datosActualizados = {
            nombre: document.getElementById('editNombre').value,
            apellido: document.getElementById('editApellido').value,
            email: document.getElementById('editEmail').value,
            rol: document.getElementById('editRol').value,
            nuevaPassword: nuevaPassword
        };

        try {
            const result = await usuarioAdminService.editar(
                usuarioEditando.id,
                datosActualizados,
                passwordActual
            );
            if (result.success) {
                setMensaje({ texto: result.message, tipo: 'success' });
                setModalEditarAbierto(false);
                cargarUsuarios();   // Recarga la tabla para reflejar los cambios
            } else {
                setMensaje({ texto: result.message, tipo: 'error' });
            }
        } catch (error) {
            setMensaje({ texto: error.message || 'Error al guardar cambios', tipo: 'error' });
        }
    };

    // Prepara la eliminación: abre el modal de confirmación y limpia la contraseña
    const confirmarEliminar = (usuario) => {
        setUsuarioAEliminar(usuario);
        setPasswordActual('');
        setModalConfirmAbierto(true);
    };

    const handleEliminarUsuario = async () => {
        // Si no ingresó contraseña, mostramos error y cerramos el modal
        if (!passwordActual.trim()) {
            setMensaje({ texto: 'Debes ingresar tu contraseña actual para eliminar un usuario', tipo: 'error' });
            setModalConfirmAbierto(false);
            return;
        }

        try {
            const result = await usuarioAdminService.eliminar(usuarioAEliminar.id, passwordActual);
            if (result.success) {
                setMensaje({ texto: result.message, tipo: 'success' });
                cargarUsuarios();   // Actualiza la lista
            } else {
                setMensaje({ texto: result.message, tipo: 'error' });
            }
        } catch (error) {
            setMensaje({ texto: error.message || 'Error al eliminar usuario', tipo: 'error' });
        }

        // Cerramos el modal y limpiamos datos
        setModalConfirmAbierto(false);
        setUsuarioAEliminar(null);
        setPasswordActual('');
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    // Si no hay usuario logueado, redirigimos al login (por si acaso)
    if (!usuario) {
        navigate('/');
        return null;
    }

    // Si no es admin (y ya terminó la carga), mostramos pantalla de acceso denegado.
    if (!esAdmin && !loading) {
        return (
            <div className="usuarios-container">
                <div className="usuarios-empty" style={{ margin: 'auto', textAlign: 'center' }}>
                    <h2>⛔ Acceso Denegado</h2>
                    <p>No tienes permisos de administrador para acceder a esta página.</p>
                    <button onClick={() => navigate('/panel')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Volver al Panel
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="usuarios-container">
                <div className="loading-spinner">Cargando usuarios...</div>
            </div>
        );
    }

    return (
        <div className="usuarios-container">

            {/* Menú lateral (sidebar) con navegación */}
            <aside className="usuarios-sidebar">
                <div className="usuarios-logo">
                    <img src="/img/vehitrack_logo.jpg" alt="VehiTrack" className="usuarios-logo-img" />
                </div>
                <nav className="usuarios-nav">
                    <a href="#" className="usuarios-nav-item" onClick={(e) => { e.preventDefault(); navigate('/panel'); }}>🏠 Inicio</a>
                    <a href="#" className="usuarios-nav-item active">👥 Usuarios</a>
                    <a href="#" className="usuarios-nav-item" onClick={(e) => { e.preventDefault(); navigate('/vehiculos'); }}>🚗 Vehículos</a>
                    <a href="#" className="usuarios-nav-item" onClick={(e) => { e.preventDefault(); navigate('/talleres'); }}>📍 Talleres</a>
                </nav>
                <button onClick={handleLogout} className="usuarios-logout-btn">Cerrar Sesión</button>
            </aside>

            {/* Contenido principal: tabla de usuarios */}
            <main className="usuarios-main">

                <div className="usuarios-header">
                    <h1 className="usuarios-title">👥 Gestión de Usuarios</h1>
                    <div className="usuarios-usuario-badge">
                        Administrador: {usuario.nombre} {usuario.apellido}
                    </div>
                </div>

                {/* Mensaje flotante (éxito/error) que desaparece automáticamente */}
                {mensaje.texto && (
                    <div className={`alert-${mensaje.tipo === 'success' ? 'success' : 'error'}`}>
                        {mensaje.texto}
                    </div>
                )}

                <div className="usuarios-table-card">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="usuarios-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre Completo</th>
                                    <th>Correo Electrónico</th>
                                    <th>Rol</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((u) => (
                                    <tr key={u.id}>
                                        <td><strong>{u.id}</strong></td>
                                        <td>{u.nombre} {u.apellido}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            {/* Badge de color según el rol */}
                                            <span className={u.rol === 'admin' ? 'usuarios-badge-admin' : 'usuarios-badge-user'}>
                                                {u.rol === 'admin' ? 'Administrador' : 'Usuario'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button className="usuarios-btn-editar" onClick={() => abrirModalEditar(u)}>
                                                ✏️ Editar
                                            </button>
                                            {/* No se muestra el botón eliminar para el propio usuario (no puedes borrarte a ti mismo) */}
                                            {u.id !== usuario.id && (
                                                <button
                                                    className="usuarios-btn-editar"
                                                    onClick={() => confirmarEliminar(u)}
                                                    style={{ backgroundColor: '#dc3545', marginLeft: '8px' }}
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* MODAL DE EDICIÓN: aparece cuando modalEditarAbierto es true */}
            {modalEditarAbierto && usuarioEditando && (
                <div className="usuarios-modal-overlay">
                    <div className="usuarios-modal-container">
                        <div className="usuarios-modal-header">
                            <h3>✏️ Editar Usuario</h3>
                            <button className="usuarios-modal-close-btn" onClick={() => setModalEditarAbierto(false)}>×</button>
                        </div>

                        <div className="usuarios-modal-body">
                            {/* Filas de formulario. Usamos defaultValue para precargar datos, y luego leemos con getElementById */}
                            <div className="usuarios-form-row">
                                <div className="usuarios-form-col">
                                    <div className="usuarios-form-group">
                                        <label className="usuarios-form-label">Nombre *</label>
                                        <input type="text" id="editNombre" className="usuarios-form-input" defaultValue={usuarioEditando.nombre} required />
                                    </div>
                                </div>
                                <div className="usuarios-form-col">
                                    <div className="usuarios-form-group">
                                        <label className="usuarios-form-label">Apellido *</label>
                                        <input type="text" id="editApellido" className="usuarios-form-input" defaultValue={usuarioEditando.apellido} required />
                                    </div>
                                </div>
                            </div>

                            <div className="usuarios-form-group">
                                <label className="usuarios-form-label">Correo Electrónico *</label>
                                <input type="email" id="editEmail" className="usuarios-form-input" defaultValue={usuarioEditando.email} required />
                            </div>

                            <div className="usuarios-form-group">
                                <label className="usuarios-form-label">Rol</label>
                                <select id="editRol" className="usuarios-form-input" defaultValue={usuarioEditando.rol || 'user'}>
                                    <option value="user">Usuario</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            {/* Sección de seguridad: pide contraseña actual y permite cambiar la contraseña opcionalmente */}
                            <div className="usuarios-security-section">
                                <div className="usuarios-security-title">🔒 Validación de Seguridad</div>

                                <div className="usuarios-form-group">
                                    <label className="usuarios-form-label">Contraseña Actual *</label>
                                    <input type="password" className="usuarios-form-input" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Requerida para guardar cambios" />
                                </div>

                                <hr style={{ margin: '15px 0' }} />

                                <div className="usuarios-form-group">
                                    <label className="usuarios-form-label">Nueva Contraseña (Opcional)</label>
                                    <input type="password" className="usuarios-form-input" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Dejar vacío si no cambia" />
                                </div>

                                <div className="usuarios-form-group">
                                    <label className="usuarios-form-label">Confirmar Nueva Contraseña</label>
                                    <input type="password" className="usuarios-form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña" />
                                </div>

                                {errorPassword && (
                                    <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '10px' }}>
                                        ⚠️ {errorPassword}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="usuarios-modal-footer">
                            <button className="usuarios-modal-btn-cancel" onClick={() => setModalEditarAbierto(false)}>Cancelar</button>
                            <button className="usuarios-modal-btn-submit" onClick={handleGuardarUsuario}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
            {modalConfirmAbierto && usuarioAEliminar && (
                <div className="usuarios-confirm-overlay">
                    <div className="usuarios-confirm-container">
                        <div className="usuarios-confirm-header">
                            <h3 style={{ margin: 0 }}>🗑️ Eliminar Usuario</h3>
                        </div>
                        <div className="usuarios-confirm-body">
                            <p>¿Estás seguro de que deseas eliminar a <strong>{usuarioAEliminar.nombre} {usuarioAEliminar.apellido}</strong>?</p>
                            <p style={{ fontSize: '12px', color: '#6c757d' }}>Esta acción no se puede deshacer.</p>
                            <div style={{ marginTop: '20px' }}>
                                <label className="usuarios-form-label">Contraseña Actual *</label>
                                <input type="password" className="usuarios-form-input" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Ingresa tu contraseña para confirmar" style={{ marginTop: '5px' }} />
                            </div>
                        </div>
                        <div className="usuarios-confirm-footer">
                            <button className="usuarios-confirm-btn-no" onClick={() => { setModalConfirmAbierto(false); setUsuarioAEliminar(null); setPasswordActual(''); }}>
                                Cancelar
                            </button>
                            <button className="usuarios-confirm-btn-si" onClick={handleEliminarUsuario}>
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ListaUsuarios;