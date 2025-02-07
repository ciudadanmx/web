import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

const TachosRoute = () => {
    const zocaloCoords = { lat: 19.432607, lng: -99.133209 };
    const centroCoords = { lat: 19.432609, lng: -99.133209 };
    const [fromLocation, setFromLocation] = useState('Zócalo, CDMX');
    const [toLocation, setToLocation] = useState('');
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [error, setError] = useState(null);
    const [taxiCoords, setTaxiCoords] = useState([]);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [toMarker, setToMarker] = useState(null);

    const taxiData = [
        { id: 1, lat: 19.434, lng: -99.132 },
        { id: 2, lat: 19.436, lng: -99.133 },
        { id: 3, lat: 19.437, lng: -99.134 },
        { id: 4, lat: 19.430, lng: -99.135 },
        { id: 5, lat: 19.428, lng: -99.137 },
    ];

    useEffect(() => {
        setTaxiCoords(taxiData);
    }, []);

    useEffect(() => {
        // Evitar carga múltiple del script
        if (window.google) return; // Si ya está cargado, no lo cargues de nuevo

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_PLACES_KEY}&libraries=places,marker`; // Añadir `marker` a las bibliotecas
        script.async = true;
        script.onload = () => {
            if (window.google) {
                initializeMap();
            }
        };
        script.onerror = (error) => {
            console.error("Error al cargar el script de Google Maps:", error);
        };
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script); // Eliminar el script al desmontar el componente
        };
    }, []);

    const initializeMap = () => {
        const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
            center: zocaloCoords,
            zoom: 15,
        });

        setMap(mapInstance);

        // Usando AdvancedMarkerElement después de cargar la biblioteca `marker`
        const initialMarker = new google.maps.marker.AdvancedMarkerElement({
            position: zocaloCoords,
            map: mapInstance,
            title: "Zócalo, CDMX",
        });

        const centroMarker = new google.maps.marker.AdvancedMarkerElement({
            position: centroCoords,
            map: mapInstance,
            title: "Centro, CDMX",
        });

        setMarker(initialMarker);
        setToMarker(centroMarker);

        taxiCoords.forEach((taxi) => {
            new google.maps.marker.AdvancedMarkerElement({
                position: { lat: taxi.lat, lng: taxi.lng },
                map: mapInstance,
                title: `Taxi ${taxi.id}`,
                icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
            });
        });

        const fromAutocomplete = new window.google.maps.places.Autocomplete(document.getElementById('from-input'), {
            types: ['address'],
        });

        fromAutocomplete.addListener('place_changed', () => {
            const from_place = fromAutocomplete.getPlace();
            if (from_place.geometry) {
                setFromLocation(from_place.formatted_address);
            }
        });

        const toAutocomplete = new window.google.maps.places.Autocomplete(document.getElementById('to-input'), {
            types: ['address'],
        });

        toAutocomplete.addListener('place_changed', () => {
            const to_place = toAutocomplete.getPlace();
            if (to_place.geometry) {
                setToLocation(to_place.formatted_address);
            }
        });
    };

    const handleFromLocationChange = async (e) => {
        const fromInput = e.target.value;
        setFromLocation(fromInput);

        if (fromInput.length > 2) {
            try {
                const response = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/autocomplete?input=${fromInput}`);
                if (!response.ok) throw new Error("Error en el backend de Strapi");

                const fromData = await response.json();
                console.log("API Response:", fromData);

                if (fromData.predictions) {
                    setFromSuggestions(fromData.predictions);
                }
            } catch (error) {
                setError("Error al obtener sugerencias de autocompletar");
                console.error("Error fetching autocomplete suggestions:", error);
            }
        } else {
            setFromSuggestions([]);
        }
    };

    const handleToLocationChange = async (o) => {
        const toInput = o.target.value;
        setToLocation(toInput);

        if (toInput.length > 2) {
            try {
                const response = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/autocomplete?input=${toInput}`);
                if (!response.ok) throw new Error("Error en el backend de Strapi");

                const toData = await response.json();
                console.log("API Response:", toData);

                if (toData.predictions) {
                    setToSuggestions(toData.predictions);
                }
            } catch (error) {
                setError("Error al obtener sugerencias de autocompletar");
                console.error("Error fetching autocomplete suggestions:", error);
            }
        } else {
            setToSuggestions([]);
        }
    };

    const handleFromSuggestionClick = (fromSuggestion) => {
        setFromLocation(fromSuggestion.description);
        setFromSuggestions([]);
    };

    const handleToSuggestionClick = (toSuggestion) => {
        setToLocation(toSuggestion.description);
        console.log(`Destino es: ---- ${toSuggestion.description} .... `);
        setToSuggestions([]);

        if (!toSuggestion.geometry || !toSuggestion.geometry.location) {
            console.error("No se encontraron coordenadas en la sugerencia seleccionada.");
            return;
        }

        const destinoLat = toSuggestion.geometry.location.lat();
        const destinoLng = toSuggestion.geometry.location.lng();

        if (!toMarker) {
            toMarker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: destinoLat, lng: destinoLng },
                map: map,
                title: "Ubicación de destino",
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            });
        } else {
            toMarker.setPosition({ lat: destinoLat, lng: destinoLng });
        }
    };

    return (
        <div style={{ width: '90%', height: '100vh', overflow: 'hidden', padding: '20px' }}>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', marginBottom: '10px' }}>
                    <FaMapMarkerAlt style={{ color: '#ff5722' }} />
                    <input 
                        type="text" 
                        placeholder="Desde..." 
                        value={fromLocation} 
                        onChange={handleFromLocationChange}
                        style={{ padding: '10px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                        id="from-input"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', position: 'relative' }}>
                    <FaMapMarkerAlt style={{ color: '#ff5722' }} />
                    <input 
                        type="text" 
                        placeholder="¿A dónde vamos?" 
                        value={toLocation}
                        onChange={handleToLocationChange}
                        id="to-input"
                        style={{ padding: '10px', width: '100%', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>
            </div>

            <div id="map" style={{ width: '100%', height: '400px' }}></div>
        </div>
    );
};

export default TachosRoute;
