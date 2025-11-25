import React, { useEffect, useState, useCallback, useRef } from 'react';
import '../../styles/taxis.css';
import useGoogleMaps from '../../hooks/UseGoogleMaps'; // hook que devuelve mapRef, fromMarkerRef, toMarkerRef
import { getDirections, addTaxiMarker } from '../../utils/mapUtils';
import taxiIcon from '../../assets/taxi_marker.png';

const DEFAULT_FROM = { lat: 19.432608, lng: -99.133209 };
const DEFAULT_TO = { lat: 19.4374453, lng: -99.14651119999999 };

const Pasajero = ({ onFoundDrivers = () => {} }) => {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');

  const [fromCoordinates, setFromCoordinates] = useState(DEFAULT_FROM);
  const [toCoordinates, setToCoordinates] = useState(DEFAULT_TO);

  const [fromMarkerPosition, setFromMarkerPosition] = useState(DEFAULT_FROM);
  const [toMarkerPosition, setToMarkerPosition] = useState(DEFAULT_TO);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // hook (mantiene firma antigua). Devuelve refs
  const { mapRef, fromMarkerRef, toMarkerRef } = useGoogleMaps(
    fromCoordinates,
    setFromCoordinates,
    setFromMarkerPosition,
    toCoordinates,
    setToCoordinates,
    setToMarkerPosition,
    setFromAddress,
    setToAddress,
    setGoogleMapsLoaded,
    googleMapsLoaded
  );
  

  // Directions objects
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);

  // Intentar obtener geolocalización del usuario al montar y centrar mapa
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFromCoordinates({ lat, lng });
        setFromMarkerPosition({ lat, lng });
        if (mapRef && mapRef.current && mapRef.current.setCenter) {
          mapRef.current.setCenter({ lat, lng });
        }
        try {
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                setFromAddress(results[0].formatted_address);
              }
            });
          }
        } catch (e) {
          console.warn('Geocoder fail', e);
        }
      },
      (err) => {
        console.warn('Geolocation no disponible o denegada', err);
      },
      { maximumAge: 1000 * 60 * 5, timeout: 5000 }
    );
  }, [mapRef]);

  // Inicializar DirectionsService/Renderer cuando el mapa esté listo
  useEffect(() => {
    if (!mapRef || !mapRef.current || !window.google) return;
    if (!directionsServiceRef.current) directionsServiceRef.current = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      // <-- CAMBIO AQUÍ: forzamos polylineOptions para pintar la ruta en verde
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#00C853", // verde
          strokeWeight: 6,
          strokeOpacity: 0.95,
        },
      });
      directionsRendererRef.current.setMap(mapRef.current);
    }
    // limpia al desmontar
    return () => {
      if (directionsRendererRef.current) {
        try {
          directionsRendererRef.current.setMap(null);
        } catch (e) {}
      }
    };
  }, [mapRef, googleMapsLoaded]);

  // Función que dibuja la ruta en el mapa (y actualiza marker pickup si es necesario)
  const drawRouteOnMap = useCallback(async (origin, destination) => {
    if (!window.google || !directionsServiceRef.current || !directionsRendererRef.current) {
      console.warn('drawRouteOnMap: google/directions no listos');
      return;
    }

    // soporta objetos {lat,lng} o strings (dirección)
    const originParam = typeof origin === 'string' ? origin : { lat: origin.lat, lng: origin.lng };
    const destParam = typeof destination === 'string' ? destination : { lat: destination.lat, lng: destination.lng };

    directionsServiceRef.current.route(
      {
        origin: originParam,
        destination: destParam,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK || status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          // Si queremos añadir markers personalizados en inicio/fin, los manejamos aquí:
          // colocamos markers usando fromMarkerRef / toMarkerRef (si existen)
          try {
            const leg = result.routes[0].legs[0];
            const start = leg.start_location;
            const end = leg.end_location;
            if (fromMarkerRef && fromMarkerRef.current) fromMarkerRef.current.setPosition(start);
            if (toMarkerRef && toMarkerRef.current) toMarkerRef.current.setPosition(end);
            // centrar suavemente en la ruta
            if (mapRef && mapRef.current && mapRef.current.fitBounds) {
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].overview_path.forEach((p) => bounds.extend(p));
              mapRef.current.fitBounds(bounds);
            }
          } catch (e) {
            console.warn('Error al actualizar markers tras route', e);
          }
        } else {
          console.error('drawRouteOnMap error', status, result);
        }
      }
    );
  }, [directionsRendererRef, directionsServiceRef, mapRef, fromMarkerRef, toMarkerRef]);

  // Cuando cambian las coordenadas (por Autocomplete o por swap) actualizamos la ruta automáticamente si ambos existen
  useEffect(() => {
    if (!mapRef || !mapRef.current) return;
    if (!fromCoordinates || !toCoordinates) return;
    // Solo dibujar si se han definido direcciones (evita dibujar con defaults inmediatos)
    // Puedes condicionar más estrictamente si quieres
    drawRouteOnMap(fromCoordinates, toCoordinates);
  }, [fromCoordinates, toCoordinates, drawRouteOnMap, mapRef]);

  // Intercambiar origen/destino (mejorado para no romper markers y mantener centrado)
  const swapOriginDestination = useCallback(() => {
    const aAddr = fromAddress;
    const bAddr = toAddress;
    setFromAddress(bAddr);
    setToAddress(aAddr);

    const aCoords = fromCoordinates;
    const bCoords = toCoordinates;
    setFromCoordinates(bCoords);
    setToCoordinates(aCoords);

    setFromMarkerPosition(bCoords);
    setToMarkerPosition(aCoords);

    // actualizar markers si refs existen
    if (fromMarkerRef && fromMarkerRef.current) fromMarkerRef.current.setPosition(bCoords);
    if (toMarkerRef && toMarkerRef.current) toMarkerRef.current.setPosition(aCoords);

    // centrar en nuevo origen
    if (mapRef && mapRef.current) mapRef.current.setCenter(bCoords);

    // redibujar ruta
    drawRouteOnMap(bCoords, aCoords);
  }, [fromAddress, toAddress, fromCoordinates, toCoordinates, mapRef, fromMarkerRef, toMarkerRef, drawRouteOnMap]);

  // Enviar petición a Strapi y mostrar ruta (si responde con conductores)
  const buscarTaxistas = async () => {
    setError(null);
    setLoadingSearch(true);

    const payload = {
      origin: fromCoordinates,
      destination: toCoordinates,
      originAddress: fromAddress,
      destinationAddress: toAddress,
    };

    try {
      const res = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/conductores-cercanos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `Error en búsqueda (${res.status})`);
      }

      const data = await res.json();
      console.log('Taxis encontrados:', data);
      onFoundDrivers(data);

      // Opcional: si la API devuelve coordenadas de conductor, puedes añadir markers de taxi:
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((driver) => {
          if (driver.coordinates && mapRef && mapRef.current) {
            addTaxiMarker(mapRef, driver.coordinates, taxiIcon);
          }
        });
      }

      // Asegurar que la ruta se dibuje (ya debería por el useEffect, pero la forzamos)
      drawRouteOnMap(fromCoordinates, toCoordinates);
    } catch (err) {
      console.error('buscarTaxistas error:', err);
      setError(err.message || 'Error buscando taxistas');
    } finally {
      setLoadingSearch(false);
    }
  };

  // Botón para centrar en origen
  const centerOnOrigin = () => {
    if (mapRef && mapRef.current) {
      mapRef.current.setCenter(fromCoordinates);
      if (mapRef.current.setZoom) mapRef.current.setZoom(15);
    }
  };

  return (
    <div className="taxis-container">
      <h3 className="trip-title" style={{ textAlign: 'center' }}>Buscar un viaje</h3>

      <div className="inputs-row improved-row">
        <div className="input-wrap">
          
          <input
            id="from-input"
            type="text"
            placeholder="Origen (tu ubicación por defecto)"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            className="lugar-input pasajero-origen"
          />
        </div>

        <div className="swap-wrap">
          <button
            title="Intercambiar origen/destino"
            onClick={swapOriginDestination}
            className="swap-button"
            aria-label="Intercambiar origen y destino"
          >
            ⇅
          </button>
        </div>

        <div className="input-wrap">
          
          <input
            id="to-input"
            type="text"
            placeholder="Destino"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="lugar-input pasajero-destino"
          />
        </div>
      </div>

      <div className="controls-row">
        <button
          onClick={buscarTaxistas}
          disabled={loadingSearch}
          className="buscar-taxistas formulario-pasajero pasajero-buscar"
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#ff4081',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loadingSearch ? 'default' : 'pointer',
          }}
        >
          {loadingSearch ? 'Buscando taxistas...' : 'Buscar Taxistas'}
        </button>

        <button
          onClick={centerOnOrigin}
          className="center-button"
          title="Centrar en origen"
        >
          📍
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="taxis-map formulario-pasajero" style={{ width: '100%', height: '60vh', borderRadius: 8, overflow: 'hidden' }}>
        <div id="map" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="cuadro-coordenadas formulario-pasajero" style={{ marginTop: 12 }}>
        <h4>Coordenadas actuales (origen)</h4>
        <p><strong>Lat:</strong> {fromCoordinates.lat?.toFixed(6)}</p>
        <p><strong>Lng:</strong> {fromCoordinates.lng?.toFixed(6)}</p>
      </div>
    </div>
  );
};

export default Pasajero;
