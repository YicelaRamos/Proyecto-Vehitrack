/**
 * FormCombustible.jsx - Modal para editar un registro de combustible existente
 *
 * Se abre desde ListaCombustible cuando el usuario presiona "Editar".
 * Precarga los datos del registro seleccionado y envía los cambios al padre
 * mediante onGuardar. Solo se usa para edición — el registro nuevo se hace
 * desde el formulario inline en ListaCombustible.
 *
 * @param {Object}   registroEditando - Registro a editar
 * @param {number}   idVehiculo       - ID del vehículo asociado
 * @param {Function} onGuardar        - Callback al confirmar
 * @param {Function} onCancelar       - Callback al cerrar sin guardar
 */

import React, { useState, useEffect } from 'react';
import './FormCombustible.css';

const FormCombustible = ({ registroEditando, idVehiculo, onGuardar, onCancelar }) => {

    const [formData, setFormData] = useState({ fecha: '', cantidad: '', costo: '', kilometraje: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Precarga los datos del registro al abrir el modal
    useEffect(() => {
        if (registroEditando) {
            setFormData({
                fecha: registroEditando.fecha || '',
                cantidad: registroEditando.cantidad || '',
                costo: registroEditando.costo || '',
                kilometraje: registroEditando.kilometraje || ''
            });
        }
    }, [registroEditando]);

    const validarFormulario = () => {
        const nuevosErrors = {};
        if (!formData.fecha)
            nuevosErrors.fecha = 'La fecha es obligatoria';
        if (!formData.cantidad || formData.cantidad <= 0)
            nuevosErrors.cantidad = 'La cantidad debe ser mayor a 0';
        if (!formData.costo || formData.costo <= 0)
            nuevosErrors.costo = 'El costo debe ser mayor a 0';
        if (!formData.kilometraje || formData.kilometraje < 0)
            nuevosErrors.kilometraje = 'El kilometraje no puede ser negativo';
        setErrors(nuevosErrors);
        return Object.keys(nuevosErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpia el error del campo en cuanto el usuario empieza a corregirlo
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;
        setLoading(true);
        await onGuardar({
            fecha: formData.fecha,
            cantidad: parseFloat(formData.cantidad),
            costo: parseFloat(formData.costo),
            kilometraje: parseInt(formData.kilometraje)
        });
        setLoading(false);
    };

    // Cierra el modal solo si el clic fue sobre el overlay y no sobre el contenido
    const handleClickOverlay = (e) => {
        if (e.target.className === 'form-combustible-overlay') onCancelar();
    };

    return (
        <div className="form-combustible-overlay" onClick={handleClickOverlay}>
            <div className="form-combustible-container">

                <div className="form-combustible-header">
                    <h3>✏️ Editar Registro de Combustible</h3>
                    <button className="form-combustible-close-btn" onClick={onCancelar} type="button">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-combustible-body">

                        <div className="form-combustible-group">
                            <label className="form-combustible-label">
                                Fecha de Compra <span className="required">*</span>
                            </label>
                            <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="form-combustible-input" required />
                            {errors.fecha && <div className="form-combustible-error">{errors.fecha}</div>}
                        </div>

                        <div className="form-combustible-group">
                            <label className="form-combustible-label">
                                Cantidad (Galones/Litros) <span className="required">*</span>
                            </label>
                            <input type="number" step="0.01" name="cantidad" value={formData.cantidad} onChange={handleChange} className="form-combustible-input" placeholder="0.00" required />
                            {errors.cantidad && <div className="form-combustible-error">{errors.cantidad}</div>}
                        </div>

                        <div className="form-combustible-group">
                            <label className="form-combustible-label">
                                Costo Total <span className="required">*</span>
                            </label>
                            <input type="number" step="0.01" name="costo" value={formData.costo} onChange={handleChange} className="form-combustible-input" placeholder="0.00" required />
                            {errors.costo && <div className="form-combustible-error">{errors.costo}</div>}
                        </div>

                        <div className="form-combustible-group">
                            <label className="form-combustible-label">
                                Kilometraje Actual <span className="required">*</span>
                            </label>
                            <input type="number" name="kilometraje" value={formData.kilometraje} onChange={handleChange} className="form-combustible-input" placeholder="Ej: 12500" required />
                            {/* El kilometraje ingresado actualiza el odómetro del vehículo */}
                            <small className="form-combustible-help">Este valor actualizará el odómetro del vehículo</small>
                            {errors.kilometraje && <div className="form-combustible-error">{errors.kilometraje}</div>}
                        </div>

                    </div>

                    <div className="form-combustible-footer">
                        <button type="button" className="form-combustible-btn-cancel" onClick={onCancelar}>Cancelar</button>
                        <button type="submit" className="form-combustible-btn-submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Actualizar Registro'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default FormCombustible;