// src/components/Taxis/Pasajero.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';
import '../../styles/taxis.css';
import useGoogleMaps from '../../hooks/UseGoogleMaps';
import { addTaxiMarker } from '../../utils/mapUtils';
import taxiIcon from '../../assets/taxi_marker.png';

const DEFAULT_FROM = { lat: 19.432608, lng: -99.133209 };
const DEFAULT_TO = { lat: 19.4374453, lng: -99.14651119999999 };

const Pasajero = ({ onFoundDrivers = () => {} }) => {
  const { user } = useAuth0();
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');

  const [fromCoordinates, setFromCoordinates] = useState(DEFAULT_FROM);
  const [toCoordinates, setToCoordinates] = useState(DEFAULT_TO);

  const [fromMarkerPosition, setFromMarkerPosition] = useState(DEFAULT_FROM);
  const [toMarkerPosition, setToMarkerPosition] = useState(DEFAULT_TO);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

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

  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);

  // Socket ref
  const socketRef = useRef(null);

  // Util: stringify safe
  const safeStringify = (obj, max = 2000) => {
    try {
      const s = JSON.stringify(obj, null, 2);
      return s.length > max ? s.slice(0, max) + '... (truncated)' : s;
    } catch (e) {
      return String(obj);
    }
  };

  useEffect(() => {
    console.log('[Pasajero] montaje: intentando conectar socket a', process.env.REACT_APP_SOCKET_URL);
    try {
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL, {
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        console.log('[Socket] conectado id=', socketRef.current.id, 'url=', process.env.REACT_APP_SOCKET_URL);
      });

      socketRef.current.on('connect_error', (err) => {
        console.warn('[Socket] connect_error:', err && (err.message || err));
      });

      socketRef.current.on('disconnect', (reason) => {
        console.warn('[Socket] disconnected:', reason);
      });

      socketRef.current.on('drivers-found', (drivers) => {
        console.log('[Socket] evento drivers-found recibido. payload:', safeStringify(drivers, 4000));
        try {
          if (Array.isArray(drivers)) {
            drivers.forEach((d) => {
              if (d.coordinates && mapRef && mapRef.current) {
                addTaxiMarker(mapRef, d.coordinates, taxiIcon);
              }
            });
          }
        } catch (e) {
          console.warn('[Socket] error pintando markers drivers-found', e);
        }
        onFoundDrivers(drivers);
        setLoadingSearch(false);
      });

      socketRef.current.on('search-error', (msg) => {
        console.warn('[Socket] search-error recibido:', msg);
        setError(msg || 'Error en búsqueda via socket');
        setLoadingSearch(false);
      });

      // opcional: ack de server si envia "trip-ack" o similar
      socketRef.current.on('trip-ack', (ack) => {
        console.log('[Socket] trip-ack recibido:', ack);
      });
    } catch (e) {
      console.error('[Pasajero] no se pudo inicializar socket:', e);
      socketRef.current = null;
    }

    return () => {
      console.log('[Pasajero] desmontando componente: limpiando socket listeners');
      try {
        if (socketRef.current) {
          socketRef.current.off('drivers-found');
          socketRef.current.off('search-error');
          socketRef.current.off('connect');
          socketRef.current.off('disconnect');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch (e) {
        console.warn('[Pasajero] error limpiando socket:', e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('[Pasajero] geolocalización no disponible');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log('[Pasajero] geolocation success:', lat, lng);
        setFromCoordinates({ lat, lng });
        setFromMarkerPosition({ lat, lng });
        if (mapRef && mapRef.current && mapRef.current.setCenter) {
          mapRef.current.setCenter({ lat, lng });
        }
        try {
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              console.log('[Pasajero] geocoder status:', status);
              if (status === 'OK' && results && results[0]) {
                setFromAddress(results[0].formatted_address);
              }
            });
          }
        } catch (e) {
          console.warn('[Pasajero] geocoder error:', e);
        }
      },
      (err) => {
        console.warn('[Pasajero] geolocation error:', err);
      },
      { maximumAge: 1000 * 60 * 5, timeout: 5000 }
    );
  }, [mapRef]);

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

  const drawRouteOnMap = useCallback(
    (origin, destination) => {
      if (!window.google || !directionsServiceRef.current || !directionsRendererRef.current) {
        console.warn('[drawRouteOnMap] google/directions no listos');
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
          console.log('[drawRouteOnMap] Directions callback status=', status);
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
              console.warn('[drawRouteOnMap] error updating markers after route', e);
            }
          } else {
            console.error('[drawRouteOnMap] error', status, result);
          }
        }
      );
    },
    [directionsRendererRef, directionsServiceRef, mapRef, fromMarkerRef, toMarkerRef]
  );

  useEffect(() => {
    if (!mapRef || !mapRef.current) return;
    if (!fromCoordinates || !toCoordinates) return;
    drawRouteOnMap(fromCoordinates, toCoordinates);
  }, [fromCoordinates, toCoordinates, drawRouteOnMap, mapRef]);

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

  // Helper para transformar REACT_APP_SOCKET_URL ws->http
  const socketUrlToHttp = (url = '') => {
    if (!url) return null;
    try {
      return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
    } catch (e) {
      return null;
    }
  };

  // BUSCAR TAXISTAS: logs completos
  const buscarTaxistas = async () => {
    setError(null);
    setLoadingSearch(true);

    const userEmail = user?.email ?? null;
    console.log('[buscarTaxistas] inicio. user.email=', userEmail);

    const payload = {
      userEmail,
      originCoordinates: fromCoordinates || null,
      destinationCoordinates: toCoordinates || null,
      originAddress: fromAddress || null,
      destinationAddress: toAddress || null,
      timestamp: new Date().toISOString(),
    };

    console.log('[buscarTaxistas] payload construido:', safeStringify(payload, 4000));

    try {
      // 1) Emitir por socket si está conectado
      if (socketRef.current) {
        try {
          console.log('[buscarTaxistas] socketRef existe. connected=', !!socketRef.current.connected);
        } catch (e) {
          console.warn('[buscarTaxistas] error leyendo socketRef.connected', e);
        }
      } else {
        console.log('[buscarTaxistas] socketRef NO existe (null)');
      }

      if (socketRef.current && socketRef.current.connected) {
        console.log('[buscarTaxistas] Emisión via socket.emit("buscar-taxistas") con payload:', safeStringify(payload));
        // añadimos un timeout manual para detectar falta de ack
        let ackCalled = false;
        try {
          socketRef.current.emit('buscar-taxistas', payload, (ack) => {
            ackCalled = true;
            console.log('[Socket ACK] buscar-taxistas ack recibido:', safeStringify(ack));
            // opcional: si el ack contiene drivers, pintarlos
            if (ack && Array.isArray(ack.foundDrivers)) {
              console.log('[Socket ACK] ack.foundDrivers:', safeStringify(ack.foundDrivers));
              ack.foundDrivers.forEach((d) => { if (d.coordinates && mapRef && mapRef.current) addTaxiMarker(mapRef, d.coordinates, taxiIcon); });
              onFoundDrivers(ack.foundDrivers);
            }
          });

          // si no llega ack en 3s, lo informamos pero no cancelamos
          setTimeout(() => {
            if (!ackCalled) {
              console.warn('[buscarTaxistas] no se recibió ACK por socket en 3000ms (seguir con fallback HTTP)');
            }
          }, 3000);
        } catch (e) {
          console.warn('[buscarTaxistas] emit socket fallo:', e);
        }
      } else {
        console.warn('[buscarTaxistas] socket no conectado — no se emitió por websocket');
      }

      // 2) Intentar POST a /test/send-trip (backend)
      const backendBase =
        process.env.REACT_APP_SOCKET_URL ||
        socketUrlToHttp(process.env.REACT_APP_SOCKET_URL) ||
        null;

      if (backendBase) {
        const url = `${backendBase.replace(/\/$/, '')}/test/send-trip`;
        console.log('[buscarTaxistas] intentaremos POST a /test/send-trip ->', url);
        try {
          console.log('[buscarTaxistas] POST body:', safeStringify({
            userEmail,
            originCoordinates: payload.originCoordinates,
            destinationCoordinates: payload.destinationCoordinates,
            originAdress: payload.originAddress,
            destinationAdress: payload.destinationAddress,
            broadcast: true
          }, 4000));

          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail,
              originCoordinates: payload.originCoordinates,
              destinationCoordinates: payload.destinationCoordinates,
              originAdress: payload.originAddress,
              destinationAdress: payload.destinationAddress,
              broadcast: true
            }),
          });

          console.log('[buscarTaxistas] POST /test/send-trip status=', resp.status);
          const text = await resp.text().catch(() => null);
          console.log('[buscarTaxistas] POST /test/send-trip body text preview:', text && text.slice ? text.slice(0, 2000) : text);

          if (resp.ok) {
            let json = null;
            try { json = JSON.parse(text); } catch (e) { json = null; }
            console.log('[buscarTaxistas] POST /test/send-trip JSON parsed:', safeStringify(json, 4000));
            if (json && json.payload && json.payload.meta && json.payload.meta.foundDrivers) {
              const drivers = json.payload.meta.foundDrivers;
              console.log('[buscarTaxistas] drivers desde /test/send-trip meta.foundDrivers:', safeStringify(drivers, 2000));
              if (Array.isArray(drivers) && drivers.length > 0 && mapRef && mapRef.current) {
                drivers.forEach((d) => { if (d.coordinates) addTaxiMarker(mapRef, d.coordinates, taxiIcon); });
              }
              onFoundDrivers(drivers);
            }
          } else {
            console.warn('[buscarTaxistas] POST /test/send-trip no OK:', resp.status);
          }
        } catch (e) {
          console.warn('[buscarTaxistas] error en POST /test/send-trip:', e);
        }
      } else {
        console.warn('[buscarTaxistas] no se pudo determinar backendBase para POST /test/send-trip — revisa env vars');
      }

      // 3) Fallback: endpoint conductores-cercanos en Strapi
      try {
        const conductoresUrl = `${process.env.REACT_APP_STRAPI_URL.replace(/\/$/, '')}/api/conductores-cercanos`;
        console.log('[buscarTaxistas] intentando POST a conductores-cercanos ->', conductoresUrl);
        const res = await fetch(conductoresUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: payload.originCoordinates || payload.originAddress,
            destination: payload.destinationCoordinates || payload.destinationAddress,
            userEmail
          }),
        });
        console.log('[buscarTaxistas] conductores-cercanos status=', res.status);
        const text = await res.text().catch(() => null);
        console.log('[buscarTaxistas] conductores-cercanos response preview:', text && text.slice ? text.slice(0, 2000) : text);
        if (res.ok) {
          let data = null;
          try { data = JSON.parse(text); } catch (e) { data = text; }
          console.log('[buscarTaxistas] conductores-cercanos parsed:', safeStringify(data, 4000));
          onFoundDrivers(data);
          if (Array.isArray(data) && data.length > 0 && mapRef && mapRef.current) {
            data.forEach((driver) => { if (driver.coordinates) addTaxiMarker(mapRef, driver.coordinates, taxiIcon); });
          }
        } else {
          console.warn('[buscarTaxistas] conductores-cercanos returned non-ok:', res.status);
        }
      } catch (err) {
        console.warn('[buscarTaxistas] error calling conductores-cercanos:', err);
      }
    } catch (err) {
      console.error('[buscarTaxistas] error general:', err);
      setError(err.message || 'Error buscando taxistas');
    } finally {
      setLoadingSearch(false);
      console.log('[buscarTaxistas] finalizado (loadingSearch=false).');
    }
  };

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
        <p style={{fontSize:12, color:'#666'}}>Envíos: socket={socketRef.current ? String(!!socketRef.current.connected) : 'no-socket'} — backendBase seguro en consola</p>
      </div>
    </div>
  );
};

export default Pasajero;
