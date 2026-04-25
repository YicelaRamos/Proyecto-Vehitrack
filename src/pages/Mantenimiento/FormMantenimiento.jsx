/**
 * FormMantenimiento.jsx - Modal para editar un mantenimiento existente
 *
 * Se abre desde ListaMantenimiento cuando el usuario presiona "Editar".
 * Precarga los datos del mantenimiento seleccionado y envía los cambios
 * al padre mediante onGuardar. Solo se usa para edición, no para creación
 * (el registro nuevo se hace desde el formulario inline en ListaMantenimiento).
 *
 * @param {Object}   mantenimientoEditando - Mantenimiento a editar
 * @param {number}   idVehiculo            - ID del vehículo asociado (se recibe pero no se usa directamente, se conserva por si se necesita en el futuro)
 * @param {Function} onGuardar             - Callback al confirmar (recibe los datos actualizados)
 * @param {Function} onCancelar            - Callback al cerrar sin guardar
 *
 *  NOTA: Este modal solo maneja edición. La creación se hace mediante formulario inline en ListaMantenimiento.
 */

import React, { useState, useEffect } from 'react';
import './FormMantenimiento.css';

const FormMantenimiento = ({ mantenimientoEditando, idVehiculo, onGuardar, onCancelar }) => {

    // Estado del formulario. Todos los campos se inicializan vacíos y se llenan con useEffect cuando llega mantenimientoEditando.
    const [formData, setFormData] = useState({
        fecha_programada: '',
        fecha_realizacion: '',
        descripcion: '',
        costo: '',
        kilometraje_mantenimiento: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Cada vez que cambia 'mantenimientoEditando' (es decir, cuando se abre el modal con otro mantenimiento), precargamos los datos.
    useEffect(() => {
        if (mantenimientoEditando) {
            setFormData({
                fecha_programada: mantenimientoEditando.fecha_programada || '',
                fecha_realizacion: mantenimientoEditando.fecha_realizacion || '',
                descripcion: mantenimientoEditando.descripcion || '',
                costo: mantenimientoEditando.costo || '',
                kilometraje_mantenimiento: mantenimientoEditando.kilometraje_mantenimiento || ''
            });
        }
    }, [mantenimientoEditando]);

    // Validaciones básicas:
    // - Fecha programada y descripción son obligatorias.
    // - Costo y kilometraje no pueden ser negativos (aunque son opcionales, si se ingresan los validamos).
    const validarFormulario = () => {
        const nuevosErrors = {};
        if (!formData.fecha_programada)
            nuevosErrors.fecha_programada = 'La fecha programada es obligatoria';
        if (!formData.descripcion.trim())
            nuevosErrors.descripcion = 'La descripción es obligatoria';
        if (formData.costo && formData.costo < 0)
            nuevosErrors.costo = 'El costo no puede ser negativo';
        if (formData.kilometraje_mantenimiento && formData.kilometraje_mantenimiento < 0)
            nuevosErrors.kilometraje_mantenimiento = 'El kilometraje no puede ser negativo';
        setErrors(nuevosErrors);
        return Object.keys(nuevosErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // UX amigable: en cuanto el usuario empieza a corregir un campo con error, limpiamos ese error específico.
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;
        setLoading(true);
        // Preparamos los datos para enviar:
        // - La fecha de realización puede ser null si no se ha hecho el servicio.
        // - El costo y kilometraje se convierten a número; si están vacíos se pone 0.
        await onGuardar({
            fecha_programada: formData.fecha_programada,
            fecha_realizacion: formData.fecha_realizacion || null,
            descripcion: formData.descripcion.trim(),
            costo: parseFloat(formData.costo) || 0,
            kilometraje_mantenimiento: parseInt(formData.kilometraje_mantenimiento) || 0
        });
        setLoading(false);
        // Nota: onGuardar es responsable de mostrar mensajes de éxito/error y cerrar el modal si corresponde.
    };

    // Cierra el modal solo si el clic fue exactamente en el fondo gris (overlay) y no en el contenido blanco.
    // Así evitamos cierres accidentales al hacer clic dentro del formulario.
    const handleClickOverlay = (e) => {
        if (e.target.className === 'form-mantenimiento-overlay') onCancelar();
    };

    return (
        <div className="form-mantenimiento-overlay" onClick={handleClickOverlay}>
            <div className="form-mantenimiento-container">

                <div className="form-mantenimiento-header">
                    <h3>✏️ Editar Mantenimiento</h3>
                    <button className="form-mantenimiento-close-btn" onClick={onCancelar} type="button">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-mantenimiento-body">

                        {/* FECHA PROGRAMADA: obligatoria */}
                        <div className="form-mantenimiento-group">
                            <label className="form-mantenimiento-label">
                                Fecha Programada <span className="required">*</span>
                            </label>
                            <input type="date" name="fecha_programada" value={formData.fecha_programada} onChange={handleChange} className="form-mantenimiento-input" required />
                            {errors.fecha_programada && <div className="form-mantenimiento-error">{errors.fecha_programada}</div>}
                        </div>

                        {/* FECHA DE REALIZACIÓN: opcional, se puede dejar vacía si aún no se ejecutó el servicio */}
                        <div className="form-mantenimiento-group">
                            <label className="form-mantenimiento-label">Fecha Realización (Opcional)</label>
                            <input type="date" name="fecha_realizacion" value={formData.fecha_realizacion} onChange={handleChange} className="form-mantenimiento-input" />
                            <small className="form-mantenimiento-help">Dejar vacío si es una programación futura</small>
                        </div>

                        {/* DESCRIPCIÓN: texto largo, usamos textarea */}
                        <div className="form-mantenimiento-group">
                            <label className="form-mantenimiento-label">
                                Descripción <span className="required">*</span>
                            </label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="form-mantenimiento-textarea" placeholder="Ej: Cambio de aceite y filtros" rows="3" required></textarea>
                            {errors.descripcion && <div className="form-mantenimiento-error">{errors.descripcion}</div>}
                        </div>

                        {/* KILOMETRAJE DEL SERVICIO: obligatorio para llevar control preventivo */}
                        <div className="form-mantenimiento-group">
                            <label className="form-mantenimiento-label">
                                Kilometraje del Servicio <span className="required">*</span>
                            </label>
                            <input type="number" name="kilometraje_mantenimiento" value={formData.kilometraje_mantenimiento} onChange={handleChange} className="form-mantenimiento-input" placeholder="Ej: 15000" required />
                            {errors.kilometraje_mantenimiento && <div className="form-mantenimiento-error">{errors.kilometraje_mantenimiento}</div>}
                        </div>

                        {/* COSTO: opcional, pero útil para estadísticas y reportes */}
                        <div className="form-mantenimiento-group">
                            <label className="form-mantenimiento-label">Costo del Servicio</label>
                            <input type="number" step="0.01" name="costo" value={formData.costo} onChange={handleChange} className="form-mantenimiento-input" placeholder="0.00" />
                            {errors.costo && <div className="form-mantenimiento-error">{errors.costo}</div>}
                        </div>

                    </div>

                    <div className="form-mantenimiento-footer">
                        <button type="button" className="form-mantenimiento-btn-cancel" onClick={onCancelar}>
                            Cancelar
                        </button>
                        <button type="submit" className="form-mantenimiento-btn-submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Actualizar Mantenimiento'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default FormMantenimiento;