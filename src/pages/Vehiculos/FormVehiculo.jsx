/**
 * FormVehiculo.jsx - Modal de formulario para registrar o editar un vehículo
 *
 * Se abre sobre el contenido actual. Si recibe `vehiculoEditando`, precarga
 * sus datos para edición; si no, inicializa el formulario vacío para registro.
 * Al guardar, envía los datos limpios al componente padre mediante `onGuardar`.
 *
 * @param {Object}   vehiculoEditando - Vehículo a editar (null si es nuevo)
 * @param {Function} onGuardar        - Callback al confirmar (recibe los datos)
 * @param {Function} onCancelar       - Callback al cerrar sin guardar
 */

import React, { useState, useEffect } from 'react';
import './FormVehiculo.css';

const FormVehiculo = ({ vehiculoEditando, onGuardar, onCancelar }) => {

    // Estado principal del formulario. Ojo: el año por defecto es el actual,
    // y las fechas de vencimiento se dejan vacías para que el usuario las elija.
    const [formData, setFormData] = useState({
        tipo: 'Carro',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        placa: '',
        kilometraje_actual: 0,
        vencimiento_soat: '',
        vencimiento_rtm: ''
    });

    const [errors, setErrors] = useState({});  // Aquí guardamos los mensajes de error de cada campo
    const [loading, setLoading] = useState(false);

    // Si se abre en modo edición, cargamos los datos del vehículo seleccionado.
    // El useEffect se ejecuta cada vez que cambia 'vehiculoEditando'.
    useEffect(() => {
        if (vehiculoEditando) {
            setFormData({
                tipo: vehiculoEditando.tipo || 'Carro',
                marca: vehiculoEditando.marca || '',
                modelo: vehiculoEditando.modelo || '',
                anio: vehiculoEditando.anio || new Date().getFullYear(),
                placa: vehiculoEditando.placa || '',
                kilometraje_actual: vehiculoEditando.kilometraje_actual || 0,
                vencimiento_soat: vehiculoEditando.vencimiento_soat || '',
                vencimiento_rtm: vehiculoEditando.vencimiento_rtm || ''
            });
        }
    }, [vehiculoEditando]);

    // Valida todos los campos antes de enviar. Devuelve true si todo está bien.
    const validarFormulario = () => {
        const nuevosErrors = {};

        if (!formData.marca.trim())
            nuevosErrors.marca = 'La marca es obligatoria';

        if (!formData.modelo.trim())
            nuevosErrors.modelo = 'El modelo es obligatorio';

        const anioActual = new Date().getFullYear();
        if (!formData.anio || formData.anio < 1900 || formData.anio > anioActual + 1)
            nuevosErrors.anio = `El año debe estar entre 1900 y ${anioActual + 1}`;

        // Validación de placa: permite letras, números y guión, entre 4 y 10 caracteres.
        // Esto cubre formatos como ABC-123, 1234ABC, etc. Lo normalizaremos a mayúsculas después.
        const placaRegex = /^[A-Za-z0-9-]{4,10}$/;
        if (!formData.placa.trim())
            nuevosErrors.placa = 'La placa es obligatoria';
        else if (!placaRegex.test(formData.placa))
            nuevosErrors.placa = 'Formato de placa inválido (ej: ABC-123)';

        if (formData.kilometraje_actual < 0)
            nuevosErrors.kilometraje_actual = 'El kilometraje no puede ser negativo';

        if (!formData.vencimiento_soat)
            nuevosErrors.vencimiento_soat = 'La fecha de vencimiento SOAT es obligatoria';

        if (!formData.vencimiento_rtm)
            nuevosErrors.vencimiento_rtm = 'La fecha de vencimiento RTM es obligatoria';

        setErrors(nuevosErrors);
        return Object.keys(nuevosErrors).length === 0;  // Si no hay errores, retorna true
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // En cuanto el usuario empieza a corregir un campo, limpiamos el error de ese campo.
        // Así el mensaje rojo desaparece mientras escribe.
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        setLoading(true);

        // Preparamos los datos para enviar: recortamos espacios, convertimos números,
        // y la placa la dejamos en mayúsculas para uniformidad.
        const datosGuardar = {
            tipo: formData.tipo,
            marca: formData.marca.trim(),
            modelo: formData.modelo.trim(),
            anio: parseInt(formData.anio),
            placa: formData.placa.trim().toUpperCase(),  // Normalizamos la placa a mayúsculas
            kilometraje_actual: parseInt(formData.kilometraje_actual) || 0,
            vencimiento_soat: formData.vencimiento_soat,
            vencimiento_rtm: formData.vencimiento_rtm
        };

        await onGuardar(datosGuardar);
        setLoading(false);
    };

    // Cierra el modal solo si el clic fue sobre el fondo gris (overlay) y no sobre el contenido blanco.
    // Así evitamos cierres accidentales al hacer clic dentro del formulario.
    const handleClickOverlay = (e) => {
        if (e.target.className === 'form-vehiculo-overlay') {
            onCancelar();
        }
    };

    return (
        <div className="form-vehiculo-overlay" onClick={handleClickOverlay}>
            <div className="form-vehiculo-container">

                <div className="form-vehiculo-header">
                    <h3>
                        {vehiculoEditando ? '✏️ Editar Vehículo' : '➕ Registrar Nuevo Vehículo'}
                    </h3>
                    <button className="form-vehiculo-close-btn" onClick={onCancelar} type="button">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-vehiculo-body">

                        {/* Tipo y Placa */}
                        <div className="form-vehiculo-row">
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label">
                                        Tipo de Vehículo <span className="required">*</span>
                                    </label>
                                    <select name="tipo" value={formData.tipo} onChange={handleChange} className="form-vehiculo-select" required>
                                        <option value="Carro">Carro</option>
                                        <option value="Moto">Moto</option>
                                        <option value="Camión">Camión</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label">
                                        Placa / Patente <span className="required">*</span>
                                    </label>
                                    <input type="text" name="placa" value={formData.placa} onChange={handleChange} className="form-vehiculo-input" placeholder="Ej: ABC-123" required />
                                    {errors.placa && <div className="form-vehiculo-error">{errors.placa}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Marca y Modelo */}
                        <div className="form-vehiculo-row">
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label">
                                        Marca <span className="required">*</span>
                                    </label>
                                    <input type="text" name="marca" value={formData.marca} onChange={handleChange} className="form-vehiculo-input" placeholder="Ej: Toyota, Yamaha, Chevrolet" required />
                                    {errors.marca && <div className="form-vehiculo-error">{errors.marca}</div>}
                                </div>
                            </div>
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label">
                                        Modelo <span className="required">*</span>
                                    </label>
                                    <input type="text" name="modelo" value={formData.modelo} onChange={handleChange} className="form-vehiculo-input" placeholder="Ej: Corolla, MT-03, Spark" required />
                                    {errors.modelo && <div className="form-vehiculo-error">{errors.modelo}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Año y Kilometraje */}
                        <div className="form-vehiculo-row">
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label">
                                        Año <span className="required">*</span>
                                    </label>
                                    <input type="number" name="anio" value={formData.anio} onChange={handleChange} className="form-vehiculo-input" placeholder="Ej: 2020" min="1900" max={new Date().getFullYear() + 1} required />
                                    {errors.anio && <div className="form-vehiculo-error">{errors.anio}</div>}
                                </div>
                            </div>
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label">
                                        Kilometraje Actual (KM) <span className="required">*</span>
                                    </label>
                                    <input type="number" name="kilometraje_actual" value={formData.kilometraje_actual} onChange={handleChange} className="form-vehiculo-input" placeholder="Ej: 25000" min="0" required />
                                    {errors.kilometraje_actual && <div className="form-vehiculo-error">{errors.kilometraje_actual}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Vencimiento SOAT y RTM */}
                        <div className="form-vehiculo-row">
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label text-danger">
                                        Vencimiento SOAT <span className="required">*</span>
                                    </label>
                                    <input type="date" name="vencimiento_soat" value={formData.vencimiento_soat} onChange={handleChange} className="form-vehiculo-input" required />
                                    {errors.vencimiento_soat && <div className="form-vehiculo-error">{errors.vencimiento_soat}</div>}
                                </div>
                            </div>
                            <div className="form-vehiculo-col">
                                <div className="form-vehiculo-group">
                                    <label className="form-vehiculo-label text-warning">
                                        Vencimiento RTM (Técnico-Mecánica) <span className="required">*</span>
                                    </label>
                                    <input type="date" name="vencimiento_rtm" value={formData.vencimiento_rtm} onChange={handleChange} className="form-vehiculo-input" required />
                                    {errors.vencimiento_rtm && <div className="form-vehiculo-error">{errors.vencimiento_rtm}</div>}
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="form-vehiculo-footer">
                        <button type="button" className="form-vehiculo-btn-cancel" onClick={onCancelar}>
                            Cancelar
                        </button>
                        <button type="submit" className="form-vehiculo-btn-submit" disabled={loading}>
                            {loading ? 'Guardando...' : (vehiculoEditando ? 'Actualizar Vehículo' : 'Guardar Vehículo')}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default FormVehiculo;