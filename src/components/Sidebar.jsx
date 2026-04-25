/**
 * Sidebar.jsx - Menú lateral reutilizable de la aplicación
 *
 * Componente de layout que envuelve todas las páginas que necesitan navegación.
 * Incluye menú colapsable con secciones por módulo, resaltado del ítem activo
 * basado en la URL actual, e información del usuario logueado. La sección de
 * administración solo se muestra si el usuario tiene rol admin.
 *
 * ⚠️ El ítem "Dashboard" apunta a /dashboard — verificar si esa ruta existe.
 *
 * @param {React.ReactNode} children       - Contenido principal de la página
 * @param {string}          tituloPagina   - Título que se muestra en el header del contenido
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import usuarioAdminService from '../services/usuarioAdminService';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faFileAlt, faCar, faGasPump, faWrench, faMapMarkerAlt, faStar, faBell, faChartBar, faUser, faUsers, faRightFromBracket} from '../assets/icons'


const Sidebar = ({ children, tituloPagina }) => {
    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };
    const navigate = useNavigate();
    const location = useLocation();
    const usuario = authService.getCurrentUser();
    const esAdmin = usuarioAdminService.esAdmin();
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => setCollapsed(!collapsed);

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };
  
    // Devuelve true si la ruta actual coincide exactamente o es subpágina de path
    // Ítem individual del menú — muestra tooltip cuando el sidebar está colapsado
const MenuItem = ({ icono, texto, ruta, onClick }) => {
    return (
        <li className={`sidebar-item ${isActive(ruta) ? 'active' : ''}`}>
            <button
                className="sidebar-link"
                onClick={() => {
                    if (onClick) {
                        onClick();
                    } else {
                        navigate(ruta);
                    }
                }}
            >
                <span className="sidebar-icon">
                    <FontAwesomeIcon icon={icono} />
                </span>

                {!collapsed && (
                    <span className="sidebar-text">{texto}</span>
                )}
            </button>
        </li>
    );
};

    const MenuDivider = () => <li className="sidebar-divider"></li>;

    // El título de sección solo se renderiza cuando el sidebar está expandido
    const MenuTitle = ({ texto }) => (
        !collapsed && <li className="sidebar-title"><span>{texto}</span></li>
    );

    return (
        <div className="sidebar-layout">

            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

                {/* Botón flotante para colapsar/expandir */}
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    {collapsed ? '☰' : '◀'}
                </button>

                <div className="sidebar-logo">
                     <h2> VEHITRACK</h2> 
                </div>

                <ul className="sidebar-menu">

                    <MenuTitle texto="PRINCIPAL" />
                    <MenuItem icono={faHome} texto="Panel Principal" ruta="/panel" />
                    <MenuDivider />

                    <MenuTitle texto="VEHÍCULOS" />
                    <MenuItem icono={faCar} texto="Mis Vehículos" ruta="/vehiculos" />
                    <MenuItem icono={faGasPump} texto="Combustible" ruta="/combustible" />
                    <MenuItem icono={faWrench} texto="Mantenimientos" ruta="/mantenimientos" />
                    <MenuDivider />

                    <MenuTitle texto="TALLERES" />
                    <MenuItem icono={faMapMarkerAlt} texto="Talleres Cercanos" ruta="/talleres" />
                    <MenuItem icono={faStar} texto="Talleres Favoritos" ruta="/favoritos" />
                    <MenuDivider />

                    <MenuTitle texto="INFORMACIÓN" />
                    <MenuItem icono={faBell} texto="Notificaciones" ruta="/notificaciones" />
                    <MenuItem icono={faFileAlt} texto="Reporte Combustible" ruta="/reportes/combustible" />
                    <MenuItem icono={faFileAlt} texto="Reporte Mantenimiento" ruta="/reportes/mantenimiento" />
                    <MenuItem icono={faChartBar} texto="Reporte General" ruta="/reportes/general" />
                    <MenuDivider />


                    {/* La sección de administración solo se monta si el usuario es admin */}
                    {esAdmin && (
                        <>
                            <MenuTitle texto="ADMINISTRACIÓN" />
                            <MenuItem icono={faUsers} texto="Gestión Usuarios" ruta="/usuarios" />
                            <MenuDivider />
                        </>
                    )}

                    <MenuTitle texto="USUARIO" />
                    <li className="sidebar-item">
                        <div className="sidebar-user-info">
                            {!collapsed ? (
                                <>
                                     <span className="sidebar-user-icon">
                                        <FontAwesomeIcon icon={faUser} />
                                     </span>
                                    <div className="sidebar-user-details">
                                        <span className="sidebar-user-name">{usuario?.nombre} {usuario?.apellido}</span>
                                        <span className="sidebar-user-email">{usuario?.email}</span>
                                    </div>
                                </>
                            ) : (
                                <span className="sidebar-user-icon">
                                   <FontAwesomeIcon icon={faUser} />
                                </span>
                            )}
                        </div>
                    </li>
                    <MenuItem icono={faRightFromBracket} texto="Cerrar Sesión" onClick={handleLogout} />

                </ul>
            </aside>

            <main className="sidebar-content">
                <div className="sidebar-content-header">
                    <h1>{tituloPagina || 'VehiTrack'}</h1>
                </div>
                <div className="sidebar-content-body">
                    {children}
                </div>
            </main>

        </div>
    );
};

export default Sidebar;