/**
 * Registro.jsx - Página de registro de nuevos usuarios 
 * Contiene:
 * - Panel izquierdo: imagen de fondo y descripción
 * - Panel derecho: formulario de registro con logo centrado
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import logo from '../assets/images/vehitrack_logo.jpg';
import fondoVehiculo from '../assets/images/fondo_vehiculo.jpg';
import './Registro.css';

const Registro = () => {
    // Estado que guarda todos los campos del formulario
    const [formData, setFormData] = useState({
        nombre: '', apellido: '', email: '', password: '', confirmPassword: ''
    });
    const [error, setError] = useState('');      // Mensaje de error (rojo)
    const [success, setSuccess] = useState('');  // Mensaje de éxito (verde)
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Mantiene sincronizados los inputs con el estado
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones sencillas del lado del cliente antes de enviar al backend
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (formData.password.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        // Llamamos al servicio de registro
        const result = await authService.register({
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            password: formData.password
        });

        if (result.success) {
            setSuccess(result.message);
            // Redirige al login después de 2 segundos para que el usuario vea el mensaje de éxito
            setTimeout(() => navigate('/'), 2000);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="registro-container">
            <div className="registro-card">

                {/* Panel izquierdo: igual que el login, con imagen y beneficios */}
                <div
                    className="registro-left-panel"
                    style={{
                        backgroundImage: `url(${fondoVehiculo})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="registro-overlay"></div>
                    <div className="registro-content">
                        <h1 className="registro-app-title">VEHITRACK</h1>
                        <p className="registro-app-slogan">Únete a nuestra comunidad</p>
                        <p className="registro-description">
                            Regístrate para gestionar tu vehiculo, controlar el consumo de combustible y mantener al día los mantenimientos.
                        </p>
                        <div className="registro-benefits">
                            <div className="registro-benefit">✓ Control total de tu vehiculo</div>
                            <div className="registro-benefit">✓ Reportes en tiempo real</div>
                            <div className="registro-benefit">✓ Alertas de mantenimiento</div>
                        </div>
                    </div>
                </div>

                {/* Panel derecho: formulario de registro */}
                <div className="registro-right-panel">
                    <div className="registro-form-container">
                        <div className="registro-logo-wrapper">
                            <img src={logo} alt="VehiTrack Logo" className="registro-logo-img" />
                        </div>
                        <h2 className="registro-form-title">Crear Cuenta</h2>
                        <p className="registro-form-text">Completa tus datos para registrarte</p>

                        {/* Muestro mensajes de error o éxito según corresponda */}
                        {error && <div className="registro-error">{error}</div>}
                        {success && <div className="registro-success">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            {/* Fila de dos columnas: nombre y apellido */}
                            <div className="registro-row">
                                <div className="registro-col">
                                    <label>Nombre</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                                </div>
                                <div className="registro-col">
                                    <label>Apellido</label>
                                    <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="registro-input-group">
                                <label>Correo Electrónico</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="registro-input-group">
                                <label>Contraseña</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                            </div>
                            <div className="registro-input-group">
                                <label>Confirmar Contraseña</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Registrando...' : 'Registrarse'}
                            </button>
                        </form>

                        <div className="registro-login-link">
                            <button onClick={() => navigate('/')}>← Volver al inicio de sesión</button>
                        </div>
                        <div className="registro-footer">
                            <p>Desarrollado por ADSO SENA © 2026</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Registro;