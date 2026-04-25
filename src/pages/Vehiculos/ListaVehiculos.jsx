/**
 * ListaVehiculos.jsx - Listado y gestión de vehículos del usuario
 *
 * Muestra todos los vehículos registrados por el usuario en una tabla.
 * Permite registrar nuevos vehículos, editar existentes, eliminar,
 * y navegar al módulo de combustible o mantenimientos de cada vehículo.
 * El formulario se abre como modal usando el componente FormVehiculo.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import vehiculoService from '../../services/vehiculoService';
import authService from '../../services/authService';
import FormVehiculo from './FormVehiculo';
import './ListaVehiculos.css';

const ListaVehiculos = () => {

    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();  // Obtenemos el usuario logueado

    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);      // Controla si el modal está visible
    const [vehiculoEditando, setVehiculoEditando] = useState(null);  // null = modo nuevo, sino contiene el vehículo a editar
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Al montar el componente, cargamos la lista de vehículos desde el backend
    useEffect(() => {
        cargarVehiculos();
    }, []);

    // Cada vez que cambia el mensaje, programamos un timer para que desaparezca solo después de 3 segundos.
    // Así no molesta al usuario y la interfaz se ve limpia.
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const cargarVehiculos = async () => {
        setLoading(true);
        const lista = await vehiculoService.listarPorUsuario();  // Asume que el servicio usa el usuario actual
        setVehiculos(lista);
        setLoading(false);
    };

    const handleEliminar = async (id, placa) => {
        // Confirmación amigable antes de borrar
        if (window.confirm(`¿Eliminar vehículo ${placa}?`)) {
            const result = await vehiculoService.eliminar(id);
            if (result.success) {
                setMensaje({ texto: result.message, tipo: 'success' });
                cargarVehiculos();  // Recargamos la lista para que desaparezca el eliminado
            } else {
                setMensaje({ texto: result.message, tipo: 'error' });
            }
        }
    };

    // Esta función se la pasamos al modal para que cuando el usuario guarde, se ejecute aquí.
    // Decide si es edición o agregado según si hay 'vehiculoEditando'.
    const handleGuardarVehiculo = async (datosVehiculo) => {
        let result;
        if (vehiculoEditando) {
            result = await vehiculoService.editar(vehiculoEditando.id_vehiculo, datosVehiculo);
        } else {
            result = await vehiculoService.agregar(datosVehiculo);
        }

        if (result.success) {
            setMensaje({ texto: result.message, tipo: 'success' });
            setShowModal(false);
            setVehiculoEditando(null);
            cargarVehiculos();  // Actualiza la tabla con el nuevo vehículo o los cambios
        } else {
            setMensaje({ texto: result.message, tipo: 'error' });
        }
    };

    // Si por alguna razón no hay usuario (por ejemplo, expiró la sesión), redirigimos al login.
    if (!usuario) {
        navigate('/');
        return null;
    }

    // Estilos en línea para los botones de acción. Normalmente se usarían clases CSS,
    // pero así está más rápido y es más fácil de leer en este componente.
    const buttonStyles = {
        success: {
            backgroundColor: '#28a745', color: 'white', border: 'none',
            padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px'
        },
        danger: {
            backgroundColor: '#dc3545', color: 'white', border: 'none',
            padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px'
        },
        info: {
            backgroundColor: '#17a2b8', color: 'white', border: 'none',
            padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontSize: '12px'
        },
        warning: {
            backgroundColor: '#ffc107', color: '#212529', border: 'none',
            padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontSize: '12px'
        }
    };

    return (
        <Sidebar tituloPagina="🚗 Gestión de Vehículos">

            {/* Botón para añadir nuevo vehículo. Al hacer clic, limpiamos el modo edición y mostramos el modal */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => { setVehiculoEditando(null); setShowModal(true); }}
                    style={buttonStyles.success}
                >
                    ➕ Registrar Nuevo Vehículo
                </button>
            </div>

            {/* Mensaje flotante de éxito o error. Desaparece solo después de 3 segundos */}
            {mensaje.texto && (
                <div style={{
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da',
                    color: mensaje.tipo === 'success' ? '#155724' : '#721c24'
                }}>
                    {mensaje.texto}
                </div>
            )}

            {loading ? (
                <div>Cargando...</div>
            ) : vehiculos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    No tienes vehículos registrados.
                </div>
            ) : (
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <thead style={{ backgroundColor: '#0a2351', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Placa</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Vehículo</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Año</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>KM</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehiculos.map((v) => (
                            <tr key={v.id_vehiculo} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#e94560' }}>{v.placa}</td>
                                <td style={{ padding: '12px' }}>{v.marca} {v.modelo}</td>
                                <td style={{ padding: '12px' }}>{v.anio}</td>
                                <td style={{ padding: '12px' }}>{v.kilometraje_actual?.toLocaleString()} km</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    {/* Botón para ir al módulo de combustible de este vehículo */}
                                    <button onClick={() => navigate(`/combustible/${v.id_vehiculo}`)} style={buttonStyles.info}>
                                        ⛽ Combustible
                                    </button>
                                    {/* Botón para ir al módulo de mantenimientos de este vehículo */}
                                    <button onClick={() => navigate(`/mantenimientos/${v.id_vehiculo}`)} style={buttonStyles.warning}>
                                        🔧 Mantenimientos
                                    </button>
                                    {/* Botón eliminar con confirmación previa */}
                                    <button onClick={() => handleEliminar(v.id_vehiculo, v.placa)} style={buttonStyles.danger}>
                                        🗑️ Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal de registro/edición: solo se renderiza si showModal es true */}
            {showModal && (
                <FormVehiculo
                    vehiculoEditando={vehiculoEditando}
                    onGuardar={handleGuardarVehiculo}
                    onCancelar={() => { setShowModal(false); setVehiculoEditando(null); }}
                />
            )}
        </Sidebar>
    );
};

export default ListaVehiculos;