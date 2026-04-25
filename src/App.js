/**
 * App.js - Componente principal de la aplicación
 * 
 * Este archivo configura todas las rutas (páginas) de la aplicación usando React Router.
 * PROTECCIÓN DE RUTAS:
 * - PrivateRoute: Verifica autenticación antes de mostrar contenido
 * - AdminRoute: Verifica autenticación + rol de administrador
 */

// IMPORTACIONES

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authService from './services/authService';
import usuarioAdminService from './services/usuarioAdminService';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Panel from './pages/Panel';
import ListaVehiculos from './pages/Vehiculos/ListaVehiculos';
import ListaCombustible from './pages/Combustible/ListaCombustible';
import ListaMantenimiento from './pages/Mantenimiento/ListaMantenimiento';
import MapaTalleres from './pages/Talleres/MapaTalleres';
import Notificaciones from './pages/Notificaciones/Notificaciones';
import ListaFavoritos from './pages/Favoritos/ListaFavoritos';
import ReporteCombustible from './pages/Reportes/ReporteCombustible';
import ReporteMantenimiento from './pages/Reportes/ReporteMantenimiento';
import ReporteGeneral from './pages/Reportes/ReporteGeneral';
import ListaUsuarios from './pages/Usuarios/ListaUsuarios';
import SeleccionarVehiculo from './pages/Combustible/SeleccionarVehiculo';

// COMPONENTE PARA PROTEGER RUTAS PRIVADAS

/**
 * PrivateRoute - Componente que protege rutas que requieren autenticación
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos (lo que se quiere proteger)
 * @returns {React.ReactNode} - Los hijos si está autenticado, o redirige al login
 * 
 * Funcionamiento:
 * - Si el usuario está autenticado → muestra el contenido (children)
 * - Si NO está autenticado → redirige al login ("/")
 */
const PrivateRoute = ({ children }) => {
    // isAuthenticated() devuelve true si hay un usuario en localStorage
    return authService.isAuthenticated() ? children : <Navigate to="/" />;
};

// COMPONENTE PARA PROTEGER RUTAS DE ADMINISTRADOR

/**
 * AdminRoute - Componente que protege rutas que requieren rol de administrador
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos (lo que se quiere proteger)
 * @returns {React.ReactNode} - Los hijos si es admin, o redirige al panel
 * 
 * Funcionamiento:
 * - Si el usuario es administrador → muestra el contenido (children)
 * - Si NO es administrador → redirige al panel principal
 */
const AdminRoute = ({ children }) => {
    // Verificar autenticación primero
    if (!authService.isAuthenticated()) {
        return <Navigate to="/" />;
    }
    // Verificar rol de administrador
    return usuarioAdminService.esAdmin() ? children : <Navigate to="/panel" />;
};

// COMPONENTE PRINCIPAL APP

function App() {
    return (
        /**
         * Router - Envuelve toda la aplicación para habilitar el enrutamiento
         * Todas las rutas deben estar dentro de un Router
         */
        <Router>
            {/**
             * Routes - Contenedor que agrupa todas las rutas
             * Solo una ruta se activa a la vez (la que coincide con la URL)
             */}
            <Routes>
                
                //RUTAS PÚBLICAS (sin autenticación)
                    
                
                // Ruta 1: Login (página principal)
                <Route path="/" element={<Login />} />
                
                //Ruta 2: Registro
                <Route path="/registro" element={<Registro />} />
                
                {/*
                    RUTAS PRIVADAS (requieren autenticación)
                    */}
                
                //Ruta 3: Panel principal
                <Route 
                    path="/panel" 
                    element={
                        <PrivateRoute>
                            <Panel />
                        </PrivateRoute>
                    } 
                />
                
                //Ruta 4: Lista de vehículos
                <Route 
                    path="/vehiculos" 
                    element={
                        <PrivateRoute>
                            <ListaVehiculos />
                        </PrivateRoute>
                    } 
                />

                {/* Privadas - IMPORTANTE: Las rutas con parámetros primero */}
    <Route path="/combustible/:idVehiculo" element={<PrivateRoute><ListaCombustible /></PrivateRoute>} />
    <Route path="/mantenimientos/:idVehiculo" element={<PrivateRoute><ListaMantenimiento /></PrivateRoute>} />
                
               <Route path="/combustible" element={<PrivateRoute><SeleccionarVehiculo tipo="combustible" /></PrivateRoute>} />
               
    <Route path="/mantenimientos" element={<PrivateRoute><SeleccionarVehiculo tipo="mantenimiento" /></PrivateRoute>} />
                
                // Ruta 7: Mapa de talleres
                <Route 
                    path="/talleres" 
                    element={
                        <PrivateRoute>
                            <MapaTalleres />
                        </PrivateRoute>
                    } 
                />
                
              // Ruta 8: Lista de talleres favoritos
                <Route 
                    path="/favoritos" 
                    element={
                        <PrivateRoute>
                            <ListaFavoritos />
                        </PrivateRoute>
                    } 
                />
                
                //Ruta 9: Centro de notificaciones y alertas
                <Route 
                    path="/notificaciones" 
                    element={
                        <PrivateRoute>
                            <Notificaciones />
                        </PrivateRoute>
                    } 
                />
                
                // Ruta 10: Reporte de combustible
                <Route 
                    path="/reportes/combustible" 
                    element={
                        <PrivateRoute>
                            <ReporteCombustible />
                        </PrivateRoute>
                    } 
                />
                
                //Ruta 11: Reporte de mantenimientos
                <Route 
                    path="/reportes/mantenimiento" 
                    element={
                        <PrivateRoute>
                            <ReporteMantenimiento />
                        </PrivateRoute>
                    } 
                />
                
                // Ruta 12: Reporte general de flota
                <Route 
                    path="/reportes/general" 
                    element={
                        <PrivateRoute>
                            <ReporteGeneral />
                        </PrivateRoute>
                    } 
                />
                
                //Ruta 13: Gestión de usuarios (solo administradores)
                 
                <Route 
                    path="/usuarios" 
                    element={
                        <AdminRoute>
                            <ListaUsuarios />
                        </AdminRoute>
                    } 
                />
                
                {/*
                    RUTA POR DEFECTO (404 - No encontrada)
                    */}
                
                /**
                 * Ruta comodín: Cualquier URL no definida
                 * Redirige al login
                 */
                <Route path="*" element={<Navigate to="/" />} />
                
            </Routes>
        </Router>
    );
}

export default App;