/**
 * ListaFavoritos.jsx - Lista de talleres favoritos del usuario
 *
 * Muestra las tarjetas de los talleres guardados como favoritos.
 * Permite agregar nuevos favoritos desde un modal con selector de taller,
 * eliminar favoritos con confirmación, y ver el taller en el mapa
 * pasando las coordenadas por sessionStorage hacia MapaTalleres.
 *
 *  NOTA: Los talleres disponibles para agregar como favoritos se obtienen
 * de un array estático en favoritoService. Si se añaden nuevos talleres al sistema,
 * habría que actualizar ese array manualmente o cambiar la lógica para
 * consultar los talleres desde el backend.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import favoritoService from '../../services/favoritoService';
import authService from '../../services/authService';
import './ListaFavoritos.css';

const ListaFavoritos = () => {

    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();

    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
    const [modalConfirmAbierto, setModalConfirmAbierto] = useState(false);
    const [favoritoAEliminar, setFavoritoAEliminar] = useState(null);
    const [talleresDisponibles, setTalleresDisponibles] = useState([]);
    const [tallerSeleccionado, setTallerSeleccionado] = useState('');
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Al montar, cargamos los favoritos del usuario y la lista de talleres disponibles
    useEffect(() => {
        cargarFavoritos();
        cargarTalleresDisponibles();
    }, []);

    // Auto-oculta el mensaje de feedback después de 3 segundos (mejor experiencia de usuario)
    useEffect(() => {
        if (mensaje.texto) {
            const timer = setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [mensaje]);

    const cargarFavoritos = async () => {
        setLoading(true);
        const lista = await favoritoService.listarPorUsuario();
        setFavoritos(lista);
        setLoading(false);
    };

    // Obtiene los talleres que el usuario puede agregar como favoritos
    //  Esto debería venir del backend, pero por simplicidad se usa un array estático
    const cargarTalleresDisponibles = () => {
        setTalleresDisponibles(favoritoService.obtenerTalleresDisponibles());
    };

    const handleAgregarFavorito = async () => {
        if (!tallerSeleccionado) {
            setMensaje({ texto: 'Selecciona un taller', tipo: 'error' });
            return;
        }
        // Buscamos el taller completo por su nombre (asumimos que los nombres son únicos)
        const taller = talleresDisponibles.find(t => t.nombre === tallerSeleccionado);
        const result = await favoritoService.agregar(taller);
        if (result.success) {
            setMensaje({ texto: result.message, tipo: 'success' });
            setModalAgregarAbierto(false);
            setTallerSeleccionado('');
            cargarFavoritos(); // Refrescamos la lista
        } else {
            setMensaje({ texto: result.message, tipo: 'error' });
        }
    };

    const confirmarEliminar = (id) => {
        setFavoritoAEliminar(id);
        setModalConfirmAbierto(true);
    };

    const handleEliminarFavorito = async () => {
        if (!favoritoAEliminar) return;
        const result = await favoritoService.eliminar(favoritoAEliminar);
        if (result.success) {
            setMensaje({ texto: result.message, tipo: 'success' });
            cargarFavoritos();
        } else {
            setMensaje({ texto: result.message, tipo: 'error' });
        }
        setModalConfirmAbierto(false);
        setFavoritoAEliminar(null);
    };

    /**
     * Al hacer clic en "Ver en Mapa", guardamos las coordenadas y el nombre del taller
     * en sessionStorage para que MapaTalleres pueda leerlos y centrar el mapa automáticamente.
     * Esto es más fiable que pasar datos por URL porque la navegación es independiente.
     */
    const handleVerEnMapa = (taller) => {
        sessionStorage.setItem('mapaCentro', JSON.stringify({
            lat: taller.latitud,
            lng: taller.longitud,
            zoom: 16,
            nombre: taller.nombre_taller
        }));
        navigate('/talleres');
    };

    const cerrarModalAgregar = () => {
        setModalAgregarAbierto(false);
        setTallerSeleccionado('');
    };

    // Estilos en línea reutilizables (podrían migrarse a CSS para mantener la coherencia)
    const buttonStyles = {
        success: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' },
        danger: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' },
        info: { backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' },
        secondary: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }
    };

    if (!usuario) { navigate('/'); return null; }

    return (
        <Sidebar tituloPagina="⭐ Mis Talleres Favoritos">

            {/* Botón flotante para agregar nuevo favorito */}
            <div style={{ marginBottom: '20px' }}>
                <button style={buttonStyles.success} onClick={() => setModalAgregarAbierto(true)}>
                    ➕ Agregar Taller Favorito
                </button>
            </div>

            {/* Mensaje de éxito/error que desaparece solo */}
            {mensaje.texto && (
                <div style={{
                    padding: '10px', borderRadius: '8px', marginBottom: '20px',
                    backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da',
                    color: mensaje.tipo === 'success' ? '#155724' : '#721c24'
                }}>
                    {mensaje.texto}
                </div>
            )}

            {loading ? (
                <div>Cargando favoritos...</div>
            ) : favoritos.length === 0 ? (
                // Estado vacío con sugerencia amigable
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '15px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>⭐</div>
                    <h3>No tienes talleres favoritos</h3>
                    <p>Agrega tus talleres de confianza para acceder rápidamente a ellos.</p>
                    <button style={buttonStyles.success} onClick={() => setModalAgregarAbierto(true)}>
                        ➕ Agregar mi primer favorito
                    </button>
                </div>
            ) : (
                // Grid de tarjetas de favoritos
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {favoritos.map((favorito) => (
                        <div key={favorito.id_favorito} style={{
                            backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)', transition: 'transform 0.3s'
                        }}>
                            {/* Cabecera con gradiente amarillo-naranja (estilo distintivo) */}
                            <div style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)', padding: '15px 20px', color: '#212529' }}>
                                <h3 style={{ margin: 0 }}>🔧 {favorito.nombre_taller}</h3>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '15px', color: '#6c757d', fontSize: '14px' }}>
                                    <span>📍</span>
                                    <span>{favorito.direccion}</span>
                                </div>
                                {/* Mostramos coordenadas visibles para referencia (útil si el usuario quiere verificar) */}
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '12px', color: '#17a2b8', backgroundColor: '#f8f9fa', padding: '8px 12px', borderRadius: '8px' }}>
                                    <span>📌 Lat: {favorito.latitud}</span>
                                    <span>📌 Lng: {favorito.longitud}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={{ flex: 1, ...buttonStyles.info }} onClick={() => handleVerEnMapa(favorito)}>
                                        🗺️ Ver en Mapa
                                    </button>
                                    <button style={{ flex: 1, ...buttonStyles.danger }} onClick={() => confirmarEliminar(favorito.id_favorito)}>
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL PARA AGREGAR FAVORITO */}
            {modalAgregarAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <div style={{ backgroundColor: '#ffc107', color: '#212529', padding: '18px 24px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>⭐ Agregar Taller a Favoritos</h3>
                            <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={cerrarModalAgregar}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Seleccionar Taller:</label>
                            <select
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                value={tallerSeleccionado}
                                onChange={(e) => setTallerSeleccionado(e.target.value)}
                            >
                                <option value="">-- Selecciona un taller --</option>
                                {talleresDisponibles.map((taller) => (
                                    <option key={taller.id} value={taller.nombre}>
                                        {taller.nombre} - {taller.direccion}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }} onClick={cerrarModalAgregar}>
                                Cancelar
                            </button>
                            <button style={{ backgroundColor: '#ffc107', color: '#212529', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleAgregarFavorito}>
                                Agregar a Favoritos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (z-index mayor para estar encima del otro modal) */}
            {modalConfirmAbierto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1100
                }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <div style={{ backgroundColor: '#dc3545', color: 'white', padding: '18px 24px', borderRadius: '16px 16px 0 0' }}>
                            <h3 style={{ margin: 0 }}>🗑️ Eliminar Favorito</h3>
                        </div>
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <p>¿Estás seguro de que deseas eliminar este taller de tus favoritos?</p>
                        </div>
                        <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => { setModalConfirmAbierto(false); setFavoritoAEliminar(null); }}>
                                Cancelar
                            </button>
                            <button style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={handleEliminarFavorito}>
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </Sidebar>
    );
};

export default ListaFavoritos;