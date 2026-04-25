/**
 * MapaTalleres.jsx - Mapa interactivo y directorio de talleres
 *
 * Muestra un mapa Leaflet con marcadores de talleres y un panel lateral
 * con listado filtrable por ciudad, servicio y búsqueda de texto.
 * Incluye botón de geolocalización para centrar el mapa en la posición
 * del usuario. Al seleccionar un taller se abre un modal con sus detalles.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import tallerService from '../../services/tallerService';
import authService from '../../services/authService';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ícono estándar de Leaflet. Lo definimos así porque Webpack a veces no carga bien las imágenes por defecto.
// Usamos la CDN de Leaflet para asegurar que se vean los marcadores.
const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Marcador azul para la ubicación actual del usuario (descargado de un repo de marcadores de colores)
const userLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

/**
 * Componente auxiliar que permite cambiar la vista del mapa (centro y zoom) desde fuera.
 * React Leaflet no permite actualizar el centro directamente, por eso usamos este hook.
 */
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center && zoom) map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

/**
 * Botón flotante que obtiene la ubicación actual del usuario usando la API de Geolocalización.
 * Muestra errores amigables según el código (permiso denegado, timeout, etc.).
 */
function LocationButton({ setCenter, setZoom, setUserLocation, setUserLocationMarker }) {
    const map = useMap();
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState(null);

    const getLocation = () => {
        setLocating(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Tu navegador no soporta geolocalización');
            setLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const userLatLng = { lat: latitude, lng: longitude };
                map.setView(userLatLng, 15);
                setCenter(userLatLng);
                setZoom(15);
                setUserLocation(userLatLng);
                setUserLocationMarker(true);
                setLocating(false);
            },
            (error) => {
                // Traducimos los códigos de error a mensajes entendibles para el usuario
                const mensajes = {
                    [error.PERMISSION_DENIED]: 'Permiso denegado. Activa la ubicación en tu navegador.',
                    [error.POSITION_UNAVAILABLE]: 'No se pudo obtener tu ubicación.',
                    [error.TIMEOUT]: 'Tiempo de espera agotado.'
                };
                setError(mensajes[error.code] || 'Error al obtener tu ubicación.');
                setLocating(false);
            },
            {
                enableHighAccuracy: true, // Usa GPS si está disponible (más preciso)
                timeout: 10000,
                maximumAge: 0            // No usa caché de ubicación para obtener la posición más fresca
            }
        );
    };

    return (
        <div style={{
            position: 'absolute', bottom: '20px', right: '20px',
            zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
            <button
                onClick={getLocation}
                disabled={locating}
                title="Ir a mi ubicación actual"
                style={{
                    backgroundColor: '#28a745', color: 'white', border: 'none',
                    borderRadius: '50%', width: '48px', height: '48px',
                    cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', transition: 'all 0.3s'
                }}
            >
                {locating ? '⏳' : '📍'}
            </button>
            {error && (
                <div style={{
                    backgroundColor: '#dc3545', color: 'white', padding: '8px 12px',
                    borderRadius: '8px', fontSize: '12px', maxWidth: '200px', textAlign: 'center'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
}

const MapaTalleres = () => {

    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();

    const [talleres, setTalleres] = useState([]);
    const [talleresOriginales, setTalleresOriginales] = useState([]); // Copia sin filtrar, para resetear filtros
    const [loading, setLoading] = useState(true);
    const [tallerSeleccionado, setTallerSeleccionado] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [filtros, setFiltros] = useState({ ciudad: '', servicio: '', busqueda: '' });
    const [serviciosUnicos, setServiciosUnicos] = useState([]);
    const [ciudadesUnicas, setCiudadesUnicas] = useState([]);
    // Centro inicial: Medellín (coordenadas por defecto)
    const [centroMapa, setCentroMapa] = useState({ lat: 6.2476, lng: -75.5658 });
    const [zoomMapa, setZoomMapa] = useState(13);
    const [userLocation, setUserLocation] = useState(null);
    const [showUserMarker, setShowUserMarker] = useState(false);

    useEffect(() => {
        cargarTalleres();
        cargarOpcionesFiltro();
    }, []);

    // Cada vez que cambia algún filtro, volvemos a aplicar los filtros sobre los datos originales
    useEffect(() => {
        aplicarFiltros();
    }, [filtros]);

    const cargarTalleres = async () => {
        setLoading(true);
        const data = await tallerService.obtenerTodos();
        setTalleresOriginales(data);
        setTalleres(data);
        setLoading(false);
    };

    // Carga las listas de valores únicos para los selectores de filtro (servicios y ciudades)
    const cargarOpcionesFiltro = async () => {
        const servicios = await tallerService.obtenerServiciosUnicos();
        const ciudades = await tallerService.obtenerCiudadesUnicas();
        setServiciosUnicos(servicios);
        setCiudadesUnicas(ciudades);
    };

    const aplicarFiltros = () => {
        let resultado = [...talleresOriginales];

        if (filtros.ciudad) {
            resultado = resultado.filter(t => t.ciudad === filtros.ciudad);
            // Si filtramos por ciudad, centramos el mapa en las coordenadas de esa ciudad (definidas en el servicio)
            const centro = tallerService.obtenerCentroCiudad(filtros.ciudad);
            setCentroMapa(centro);
        }

        if (filtros.servicio) {
            resultado = resultado.filter(t =>
                t.servicios.some(s => s === filtros.servicio)
            );
        }

        if (filtros.busqueda) {
            const busquedaLower = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(t =>
                t.nombre.toLowerCase().includes(busquedaLower) ||
                t.direccion.toLowerCase().includes(busquedaLower) ||
                t.ciudad.toLowerCase().includes(busquedaLower)
            );
        }

        setTalleres(resultado);
    };

    const handleCambioFiltro = (nombre, valor) => {
        setFiltros(prev => ({ ...prev, [nombre]: valor }));
    };

    const handleLimpiarFiltros = () => {
        setFiltros({ ciudad: '', servicio: '', busqueda: '' });
        // Vuelve al centro por defecto (Medellín)
        setCentroMapa({ lat: 6.2476, lng: -75.5658 });
        setZoomMapa(13);
        setShowUserMarker(false);
        setUserLocation(null);
    };

    // Al hacer clic en un taller (desde el mapa o desde la lista), centramos el mapa en él con mayor zoom
    const handleSeleccionarTaller = (taller) => {
        setTallerSeleccionado(taller);
        setCentroMapa({ lat: taller.lat, lng: taller.lng });
        setZoomMapa(16);
    };

    const handleAbrirModal = (taller) => {
        setTallerSeleccionado(taller);
        setModalAbierto(true);
    };

    // Convierte un número decimal (ej: 4.5) en cadena de estrellas (★★★★½)
    // Esto es solo visual, se redondea hacia abajo.
    const formatearCalificacion = (calificacion) => {
        return '★'.repeat(Math.floor(calificacion)) + '☆'.repeat(5 - Math.floor(calificacion));
    };

    const buttonStyles = {
        primary: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
        limpiar: { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
    };

    const selectStyles = {
        padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px',
        fontSize: '14px', backgroundColor: 'white', cursor: 'pointer'
    };

    const inputStyles = {
        padding: '8px 12px', border: '1px solid #ddd',
        borderRadius: '8px', fontSize: '14px', width: '200px'
    };

    if (!usuario) {
        navigate('/');
        return null;
    }

    return (
        <Sidebar tituloPagina="📍 Talleres y Centros de Servicio">

            {/* Barra de filtros */}
            <div style={{
                display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px',
                padding: '15px', backgroundColor: 'white', borderRadius: '12px', alignItems: 'center'
            }}>
                <select style={selectStyles} value={filtros.ciudad} onChange={(e) => handleCambioFiltro('ciudad', e.target.value)}>
                    <option value="">Todas las ciudades</option>
                    {ciudadesUnicas.map(ciudad => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                </select>

                <select style={selectStyles} value={filtros.servicio} onChange={(e) => handleCambioFiltro('servicio', e.target.value)}>
                    <option value="">Todos los servicios</option>
                    {serviciosUnicos.map(servicio => (
                        <option key={servicio} value={servicio}>{servicio}</option>
                    ))}
                </select>

                <input
                    type="text"
                    style={inputStyles}
                    placeholder="Buscar por nombre o dirección..."
                    value={filtros.busqueda}
                    onChange={(e) => handleCambioFiltro('busqueda', e.target.value)}
                />

                <button style={buttonStyles.limpiar} onClick={handleLimpiarFiltros}>
                    Limpiar filtros
                </button>
            </div>

            {/* Mapa y directorio en paralelo */}
            <div style={{ display: 'flex', gap: '20px', minHeight: '500px', flexWrap: 'wrap' }}>

                {/* Panel del mapa */}
                <div style={{ flex: 2, backgroundColor: '#e9ecef', borderRadius: '12px', overflow: 'hidden', minHeight: '500px', position: 'relative' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
                            Cargando mapa...
                        </div>
                    ) : (
                        <MapContainer
                            center={[centroMapa.lat, centroMapa.lng]}
                            zoom={zoomMapa}
                            style={{ height: '500px', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            {/* Componente auxiliar para cambiar vista programáticamente */}
                            <ChangeView center={[centroMapa.lat, centroMapa.lng]} zoom={zoomMapa} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Marcador de ubicación del usuario (opcional, se muestra solo si se activó) */}
                            {showUserMarker && userLocation && (
                                <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                                    <Popup>
                                        <strong>📍 Tu ubicación</strong><br />
                                        Latitud: {userLocation.lat.toFixed(6)}<br />
                                        Longitud: {userLocation.lng.toFixed(6)}
                                    </Popup>
                                </Marker>
                            )}

                            {/* Marcadores de talleres */}
                            {talleres.map((taller) => (
                                <Marker
                                    key={taller.id}
                                    position={[taller.lat, taller.lng]}
                                    icon={defaultIcon}
                                    eventHandlers={{ click: () => handleSeleccionarTaller(taller) }}
                                >
                                    <Popup>
                                        <div>
                                            <strong>{taller.nombre}</strong><br />
                                            {taller.direccion}<br />
                                            <span style={{ color: '#28a745' }}>⭐ {taller.calificacion}</span><br />
                                            <button
                                                style={{ marginTop: '8px', padding: '4px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                                onClick={() => handleAbrirModal(taller)}
                                            >
                                                Ver detalles
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                            <LocationButton
                                setCenter={setCentroMapa}
                                setZoom={setZoomMapa}
                                setUserLocation={setUserLocation}
                                setUserLocationMarker={setShowUserMarker}
                            />
                        </MapContainer>
                    )}
                </div>

                {/* Panel del directorio (lista de talleres) */}
                <div style={{
                    flex: 1, backgroundColor: 'white', borderRadius: '12px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: '280px'
                }}>
                    <div style={{ padding: '15px 20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                        <h3 style={{ margin: 0 }}>Directorio de Talleres</h3>
                        <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#6c757d' }}>{talleres.length} talleres encontrados</p>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '15px', maxHeight: '500px' }}>
                        {loading ? (
                            <div>Cargando...</div>
                        ) : talleres.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                No hay talleres que coincidan con los filtros seleccionados.
                            </div>
                        ) : (
                            talleres.map((taller) => (
                                <div
                                    key={taller.id}
                                    style={{
                                        backgroundColor: 'white',
                                        border: `1px solid ${tallerSeleccionado?.id === taller.id ? '#28a745' : '#e0e0e0'}`,
                                        borderRadius: '12px', padding: '15px', marginBottom: '12px',
                                        cursor: 'pointer', transition: 'all 0.3s',
                                        // Si este taller es el que está seleccionado en el mapa, se resalta con sombra verde
                                        boxShadow: tallerSeleccionado?.id === taller.id ? '0 4px 12px rgba(40,167,69,0.2)' : 'none'
                                    }}
                                    onClick={() => handleSeleccionarTaller(taller)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{taller.nombre}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ color: '#ffc107' }}>{formatearCalificacion(taller.calificacion)}</span>
                                            <span>({taller.calificacion})</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        📍 {taller.direccion}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                        {/* Mostramos solo los primeros 3 servicios para no saturar, y un indicador de "más" si hay más */}
                                        {taller.servicios.slice(0, 3).map((servicio, idx) => (
                                            <span key={idx} style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '3px 8px', borderRadius: '15px', fontSize: '11px' }}>
                                                {servicio}
                                            </span>
                                        ))}
                                        {taller.servicios.length > 3 && (
                                            <span style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '3px 8px', borderRadius: '15px', fontSize: '11px' }}>
                                                +{taller.servicios.length - 3} más
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#28a745', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        📞 {taller.telefono}
                                    </div>
                                    <button
                                        style={{ ...buttonStyles.primary, marginTop: '12px', width: '100%' }}
                                        onClick={(e) => { e.stopPropagation(); handleAbrirModal(taller); }}
                                    >
                                        Ver detalles
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de detalles del taller */}
            {modalAbierto && tallerSeleccionado && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', width: '90%',
                        maxWidth: '500px', maxHeight: '90vh', overflow: 'auto',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            backgroundColor: '#28a745', color: 'white', padding: '18px 24px',
                            borderRadius: '16px 16px 0 0', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>{tallerSeleccionado.nombre}</h3>
                            <button
                                style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}
                                onClick={() => setModalAbierto(false)}
                            >×</button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            {/* Listado de campos del taller: dirección, teléfono, email, calificación, horario */}
                            {[
                                { label: '📍 Dirección', value: tallerSeleccionado.direccion },
                                { label: '📞 Teléfono', value: tallerSeleccionado.telefono },
                                { label: '📧 Correo Electrónico', value: tallerSeleccionado.email },
                                { label: '⭐ Calificación', value: `${formatearCalificacion(tallerSeleccionado.calificacion)} (${tallerSeleccionado.calificacion}/5)` },
                                { label: '🕐 Horario de Atención', value: tallerSeleccionado.horario },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ marginBottom: '16px' }}>
                                    <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '5px', fontSize: '13px' }}>{label}</div>
                                    <div style={{ color: '#333', fontSize: '14px' }}>{value}</div>
                                </div>
                            ))}

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '5px', fontSize: '13px' }}>🛠️ Servicios Ofrecidos</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                    {tallerSeleccionado.servicios.map((servicio, idx) => (
                                        <span key={idx} style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                                            {servicio}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => setModalAbierto(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </Sidebar>
    );
};

export default MapaTalleres;