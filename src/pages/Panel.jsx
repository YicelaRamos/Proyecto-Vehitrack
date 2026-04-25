/**
 * Panel.jsx - Dashboard principal de la aplicación
 *
 * Página de inicio tras el login. Muestra un header con logo y datos del usuario,
 * un menú lateral deslizante con navegación a todos los módulos, y un grid de
 * tarjetas de acceso rápido. Si el usuario es admin, se agrega la opción de
 * gestión de usuarios tanto en el menú como en las tarjetas.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar';  
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCar, faGasPump, faWrench, faMapMarkerAlt, faStar, faBell, faChartBar} from '../assets/icons';
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet"></link>

const Panel = () => {
    const navigate = useNavigate();
    const usuario = authService.getCurrentUser();  // Obtenemos el usuario logueado desde el "servicio"

    // Seguridad: si no hay usuario (por ejemplo, alguien intenta entrar directamente por URL), redirige al login
    if (!usuario) {
        navigate('/');
        return null;
    }

    // Lista de tarjetas del dashboard. Cada una tiene icono, texto y ruta de navegación.
    const dashboardCards = [
        { id: 1, icono: faCar, titulo: 'Vehículos', descripcion: 'Gestione la flota de vehículos', ruta: '/vehiculos' },
        { id: 2, icono: faGasPump, titulo: 'Combustible', descripcion: 'Control gastos y eficiencia', ruta: '/combustible' },
        { id: 3, icono: faWrench, titulo: 'Mantenimiento', descripcion: 'Historial de servicios', ruta: '/mantenimientos' },
        { id: 4, icono: faMapMarkerAlt, titulo: 'Talleres', descripcion: 'Mapa y directorio', ruta: '/talleres' },
        { id: 5, icono: faStar, titulo: 'Favoritos', descripcion: 'Tus talleres favoritos', ruta: '/favoritos' },
        { id: 6, icono: faBell, titulo: 'Notificaciones', descripcion: 'Alertas y vencimientos', ruta: '/notificaciones' },
        { id: 7, icono: faChartBar, titulo: 'Reportes', descripcion: 'Exporta en PDF y CSV', ruta: '/reportes/combustible' },
    ];

    // Estilos en línea para simplificar (normalmente se usarían clases, pero así es más rápido de prototipar)
    const styles = {
        welcomeCard: {
            backgroundColor: '#0a2351',
            borderRadius: '20px',
            padding: '50px',
            marginBottom: '50px',
            color: 'white',
            boxShadow: '0 8px 15px rgba(0,0,0,0.1)',
            textAlign: 'center'
        },
        welcomeTitle: {
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '8px'
        },
        welcomeText: {
            fontSize: '16px',
            opacity: 0.9,
            margin: 0
        },
        cardsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '150px',
            marginTop: '20px'
        },
        card: {
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '45px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
            border: '1px solid #eef2f7',
            textAlign: 'center'
        },
        cardIcon: {
            fontSize: '48px',
            marginBottom: '15px',
            color: '#0a2351'
        },
        cardTitle: {
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a2b4c',
            marginBottom: '10px'
        },
        cardDescription: {
            fontSize: '14px',
            color: '#6c757d',
            marginBottom: '20px',
            lineHeight: '1.5'
        },
        cardBtn: {
            backgroundColor: 'transparent',
            color: '#0a2351',
            border: '1px solid #0a2351',
            padding: '8px 20px',
            borderRadius: '30px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s'
        }
    };

    return (
        // Sidebar envuelve todo el contenido, ya que el layout tiene menú lateral fijo
        <Sidebar tituloPagina="Panel Principal">
            <div>
                {/* Tarjeta de bienvenida con el nombre del usuario */}
                <div style={styles.welcomeCard}>
                    <h2 style={styles.welcomeTitle}>Bienvenido, {usuario.nombre}</h2>
                    <p style={styles.welcomeText}>Control Total de tu Vehículo en un solo lugar</p>
                </div>

                {/* Grid de tarjetas: cada una navega a su ruta al hacer clic */}
                <div style={styles.cardsGrid}>
                    {dashboardCards.map(card => (
                        <div 
                            key={card.id} 
                            style={styles.card} 
                            onClick={() => navigate(card.ruta)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={styles.cardIcon}>
                                <FontAwesomeIcon icon={card.icono} />
                            </div>
                            <h3 style={styles.cardTitle}>{card.titulo}</h3>
                            <p style={styles.cardDescription}>{card.descripcion}</p>
                            {/* Botón estilizado como accesorio, aunque toda la tarjeta es cliqueable */}
                            <button style={styles.cardBtn}>Acceder →</button>
                        </div>
                    ))}
                </div>
            </div>
        </Sidebar>
    );
};

export default Panel;