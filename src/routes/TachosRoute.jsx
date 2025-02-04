import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

const TachosRoute = () => {
    const zocaloCoords = { lat: 19.432608, lng: -99.133209 }; // Coordenadas del Zócalo de CDMX
    const [fromLocation, setFromLocation] = useState('Zócalo, CDMX'); // Dirección inicial
    const [toLocation, setToLocation] = useState(''); // Dirección destino
    const [fromSuggestions, setFromSuggestions] = useState([]); // Sugerencias del autocompletar
    const [error, setError] = useState(null); // Errores posibles
    const [taxiCoords, setTaxiCoords] = useState([]); // Coordenadas de los taxistas
    const [map, setMap] = useState(null); // Referencia al mapa de Google
    const [marker, setMarker] = useState(null); // Referencia al marcador de la ubicación inicial

    // Definir una colección fija de coordenadas de taxistas para simular la base de datos
    const taxiData = [
        { id: 1, lat: 19.434, lng: -99.132 },
        { id: 2, lat: 19.436, lng: -99.133 },
        { id: 3, lat: 19.437, lng: -99.134 },
        { id: 4, lat: 19.430, lng: -99.135 },
        { id: 5, lat: 19.428, lng: -99.137 },
    ];

    // Simular la obtención de las coordenadas de los taxistas
    useEffect(() => {
        setTaxiCoords(taxiData); // Simulamos que obtenemos las coordenadas de los taxistas
    }, []);

    // Cargar Google Maps API
    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_PLACES_KEY}&libraries=places`;
        script.async = true;
        script.onload = () => {
            if (window.google) {
                initializeMap(); // Inicializar el mapa una vez que el script esté cargado
            }
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script); // Limpiar el script cuando el componente se desmonte
        };
    }, []);

    const initializeMap = () => {
        const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
            center: zocaloCoords,
            zoom: 15,
        });

        setMap(mapInstance);

        // Crear marcador en Zócalo
        const initialMarker = new window.google.maps.Marker({
            position: zocaloCoords,
            map: mapInstance,
            title: "Zócalo, CDMX",
        });

        setMarker(initialMarker);

        // Mostrar los markers de los taxistas
        taxiCoords.forEach((taxi) => {
            new window.google.maps.Marker({
                position: { lat: taxi.lat, lng: taxi.lng },
                map: mapInstance,
                title: `Taxi ${taxi.id}`,
                icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png", // Icono personalizado para los taxistas
            });
        });

        
        
        // Autocompletar para la dirección de destino
        /* const autocomplete = new window.google.maps.places.Autocomplete(document.getElementById('destination-input'), {
            types: ['address'],
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                // Actualizar la dirección destino
                setToLocation(place.formatted_address);
            }
        }); */


        const fromAutocomplete = new window.google.maps.places.Autocomplete(document.getElementById('from-input'), {
            types: ['address'],
        });

        fromAutocomplete.addListener('from_place_changed', () => {
            const from_place = fromAutocomplete.getPlace();
            if (from_place.geometry) {
                // Actualizar la dirección destino
                setFromLocation(from_place.formatted_address);
            }
        });
    };

    // Manejar el cambio en el campo de la dirección de inicio
    /* const handleToLocationChange = (e) => {
        const input = e.target.value;
        setToLocation(input);

        if (map && marker) {
            // Aquí puedes hacer una búsqueda para encontrar las coordenadas basadas en el nombre
            // En este ejemplo estamos utilizando Zócalo como coordenada base si no se encuentra la dirección
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: input }, (results, status) => {
                if (status === "OK" && results[0]) {
                    const newCoords = results[0].geometry.location;
                    // Actualizar el marcador
                    marker.setPosition(newCoords);
                    map.setCenter(newCoords);
                }
            });
        }
    }; */

    // Manejar el cambio en el campo de la dirección de destino
    const handleFromLocationChange = async (e) => {
        const input = e.target.value;
        setFromLocation(input);

        if (input.length > 2) {
            try {
                const response = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/autocomplete?input=${input}`);
                if (!response.ok) throw new Error("Error en el backend de Strapi");

                const data = await response.json();
                console.log("API Response:", data);

                if (data.predictions) {
                    setFromSuggestions(data.predictions);
                }
            } catch (error) {
                setError("Error al obtener sugerencias de autocompletar");
                console.error("Error fetching autocomplete suggestions:", error);
            }
        } else {
            setFromSuggestions([]);
        }
    };

    // Manejar la selección de una sugerencia
    const handleFromSuggestionClick = (suggestion) => {
        setFromLocation(suggestion.description);
        setFromSuggestions([]);
    };

    return (
        <div style={{ width: '90%', height: '100vh', overflow: 'hidden', padding: '20px' }}>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            

            <div>
                {/* Campo de dirección de inicio editable */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', marginBottom: '10px' }}>
                    <FaMapMarkerAlt style={{ color: '#ff5722' }} />
                    <input 
                        type="text" 
                        placeholder="Desde..." 
                        value={fromLocation} 
                        onChange={handleFromLocationChange} // Permitir edición
                        style={{ padding: '10px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                        id="from-input"
                    />
                </div>

                {/* {suggestions.length > 0 && (
                        <ul style={{ position: 'absolute', top: '40%', left: '40px', width: 'calc(100% - 40px)', background: 'white', border: '1px solid #ccc', listStyle: 'none', padding: 0, margin: 0, zIndex: 10 }}>
                            {suggestions.map((suggestion) => (
                                <li 
                                    key={suggestion.place_id} 
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #ddd' }}
                                >
                                    {suggestion.description}
                                </li>
                            ))}
                        </ul>
                    )} */}

                {/* Campo de dirección de destino con autocompletar */}
                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', position: 'relative' }}>
                    <FaMapMarkerAlt style={{ color: '#ff5722' }} />
                    <input 
                        type="text" 
                        placeholder="¿A dónde vamos?" 
                        value={toLocation}
                        //onChange={handleToLocationChange}
                        id="destination-input" // Identificador para el campo de autocompletar
                        style={{ padding: '10px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                    
                </div> */}
            </div>

            {/* Mostrar el mapa con los markers */}
            <div id="map" style={{ width: '100%', height: '400px' }}></div>
        </div>
    );
};

export default TachosRoute;
