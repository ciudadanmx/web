import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import Conductor from '../components/Conductor';

const TaxisRoute = () => {
    const [activeTab, setActiveTab] = useState('usuario');
    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [error, setError] = useState(null);
    const [fromCoords, setFromCoords] = useState(null);
    const [toCoords, setToCoords] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_PLACES_KEY}`);
                    if (!response.ok) throw new Error("Error en la API de Google");
                    
                    const data = await response.json();
                    if (data.results.length > 0) {
                        setFromLocation(data.results[0].formatted_address);
                        setFromCoords({
                            lat: latitude,
                            lng: longitude
                        });
                    }
                } catch (err) {
                    setError("No se pudo obtener la ubicación");
                    console.error("Error obteniendo la ubicación:", err);
                }
            }, (err) => {
                setError("Permiso de ubicación denegado");
                console.error("Error de geolocalización:", err);
            });
        }
    }, []);

    const handleToLocationChange = async (e) => {
        const input = e.target.value;
        setToLocation(input);

        if (input.length > 2) {
            try {
                const response = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/autocomplete?input=${input}`);
                if (!response.ok) throw new Error("Error en el backend de Strapi");
                
                const data = await response.json();
                console.log("API Response:", data);
                
                if (data.predictions) {
                    setSuggestions(data.predictions);
                }
            } catch (error) {
                setError("Error al obtener sugerencias de autocompletar");
                console.error("Error fetching autocomplete suggestions:", error);
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setToLocation(suggestion.description);
        setSuggestions([]);

        // Obtener coordenadas del destino
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(suggestion.description)}&key=${process.env.REACT_APP_PLACES_KEY}`;
        fetch(geocodeUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    const destination = data.results[0].geometry.location;
                    setToCoords(destination);
                }
            })
            .catch(error => {
                setError("Error al obtener las coordenadas de destino");
                console.error("Error obteniendo coordenadas de destino:", error);
            });
    };

    const renderMap = () => {
        if (fromCoords && toCoords) {
            const google = window.google;
            const map = new google.maps.Map(document.getElementById('map'), {
                center: fromCoords,
                zoom: 13
            });

            new google.maps.Marker({
                position: fromCoords,
                map: map,
                title: "Tu ubicación"
            });

            new google.maps.Marker({
                position: toCoords,
                map: map,
                title: "Destino"
            });

            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);

            const request = {
                origin: fromCoords,
                destination: toCoords,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(result);
                } else {
                    setError("No se pudo obtener la ruta");
                    console.error("Error al obtener la ruta:", status);
                }
            });
        }
    };

    useEffect(() => {
        if (fromCoords && toCoords) {
            renderMap();
        }
    }, [fromCoords, toCoords]);

    return (
        <div style={{ width: '90%', height: '100vh', overflow: 'hidden', padding: '20px' }}>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <div style={{ display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '20px' }}>
                <button 
                    onClick={() => setActiveTab('usuario')} 
                    style={{ flex: 1, padding: '10px', cursor: 'pointer', background: activeTab === 'usuario' ? '#fff200' : '#fff' }}>
                    Usuario
                </button>
                <button 
                    onClick={() => setActiveTab('conductor')} 
                    style={{ flex: 1, padding: '10px', cursor: 'pointer', background: activeTab === 'conductor' ? '#fff200' : '#fff' }}>
                    Conductor
                </button>
            </div>

            {activeTab === 'usuario' ? (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', marginBottom: '10px' }}>
                        <FaMapMarkerAlt style={{ color: '#ff5722' }} />
                        <input 
                            type="text" 
                            placeholder="Desde..." 
                            value={fromLocation} 
                            readOnly 
                            style={{ padding: '10px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', position: 'relative' }}>
                        <FaMapMarkerAlt style={{ color: '#ff5722' }} />
                        <input 
                            type="text" 
                            placeholder="¿A dónde vamos?" 
                            value={toLocation}
                            onChange={handleToLocationChange}
                            style={{ padding: '10px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        {suggestions.length > 0 && (
                            <ul style={{ position: 'absolute', top: '40px', left: '40px', width: 'calc(100% - 40px)', background: 'white', border: '1px solid #ccc', listStyle: 'none', padding: 0, margin: 0, zIndex: 10 }}>
                                {suggestions.map((suggestion) => (
                                    <li key={suggestion.place_id} onClick={() => handleSuggestionClick(suggestion)}
                                        style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #ddd' }}>
                                        {suggestion.description}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : (
                <Conductor />
            )}

            {/* Map section */}
            <div id="map" style={{ width: '100%', height: '400px', marginTop: '20px' }}></div>
        </div>
    );
};

export default TaxisRoute;
