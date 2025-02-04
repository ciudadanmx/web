import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { GoogleMap, LoadScript, Circle, Marker } from '@react-google-maps/api';
import { computeDistanceBetween, LatLng } from 'spherical-geometry-js';

const mapContainerStyle = {
    width: '100%',
    height: '500px'
};

const defaultCenter = {
    lat: 19.432608,
    lng: -99.133209
};

const TachisRoute = () => {
    const [fromLocation, setFromLocation] = useState(defaultCenter);
    const [drivers, setDrivers] = useState([
        { id: 1, lat: 19.4329, lng: -99.1334 },
        { id: 2, lat: 19.4350, lng: -99.1300 },
        { id: 3, lat: 19.4305, lng: -99.1350 } // Ajuste para estar dentro de los 2km
    ]);
    const [nearbyDrivers, setNearbyDrivers] = useState([]);

    useEffect(() => {
        findNearbyDrivers();
    }, [fromLocation, drivers]);

    const findNearbyDrivers = () => {
        const radius = 2000; // 2 km
        const nearby = drivers.filter(driver => {
            const driverPosition = new LatLng(driver.lat, driver.lng);
            const userPosition = new LatLng(fromLocation.lat, fromLocation.lng);
            const distance = computeDistanceBetween(userPosition, driverPosition);
            console.log(`Driver ${driver.id} - Distance: ${distance} meters`);
            return distance <= radius;
        });
        setNearbyDrivers(nearby);
        console.log("Nearby Drivers:", nearby);
    };

    return (
        <div style={{ width: '100%', height: '100vh', padding: '20px' }}>
            <h2>Selecciona tu ubicación</h2>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <FaMapMarkerAlt style={{ color: '#ff5722' }} />
                <input 
                    type="text" 
                    placeholder="Ubicación inicial" 
                    value={`Lat: ${fromLocation.lat}, Lng: ${fromLocation.lng}`} 
                    readOnly 
                    style={{ padding: '10px', width: '100%', border: '1px solid #ccc', borderRadius: '5px' }}
                />
            </div>
            <LoadScript googleMapsApiKey={process.env.REACT_APP_PLACES_KEY} libraries={["geometry"]}>
                <GoogleMap 
                    mapContainerStyle={mapContainerStyle} 
                    center={fromLocation} 
                    zoom={14}>
                    <Marker position={fromLocation} label="📍" />
                    <Circle center={fromLocation} radius={2000} options={{ strokeColor: '#FF0000' }} />
                    {nearbyDrivers.map(driver => (
                        <Marker key={driver.id} position={{ lat: driver.lat, lng: driver.lng }} label="🚖" />
                    ))}
                </GoogleMap>
            </LoadScript>
        </div>
    );
};

export default TachisRoute;
