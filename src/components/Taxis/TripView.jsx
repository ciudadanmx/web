// src/components/Trips/TripView.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ViajeConductor from './ViajeConductor.jsx';
import ViajeUsuario from './ViajeUsuario.jsx';
import taxiIcon from '../../assets/taxi_marker.png';
import userIcon from '../../assets/user_marker.png';

const ZOCALO = { lat: 19.432607, lng: -99.133209 };

const STRAPI_BASE = process.env.REACT_APP_STRAPI_URL || '';
const STRAPI_TOKEN = process.env.REACT_APP_STRAPI_TOKEN || '';

const pushTrackToStrapi = async ({ baseUrl, token, viajeId, payload }) => {
  if (!baseUrl || !viajeId) return;
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/viajes/${viajeId}/tracks`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('pushTrackToStrapi falló', res.status, text);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn('pushTrackToStrapi error', e);
    return null;
  }
};

const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve();
    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
    if (!key) {
      console.warn('Falta REACT_APP_GOOGLE_MAPS_API_KEY en .env');
      return reject(new Error('No API key'));
    }
    const src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    const exists = Array.from(document.getElementsByTagName('script')).some(s => s.src && s.src.includes(src));
    if (exists) {
      const check = () => {
        if (window.google && window.google.maps) return resolve();
        setTimeout(check, 200);
      };
      return check();
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

const TripView = ({ user, socket: externalSocket, strapiConfig }) => {
  const { travel } = useParams(); // :travel en la ruta
  const viajeId = travel;

  const [viaje, setViaje] = useState(null);
  const [loadingViaje, setLoadingViaje] = useState(false);

  // coordenadas locales
  const [userCoords, setUserCoords] = useState(null); // posición del conductor (o GPS)
  const [travelData, setTravelData] = useState([]); // si quieres listas de requests (compatible con Conductor)
  const [consultedTravel, setConsultedTravel] = useState(null);

  // mapa & google
  const mapRef = useRef(null);
  const googleLoadedRef = useRef(false);
  const markersRef = useRef([]);
  const pickupMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  // socket local si no te pasan uno (pero preferimos usar externalSocket si viene)
  const socketRef = useRef(externalSocket || null);

  // Inicializar Google Maps (exactamente como en tu Conductor.js)
  useEffect(() => {
    let mounted = true;
    loadGoogleMaps()
      .then(() => {
        if (!mounted) return;
        googleLoadedRef.current = true;
        const el = document.getElementById('map');
        if (el && !mapRef.current) {
          mapRef.current = new window.google.maps.Map(el, {
            center: ZOCALO,
            zoom: 14,
            gestureHandling: 'greedy',
          });
        }
      })
      .catch((err) => {
        console.warn('loadGoogleMaps fallo:', err);
      });
    return () => { mounted = false; };
  }, []);

  // Cargar el viaje desde Strapi (colección "viajes")
  useEffect(() => {
    const base = (strapiConfig && strapiConfig.baseUrl) ? strapiConfig.baseUrl : STRAPI_BASE;
    const token = (strapiConfig && strapiConfig.token) ? strapiConfig.token : STRAPI_TOKEN;
    if (!base || !viajeId) return;
    let mounted = true;
    setLoadingViaje(true);
    (async () => {
      try {
        const res = await fetch(`${base.replace(/\/$/, '')}/api/viajes/${viajeId}?populate=*`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          console.warn('fetch viaje falló', res.status);
          setLoadingViaje(false);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        const v = data?.data || data;
        setViaje(v);
        // setear coords iniciales si vienen en el viaje
        const attrs = v?.attributes || v;
        if (attrs?.taxiPosition) setUserCoords(attrs.taxiPosition);
        if (attrs?.pickup) {
          // se guarda en travelData para compatibilidad con ConductorRender si lo usas
          setTravelData([ { originCoordinates: attrs.pickup, destinationCoordinates: attrs.destination, id: v?.id, originAdress: attrs.pickupAddress } ]);
        } else {
          setTravelData([]);
        }
      } catch (e) {
        console.warn('error fetch viaje', e);
      } finally {
        setLoadingViaje(false);
      }
    })();

    return () => { mounted = false; };
  }, [viajeId, strapiConfig]);

  // Inicializar Directions cuando map esté listo (igual que Conductor.js)
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    if (!directionsServiceRef.current) directionsServiceRef.current = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeWeight: 6, strokeOpacity: 0.95 },
      });
      directionsRendererRef.current.setMap(mapRef.current);
    } else {
      try { directionsRendererRef.current.setOptions({ suppressMarkers: true }); } catch (e) {}
    }
  }, [mapRef.current, googleLoadedRef.current]);

  // Crear/actualizar driver marker y centrar mapa (basado en el useEffect que pegaste)
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const driverPos = (userCoords && userCoords.lat && userCoords.lng)
      ? { lat: Number(userCoords.lat), lng: Number(userCoords.lng) }
      : (mapRef.current.getCenter ? mapRef.current.getCenter().toJSON() : ZOCALO);

    try {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new window.google.maps.Marker({
          position: driverPos,
          map: mapRef.current,
          title: 'Conductor',
          icon: taxiIcon ? { url: taxiIcon, scaledSize: new window.google.maps.Size(40, 40) } : undefined,
        });
      } else {
        driverMarkerRef.current.setPosition(driverPos);
        driverMarkerRef.current.setMap(mapRef.current);
      }
    } catch (e) {
      console.warn('[TripView] error creando/actualizando driverMarker', e);
    }

    try {
      mapRef.current.setCenter(driverPos);
      if (mapRef.current.setZoom) mapRef.current.setZoom(14);
    } catch (e) {}

    try {
      if (directionsRendererRef.current) directionsRendererRef.current.setOptions({ suppressMarkers: true });
    } catch (e) {}
  }, [mapRef.current, userCoords]);

  // Dibujar ruta usando exactamente la lógica que pegaste (consultedTravel y travelData)
  useEffect(() => {
    if (consultedTravel === null) return;
    const travel = travelData[consultedTravel];
    if (!travel) return;
    if (!window.google || !mapRef.current) return;

    const pickupCoords = travel.originCoordinates || null;
    const destinationCoords = travel.destinationCoordinates || null;
    const driverCoords = userCoords || (mapRef.current.getCenter ? mapRef.current.getCenter().toJSON() : null);

    if (!pickupCoords || !destinationCoords || !driverCoords) {
      console.warn('[TripView] coords insuficientes para dibujar ruta', { driverCoords, pickupCoords, destinationCoords });
      return;
    }

    if (!directionsServiceRef.current) directionsServiceRef.current = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#cc19d2ff',
          strokeWeight: 6,
          strokeOpacity: 0.95,
        },
      });
      directionsRendererRef.current.setMap(mapRef.current);
    }

    try {
      const request = {
        origin: { lat: Number(driverCoords.lat), lng: Number(driverCoords.lng) },
        destination: { lat: Number(destinationCoords.lat), lng: Number(destinationCoords.lng) },
        waypoints: [
          { location: { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) }, stopover: true },
        ],
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      };

      directionsServiceRef.current.route(request, (result, status) => {
        if (status === 'OK' || status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);

          // actualizar markers: driver, pickup, destination
          try {
            const legs = result.routes?.[0]?.legs || [];

            // driver marker
            const driverPos = { lat: Number(driverCoords.lat), lng: Number(driverCoords.lng) };
            if (driverMarkerRef.current) {
              driverMarkerRef.current.setPosition(driverPos);
              driverMarkerRef.current.setMap(mapRef.current);
            } else {
              driverMarkerRef.current = new window.google.maps.Marker({
                position: driverPos,
                map: mapRef.current,
                title: 'Conductor',
                icon: taxiIcon ? { url: taxiIcon, scaledSize: new window.google.maps.Size(40, 40) } : undefined,
              });
            }

            // pickup marker (start of first leg)
            const leg = result.routes?.[0]?.legs?.[0];
            const pickupPos = leg ? leg.start_location : { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) };
            if (pickupMarkerRef.current) {
              pickupMarkerRef.current.setPosition(pickupPos);
              pickupMarkerRef.current.setMap(mapRef.current);
            } else {
              pickupMarkerRef.current = new window.google.maps.Marker({
                position: pickupPos,
                map: mapRef.current,
                title: 'Origen (pickup)',
                icon: userIcon ? { url: userIcon, scaledSize: new window.google.maps.Size(36, 36) } : undefined,
              });
            }

            // destination marker (end of last leg)
            let destPos;
            if (legs.length >= 1 && legs[legs.length - 1].end_location) {
              destPos = legs[legs.length - 1].end_location;
            } else {
              destPos = { lat: Number(destinationCoords.lat), lng: Number(destinationCoords.lng) };
            }

            if (destMarkerRef.current) {
              destMarkerRef.current.setPosition(destPos);
              destMarkerRef.current.setMap(mapRef.current);
            } else {
              destMarkerRef.current = new window.google.maps.Marker({
                position: destPos,
                map: mapRef.current,
                title: 'Destino',
              });
            }
          } catch (mkErr) {
            console.warn('[TripView] error actualizando markers', mkErr);
          }

          // ajustar viewport al recorrido completo
          try {
            const bounds = new window.google.maps.LatLngBounds();
            const overview = result.routes?.[0]?.overview_path;
            if (overview && overview.length) {
              overview.forEach((p) => bounds.extend(p));
            } else {
              bounds.extend({ lat: Number(driverCoords.lat), lng: Number(driverCoords.lng) });
              bounds.extend({ lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) });
              bounds.extend({ lat: Number(destinationCoords.lat), lng: Number(destinationCoords.lng) });
            }
            mapRef.current.fitBounds(bounds);
          } catch (bErr) {
            console.warn('[TripView] fitBounds error', bErr);
          }
        } else {
          console.error('[TripView] Directions error', status, result);
        }
      });
    } catch (e) {
      console.warn('[TripView] Error solicitando directions', e);
    }
  }, [consultedTravel, travelData, userCoords]);

  // SOCKET: usar externalSocket si viene, si no usaremos socketRef creado externo anteriormente
  useEffect(() => {
    if (!externalSocket) return;
    socketRef.current = externalSocket;
  }, [externalSocket]);

  // Conexión socket / listeners y lógica conductor->emit + push a Strapi cada 60s
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !viajeId) return;
    const isDriver = !!user?.isDriver || user?.role === 'driver';
    const driverId = user?.id || user?.sub || user?.email || 'driver-unknown';
    const channel = `trip:${viajeId}`;

    const onDriverLocation = (payload) => {
      if (!payload?.coords) return;
      setUserCoords(payload.coords);
    };

    const onTripUpdate = (payload) => {
      if (!payload) return;
      // actualizar viaje/atributos si vienen
      if (payload.pickup || payload.destination || payload.status) {
        setViaje((prev) => {
          const copy = prev ? { ...prev } : { attributes: {} };
          if (!copy.attributes) copy.attributes = {};
          if (payload.pickup) copy.attributes.pickup = payload.pickup;
          if (payload.destination) copy.attributes.destination = payload.destination;
          if (payload.status) copy.attributes.status = payload.status;
          return copy;
        });
      }
    };

    try { socket.emit('join', { channel, client: { id: driverId } }); } catch (e) {}

    socket.on('driver-location', onDriverLocation);
    socket.on('trip-update', onTripUpdate);

    let locInterval = null;
    let trackInterval = null;

    if (isDriver) {
      const emitLocation = () => {
        if (!userCoords) return;
        const payload = {
          viajeId,
          driverId,
          coords: userCoords,
          ts: new Date().toISOString(),
        };
        try {
          socket.emit('actualizandoUbicacion', { channel, payload });
        } catch (e) { console.warn('emit actualizandoUbicacion error', e); }
      };
      emitLocation();
      locInterval = setInterval(emitLocation, 10 * 1000);

      trackInterval = setInterval(async () => {
        if (!userCoords) return;
        await pushTrackToStrapi({
          baseUrl: (strapiConfig && strapiConfig.baseUrl) ? strapiConfig.baseUrl : STRAPI_BASE,
          token: (strapiConfig && strapiConfig.token) ? strapiConfig.token : STRAPI_TOKEN,
          viajeId,
          payload: {
            data: {
              driver: driverId,
              coords: userCoords,
              recordedAt: new Date().toISOString(),
            },
          },
        });
      }, 60 * 1000);
    }

    return () => {
      try { socket.emit('leave', { channel, client: { id: driverId } }); } catch (e) {}
      socket.off('driver-location', onDriverLocation);
      socket.off('trip-update', onTripUpdate);
      if (locInterval) clearInterval(locInterval);
      if (trackInterval) clearInterval(trackInterval);
    };
  }, [socketRef.current, viajeId, user, userCoords, strapiConfig]);

  // Handlers para la UI (similar a tu ConductorRender expectations)
  const handleTravelCardClick = (index) => setConsultedTravel(index);
  const handleBackButtonClick = () => {
    try {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
    } catch (e) { console.warn('Error limpiando directionsRenderer', e); }
    try { if (pickupMarkerRef.current) { pickupMarkerRef.current.setMap(null); pickupMarkerRef.current = null; } } catch {}
    try { if (destMarkerRef.current) { destMarkerRef.current.setMap(null); destMarkerRef.current = null; } } catch {}
    setConsultedTravel(null);
  };
  const handleCloseButtonClick = (index) => {
    setTravelData(prev => prev.filter((_, i) => i !== index));
    markersRef.current.forEach(m => { try { m.setMap(null); } catch (e) {} });
    markersRef.current = [];
  };

  const handleAcceptTrip = async (index) => {
    const idx = typeof index === 'number' ? index : consultedTravel;
    const travel = travelData[idx];
    if (!travel) return;
    const socket = socketRef.current;
    const driverId = user?.id || user?.sub || user?.email || 'driver-unknown';
    try {
      if (socket && socket.connected) {
        socket.emit('oferta', {
          driverId,
          travelId: travel.id || travel.travelId,
          originAddress: travel.originAdress,
          destinationAddress: travel.destinationAdress,
          coordinates: userCoords,
          destinationCoords: userCoords,
        });
        setTravelData(prev => prev.map((t, i) => i === idx ? { ...t, accepted: true } : t));
      } else {
        // fallback HTTP
        await fetch(`${STRAPI_BASE.replace(/\/$/, '')}/api/ofertas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}) },
          body: JSON.stringify({ driverId, travelId: travel.id || travel.travelId }),
        });
        setTravelData(prev => prev.map((t, i) => i === idx ? { ...t, accepted: true } : t));
      }
    } catch (e) {
      console.error('Error en handleAcceptTrip', e);
    }
  };

  // Render: mapa + componente conductor/usuario (mantengo la UX que te dí antes)
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div id="map" style={{ width: '100%', height: '60vh' }} />
      { (user?.isDriver || user?.role === 'driver') ? (
        <ViajeConductor
          viaje={viaje}
          socket={socketRef.current}
          strapiConfig={{ baseUrl: (strapiConfig && strapiConfig.baseUrl) ? strapiConfig.baseUrl : STRAPI_BASE, token: (strapiConfig && strapiConfig.token) ? strapiConfig.token : STRAPI_TOKEN }}
          userCoords={userCoords}
          setUserCoords={setUserCoords}
          travelData={travelData}
          consultedTravel={consultedTravel}
          handleTravelCardClick={handleTravelCardClick}
          handleBackButtonClick={handleBackButtonClick}
          handleCloseButtonClick={handleCloseButtonClick}
          handleAcceptTrip={handleAcceptTrip}
          mapRef={mapRef}
        />
      ) : (
        <ViajeUsuario
          viaje={viaje}
          socket={socketRef.current}
          userCoords={userCoords}
          setUserCoords={setUserCoords}
          mapRef={mapRef}
          setConsultedTravel={setConsultedTravel}
        />
      )}
    </div>
  );
};

export default TripView;
