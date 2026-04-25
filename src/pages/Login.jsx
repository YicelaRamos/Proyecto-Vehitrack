/**
 * Login.jsx - Página de inicio de sesión
 *
 * Punto de entrada de la app. Muestra un layout de dos paneles:
 * el izquierdo con imagen de fondo y descripción de funcionalidades,
 * el derecho con el formulario de autenticación y logo.
 * Tras login exitoso redirige al panel principal.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import logo from '../assets/images/vehitrack_logo.jpg';
import fondoVehiculo from '../assets/images/fondo_vehiculo.jpg';
import './Login.css';

const Login = () => {
    // Estado para los datos del formulario (email y contraseña)
    const [formData, setFormData] = useState({ email: '', password: '' });
    // Estado para mostrar mensajes de error (ej: credenciales incorrectas)
    const [error, setError] = useState('');
    // Estado para deshabilitar el botón mientras se envía la petición
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Cada vez que el usuario escribe en un input, actualizamos el campo correspondiente
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Se ejecuta al enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();          // Evita que se recargue la página
        setLoading(true);            // Bloquea el botón
        setError('');                // Limpia errores anteriores

        // Llamamos al servicio de autenticación
        const result = await authService.login(formData.email, formData.password);
        
        if (result.success) {
            // Guardamos el usuario en el contexto/sesión y vamos al panel
            authService.setCurrentUser(result.usuario);
            navigate('/panel');
        } else {
            // Si falló, mostramos el mensaje que vino del servicio
            setError(result.message);
        }
        setLoading(false);  // Reactiva el botón
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* PANEL IZQUIERDO: Imagen decorativa con descripción de la app */}
                <div
                    className="login-left-panel"
                    style={{
                        backgroundImage: `url(${fondoVehiculo})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="login-overlay"></div>  {/* Capa oscura para que el texto se vea bien */}
                    <div className="login-content">
                        <h1 className="login-app-title">VEHITRACK</h1>
                        <p className="login-app-slogan">Control Total de tu Vehículo <br/>
                        en un solo lugar</p>
                        <p className="login-description">
                            La solución integral para conductores y administradores que <br/>
                            buscan optimizar el consumo de combustible, gestionar mantenimientos <br/>
                            preventivos y tener reportes claros.
                        </p>
                        {/* Lista de funcionalidades destacadas */}
                        <div className="login-features">
                            <div className="login-feature">
                                <h3>Combustible</h3>
                                <p>Registra cargas, galones y costos para calcular<br/> eficiencia.</p>
                            </div>
                            <div className="login-feature">
                                <h3>Mantenimiento</h3>
                                <p>Historial de reparaciones y alertas de servicios.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: Formulario de login con logo */}
                <div className="login-right-panel">
                    <div className="login-form-container">
                        <div className="login-logo-wrapper">
                            <img src={logo} alt="VehiTrack Logo" className="login-logo-img" />
                        </div>
                        <h2 className="login-form-title">Bienvenido</h2>
                        <p className="login-form-subtitle">Ingresa tus credenciales para acceder</p>

                        {/* Muestra el error si existe */}
                        {error && <div className="login-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="login-input-group">
                                <label>Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="usuario@correo.com"
                                    required
                                />
                            </div>
                            <div className="login-input-group">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder=""
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Ingresando...' : 'Entrar al Sistema'}
                            </button>
                        </form>

                        <div className="login-register-link">
                            <button onClick={() => navigate('/registro')}>
                                Crear Cuenta Nueva
                            </button>
                        </div>
                        <div className="login-footer">
                            <p>Desarrollado por ADSO SENA © 2026</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;