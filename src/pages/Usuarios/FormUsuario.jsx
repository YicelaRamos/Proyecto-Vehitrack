/**
 * FormUsuario.jsx - Modal de formulario para crear o editar un usuario (solo admin)
 *
 * Si recibe `usuarioEditando`, precarga sus datos y activa el modo edición,
 * que requiere contraseña actual para confirmar cambios y permite opcionalmente
 * cambiar la contraseña. En modo creación el formulario inicia vacío y solicita
 * contraseña directamente. El rol (usuario/admin) es asignable en ambos modos.
 *
 * @param {Object}   usuarioEditando - Usuario a editar (null si es nuevo)
 * @param {Function} onGuardar       - Callback al confirmar (recibe datos y modo)
 * @param {Function} onCancelar      - Callback al cerrar sin guardar
 */

import React, { useState, useEffect } from 'react';
import './FormUsuario.css';

const FormUsuario = ({ usuarioEditando, onGuardar, onCancelar }) => {

    // Estado unificado para todos los campos del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        rol: 'user',
        password: '',        // Solo para crear nuevo usuario
        passwordActual: '',  // Requerida en edición para confirmar cambios
        nuevaPassword: '',   // Opcional en edición para cambiar contraseña
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState('');

    // Cada vez que cambia 'usuarioEditando' (se abre el modal en modo edición o creación), reseteamos el formulario.
    useEffect(() => {
        if (usuarioEditando) {
            setModoEdicion(true);
            setFormData({
                nombre: usuarioEditando.nombre || '',
                apellido: usuarioEditando.apellido || '',
                email: usuarioEditando.email || '',
                rol: usuarioEditando.rol || 'user',
                password: '',
                passwordActual: '',
                nuevaPassword: '',
                confirmPassword: ''
            });
        } else {
            setModoEdicion(false);
            setFormData({
                nombre: '', apellido: '', email: '', rol: 'user',
                password: '', passwordActual: '', nuevaPassword: '', confirmPassword: ''
            });
        }
        setErrors({});
        setErrorGeneral('');
    }, [usuarioEditando]);

    // Valida todos los campos del formulario.
    // - En modo creación, la contraseña es obligatoria y con mínimo 4 caracteres.
    // - En modo edición, la contraseña actual es obligatoria; si se ingresa nueva contraseña, debe tener mínimo 4 caracteres y coincidir.
    const validarFormulario = () => {
        const nuevosErrors = {};

        if (!formData.nombre.trim())
            nuevosErrors.nombre = 'El nombre es obligatorio';

        if (!formData.apellido.trim())
            nuevosErrors.apellido = 'El apellido es obligatorio';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim())
            nuevosErrors.email = 'El correo electrónico es obligatorio';
        else if (!emailRegex.test(formData.email))
            nuevosErrors.email = 'Formato de correo electrónico inválido';

        if (!modoEdicion) {
            if (!formData.password)
                nuevosErrors.password = 'La contraseña es obligatoria';
            else if (formData.password.length < 4)
                nuevosErrors.password = 'La contraseña debe tener al menos 4 caracteres';
        }

        if (modoEdicion && formData.nuevaPassword) {
            if (formData.nuevaPassword.length < 4)
                nuevosErrors.nuevaPassword = 'La nueva contraseña debe tener al menos 4 caracteres';
            if (formData.nuevaPassword !== formData.confirmPassword)
                nuevosErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(nuevosErrors);
        return Object.keys(nuevosErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // En cuanto el usuario empieza a corregir un campo, limpiamos el error de ese campo.
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (errorGeneral) setErrorGeneral('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        setLoading(true);
        setErrorGeneral('');

        // Preparamos los datos para enviar al padre (limpiamos espacios y normalizamos email a minúsculas)
        const datosGuardar = {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            email: formData.email.trim().toLowerCase(),
            rol: formData.rol
        };

        if (!modoEdicion) {
            datosGuardar.password = formData.password;
        }

        if (modoEdicion) {
            datosGuardar.passwordActual = formData.passwordActual;
            if (formData.nuevaPassword)
                datosGuardar.nuevaPassword = formData.nuevaPassword;
        }

        // onGuardar debe devolver un objeto con { success, message }
        const result = await onGuardar(datosGuardar, modoEdicion);
        if (!result.success) setErrorGeneral(result.message);

        setLoading(false);
    };

    // Cierra el modal si el clic fue exactamente en el overlay (fondo gris) y no en el contenido blanco.
    const handleClickOverlay = (e) => {
        if (e.target.className === 'form-usuario-overlay') onCancelar();
    };

    return (
        <div className="form-usuario-overlay" onClick={handleClickOverlay}>
            <div className="form-usuario-container">

                <div className="form-usuario-header">
                    <h3>{modoEdicion ? '✏️ Editar Usuario' : '➕ Crear Nuevo Usuario'}</h3>
                    <button className="form-usuario-close-btn" onClick={onCancelar} type="button">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-usuario-body">

                        {/* Error general (ej: contraseña actual incorrecta) */}
                        {errorGeneral && (
                            <div className="form-usuario-error-general">⚠️ {errorGeneral}</div>
                        )}

                        {/* Nombre y Apellido en fila de dos columnas */}
                        <div className="form-usuario-row">
                            <div className="form-usuario-col">
                                <div className="form-usuario-group">
                                    <label className="form-usuario-label">
                                        Nombre <span className="required">*</span>
                                    </label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="form-usuario-input" placeholder="Ej: Jeison" required />
                                    {errors.nombre && <div className="form-usuario-error">{errors.nombre}</div>}
                                </div>
                            </div>
                            <div className="form-usuario-col">
                                <div className="form-usuario-group">
                                    <label className="form-usuario-label">
                                        Apellido <span className="required">*</span>
                                    </label>
                                    <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="form-usuario-input" placeholder="Ej: Guzman" required />
                                    {errors.apellido && <div className="form-usuario-error">{errors.apellido}</div>}
                                </div>
                            </div>
                        </div>

                        <div className="form-usuario-group">
                            <label className="form-usuario-label">
                                Correo Electrónico <span className="required">*</span>
                            </label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-usuario-input" placeholder="correo@ejemplo.com" required />
                            {errors.email && <div className="form-usuario-error">{errors.email}</div>}
                        </div>

                        <div className="form-usuario-group">
                            <label className="form-usuario-label">Rol</label>
                            <select name="rol" value={formData.rol} onChange={handleChange} className="form-usuario-select">
                                <option value="user">👤 Usuario</option>
                                <option value="admin">👑 Administrador</option>
                            </select>
                        </div>

                        {/* Sección de seguridad: varía según sea creación o edición */}
                        <div className="form-usuario-security-section">
                            <div className="form-usuario-security-title">🔒 Validación de Seguridad</div>

                            {modoEdicion ? (
                                <>
                                    <div className="form-usuario-group">
                                        <label className="form-usuario-label">
                                            Contraseña Actual <span className="required">*</span>
                                        </label>
                                        <input type="password" name="passwordActual" value={formData.passwordActual} onChange={handleChange} className="form-usuario-input" placeholder="Requerida para guardar cambios" required />
                                    </div>

                                    <hr className="form-usuario-hr" />

                                    <div className="form-usuario-group">
                                        <label className="form-usuario-label">Nueva Contraseña (Opcional)</label>
                                        <input type="password" name="nuevaPassword" value={formData.nuevaPassword} onChange={handleChange} className="form-usuario-input" placeholder="Dejar vacío si no cambia" />
                                    </div>

                                    <div className="form-usuario-group">
                                        <label className="form-usuario-label">Confirmar Nueva Contraseña</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-usuario-input" placeholder="Repite la nueva contraseña" />
                                        {errors.nuevaPassword && <div className="form-usuario-error">{errors.nuevaPassword}</div>}
                                        {errors.confirmPassword && <div className="form-usuario-error">{errors.confirmPassword}</div>}
                                    </div>
                                </>
                            ) : (
                                <div className="form-usuario-group">
                                    <label className="form-usuario-label">
                                        Contraseña <span className="required">*</span>
                                    </label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-usuario-input" placeholder="Crea una contraseña segura" required />
                                    {errors.password && <div className="form-usuario-error">{errors.password}</div>}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="form-usuario-footer">
                        <button type="button" className="form-usuario-btn-cancel" onClick={onCancelar}>
                            Cancelar
                        </button>
                        <button type="submit" className="form-usuario-btn-submit" disabled={loading}>
                            {loading ? 'Guardando...' : (modoEdicion ? 'Actualizar Usuario' : 'Crear Usuario')}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default FormUsuario;