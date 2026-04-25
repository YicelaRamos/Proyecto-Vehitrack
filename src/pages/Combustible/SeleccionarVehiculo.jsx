/**
 * SeleccionarVehiculo.jsx - Componente intermedio para elegir un vehículo antes de registrar combustible o mantenimiento
 *
 * Este componente se usa como paso previo cuando el usuario quiere registrar un gasto de combustible
 * o un mantenimiento, pero no ha seleccionado un vehículo específico. Recibe una prom`tipo` que puede
 * ser 'combustible' o 'mantenimiento' y redirige a la ruta correspondiente con el ID del vehículo elegido.
 *
 * @param {Object} props
 * @param {string} props.tipo - 'combustible' o 'mantenimiento' (determina a dónde redirigir)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import vehiculoService from '../../services/vehiculoService';
import './SeleccionarVehiculo.css';

const SeleccionarVehiculo = ({ tipo }) => {
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Al montar, cargamos la lista de vehículos del usuario
    useEffect(() => {
        const cargarVehiculos = async () => {
            try {
                const lista = await vehiculoService.listarPorUsuario();
                setVehiculos(lista);
            } catch (error) {
                console.error('Error cargando vehículos:', error);
                // Aquí podríamos mostrar un mensaje de error al usuario, pero por ahora solo log
            } finally {
                setLoading(false);
            }
        };
        cargarVehiculos();
    }, []);

    // Cuando el usuario hace clic en una tarjeta de vehículo, redirige a la ruta correspondiente
    const handleSeleccionar = (idVehiculo) => {
        console.log('Navegando a:', `/${tipo}/${idVehiculo}`); // útil para debug
        if (tipo === 'combustible') {
            navigate(`/combustible/${idVehiculo}`);
        } else {
            navigate(`/mantenimientos/${idVehiculo}`);
        }
    };

    // Título dinámico según el tipo
    const titulo = tipo === 'combustible' ? 'Registrar Combustible' : 'Registrar Mantenimiento';

    if (loading) {
        return (
            <Sidebar tituloPagina={titulo}>
                <div className="cargando">Cargando vehículos...</div>
            </Sidebar>
        );
    }

    return (
        <Sidebar tituloPagina={titulo}>
            <div className="seleccionar-vehiculo-container">
                <h2>Selecciona un vehículo</h2>
                {vehiculos.length === 0 ? (
                    // Si no hay vehículos, mostramos un mensaje de error y un botón para agregar uno
                    <div className="alert-error">
                        <p>⚠️ No tienes vehículos registrados.</p>
                        <p>Para registrar {tipo === 'combustible' ? 'combustible' : 'mantenimiento'}, primero debes agregar un vehículo.</p>
                        <button 
                            className="btn-agregar-vehiculo"
                            onClick={() => navigate('/vehiculos')}
                        >
                            + Agregar Vehículo
                        </button>
                    </div>
                ) : (
                    <div className="lista-vehiculos">
                        {vehiculos.map(veh => (
                            <div 
                                key={veh.id_vehiculo} 
                                className="vehiculo-card"
                                onClick={() => handleSeleccionar(veh.id_vehiculo)}
                            >
                                <h3>{veh.marca} {veh.modelo}</h3>
                                <p>Placa: {veh.placa}</p>
                                <p>Kilometraje: {veh.kilometraje_actual.toLocaleString()} km</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Sidebar>
    );
};

export default SeleccionarVehiculo;