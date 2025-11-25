import React, { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
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

  // Socket
  const socketRef = useRef(null);

  useEffect(() => {
    // Conectar socket al montar
    try {
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL, {
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        console.log('Socket conectado:', socketRef.current.id);
      });

      // Evento que el backend puede emitir cuando encuentra conductores
      socketRef.current.on('drivers-found', (drivers) => {
        console.log('drivers-found recibido (socket):', drivers);
        if (Array.isArray(drivers) && drivers.length > 0 && mapRef && mapRef.current) {
          drivers.forEach((driver) => {
            if (driver.coordinates) addTaxiMarker(mapRef, driver.coordinates, taxiIcon);
          });
        }
        onFoundDrivers(drivers);
        setLoadingSearch(false);
      });

      // Manejo de errores vía socket
      socketRef.current.on('search-error', (msg) => {
        console.warn('search-error desde socket:', msg);
        setError(msg || 'Error en búsqueda via socket');
        setLoadingSearch(false);
      });
    } catch (e) {
      console.warn('No se pudo conectar al socket:', e);
    }

    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.off('drivers-found');
          socketRef.current.off('search-error');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch (e) {
        // no hacer nada
      }
    };
  }, [mapRef, onFoundDrivers]);

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
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#00C853',
          strokeWeight: 6,
          strokeOpacity: 0.95,
        },
      });
      directionsRendererRef.current.setMap(mapRef.current);
    }
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
          try {
            const leg = result.routes[0].legs[0];
            const start = leg.start_location;
            const end = leg.end_location;
            if (fromMarkerRef && fromMarkerRef.current) fromMarkerRef.current.setPosition(start);
            if (toMarkerRef && toMarkerRef.current) toMarkerRef.current.setPosition(end);
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

  // Cuando cambian las coordenadas actualizamos la ruta
  useEffect(() => {
    if (!mapRef || !mapRef.current) return;
    if (!fromCoordinates || !toCoordinates) return;
    drawRouteOnMap(fromCoordinates, toCoordinates);
  }, [fromCoordinates, toCoordinates, drawRouteOnMap, mapRef]);

  // Intercambiar origen/destino
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

    if (fromMarkerRef && fromMarkerRef.current) fromMarkerRef.current.setPosition(bCoords);
    if (toMarkerRef && toMarkerRef.current) toMarkerRef.current.setPosition(aCoords);

    if (mapRef && mapRef.current) mapRef.current.setCenter(bCoords);

    drawRouteOnMap(bCoords, aCoords);
  }, [fromAddress, toAddress, fromCoordinates, toCoordinates, mapRef, fromMarkerRef, toMarkerRef, drawRouteOnMap]);

  // Enviar petición: ahora EMIT por socket con payload; además escucha respuesta por socket (drivers-found)
  const buscarTaxistas = async () => {
  setError(null);
  setLoadingSearch(true);

  const payload = {
    origin: fromCoordinates,
    destination: toCoordinates,
    originAddress: fromAddress,
    destinationAddress: toAddress,
    timestamp: new Date().toISOString(),
  };

  console.log('taxi debug: buscarTaxistas iniciado', { payload, SOCKET_URL: process.env.REACT_APP_SOCKET_URL, STRAPI_URL: process.env.REACT_APP_STRAPI_URL });

  try {
    // Primero intento emitir por socket si existe y está conectado
    if (socketRef.current) {
      try {
        console.log('taxi debug: socketRef existe, connected=', !!socketRef.current.connected);
      } catch (e) {
        console.warn('taxi debug: error leyendo socketRef.connected', e);
      }
    } else {
      console.log('taxi debug: socketRef NO existe en cliente');
    }

    // Emitimos el evento por socket (si está conectado)
    if (socketRef.current && socketRef.current.connected) {
      console.log('taxi debug: Emitiendo buscar-taxistas via socket', payload);
      socketRef.current.emit('buscar-taxistas', payload, (ack) => {
        // si el servidor usa ack callback, lo verás aquí
        console.log('taxi debug: ack buscar-taxistas recibido:', ack);
      });
      // Esperamos un poco a que lleguen respuestas por socket (drivers-found), pero también seguimos con fallback HTTP
    } else {
      console.log('taxi debug: socket no conectado o no disponible — saltando emisión socket');
    }

    // --- Fallback HTTP: pedimos al endpoint REST (esto debe registrar en server logs si llega)
    console.log('taxi debug: intentando fallback HTTP POST a', `${process.env.REACT_APP_STRAPI_URL}/api/conductores-cercanos`);
    const res = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/conductores-cercanos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('taxi debug: respuesta HTTP status:', res.status);

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      console.error('taxi debug: fallback HTTP response no OK', res.status, text);
      throw new Error(text || `Error en búsqueda (${res.status})`);
    }

    const data = await res.json();
    console.log('taxi debug: taxis encontrados (HTTP):', data);

    // llamar callback padre
    onFoundDrivers(data);

    // si vienen conductores por HTTP, pintarlos
    if (Array.isArray(data) && data.length > 0 && mapRef && mapRef.current) {
      data.forEach((driver) => {
        if (driver.coordinates) addTaxiMarker(mapRef, driver.coordinates, taxiIcon);
      });
    }

  } catch (err) {
    console.error('taxi debug: buscarTaxistas error:', err);
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
