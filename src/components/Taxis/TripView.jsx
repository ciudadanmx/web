// src/components/Trips/TripView.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useGoogleMaps from '../../hooks/UseGoogleMaps';
import ViajeConductor from './ViajeConductor';
import ViajeUsuario from './ViajeUsuario';
import taxiIconUrl from '../../assets/taxi_marker.png';
import userIconUrl from '../../assets/user_marker.png';

// config Strapi desde env (puedes sobreescribir pasando strapiConfig prop)
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

const TripView = ({ user, socket, strapiConfig }) => {
  const { travel } = useParams(); // este es el :travel en la ruta
  const viajeId = travel;
  const [viaje, setViaje] = useState(null);
  const [loadingViaje, setLoadingViaje] = useState(false);

  // coordenadas
  const [fromCoordinates, setFromCoordinates] = useState(null); // taxi
  const [toCoordinates, setToCoordinates] = useState(null); // destino
  const [pickupCoordinates, setPickupCoordinates] = useState(null); // pickup pasajero

  const [fromMarkerPosition, setFromMarkerPosition] = useState(null);
  const [toMarkerPosition, setToMarkerPosition] = useState(null);

  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
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
    googleMapsLoaded,
  );

  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const passengerMarkerRef = useRef(null);

  // obtener viaje desde Strapi en mount o cuando viajeId cambie
  useEffect(() => {
    const base = (strapiConfig && strapiConfig.baseUrl) ? strapiConfig.baseUrl : STRAPI_BASE;
    const token = (strapiConfig && strapiConfig.token) ? strapiConfig.token : STRAPI_TOKEN;
    if (!base || !viajeId) return;

    let mounted = true;
    setLoadingViaje(true);
    (async () => {
      try {
        // get /api/viajes/:id?populate=*
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
        // estructura: data.data (Strapi v4)
        const v = data?.data || data;
        // mapear coordenadas según tu modelo; asumo que viene algo como attributes.pickup, attributes.destination, attributes.taxiPosition
        const attrs = v?.attributes || v;
        setViaje(v);
        if (attrs?.taxiPosition) setFromCoordinates(attrs.taxiPosition);
        if (attrs?.pickup) setPickupCoordinates(attrs.pickup);
        if (attrs?.destination) setToCoordinates(attrs.destination);
      } catch (e) {
        console.warn('error fetch viaje', e);
      } finally {
        setLoadingViaje(false);
      }
    })();

    return () => { mounted = false; };
  }, [viajeId, strapiConfig]);

  // Inicializa DirectionsService/Renderer cuando map y google estén listos
  useEffect(() => {
    if (!window.google || !mapRef.current || !googleMapsLoaded) return;
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    // si hay uno previo, eliminar
    if (directionsRendererRef.current) {
      try { directionsRendererRef.current.setMap(null); } catch (e) {}
      directionsRendererRef.current = null;
    }
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapRef.current,
      suppressMarkers: true, // nosotros manejamos markers
      polylineOptions: {
        strokeColor: '#7a1fbf',
        strokeWeight: 6,
        strokeOpacity: 0.95,
      },
      preserveViewport: true,
    });
  }, [googleMapsLoaded, mapRef]);

  // Función que pide ruta real por calles (taxi -> pickup -> destino)
  const calcularYPaintRuta = useCallback(async () => {
    if (!window.google || !directionsServiceRef.current || !directionsRendererRef.current) return;

    // definimos puntos disponibles
    const taxi = fromCoordinates;
    const pickup = pickupCoordinates;
    const destino = toCoordinates;

    if (!taxi || !destino) {
      // si no hay suficiente info, limpiar renderer
      try { directionsRendererRef.current.setDirections({ routes: [] }); } catch (e) {}
      return;
    }

    // Construir request: si hay pickup y no se ha hecho pickup -> taxi -> pickup -> destino
    const waypoints = [];
    if (pickup && (!viaje?.attributes?.status || viaje?.attributes?.status !== 'in_progress')) {
      waypoints.push({ location: new window.google.maps.LatLng(pickup.lat, pickup.lng), stopover: true });
    }

    const request = {
      origin: new window.google.maps.LatLng(taxi.lat, taxi.lng),
      destination: new window.google.maps.LatLng(destino.lat, destino.lng),
      travelMode: window.google.maps.TravelMode.DRIVING,
      waypoints,
      provideRouteAlternatives: false,
      drivingOptions: {}, // opcional
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === 'OK' && result) {
        directionsRendererRef.current.setDirections(result);

        // obtener distancia y duración del leg final o combinada
        try {
          // si hay waypoints, result.routes[0].legs será array (taxi->pickup, pickup->destino)
          const legs = result.routes[0].legs || [];
          let totalDistance = 0;
          let totalDuration = 0;
          legs.forEach((l) => {
            totalDistance += (l.distance?.value || 0); // metros
            totalDuration += (l.duration?.value || 0); // segundos
          });
          // guardo estos datos en el viaje local para mostrar en tarjetas
          setViaje((prev) => {
            const copy = prev ? { ...prev } : { attributes: {} };
            if (!copy.attributes) copy.attributes = {};
            copy.attributes._routeInfo = {
              distance_m: totalDistance,
              duration_s: totalDuration,
            };
            return copy;
          });
        } catch (e) {
          console.warn('error calculando distance/duration', e);
        }
      } else {
        console.warn('DirectionsService fallo', status, result);
      }
    });
  }, [fromCoordinates, pickupCoordinates, toCoordinates, viaje, setViaje]);

  // recalcular ruta cada que cambian coords relevantes
  useEffect(() => {
    calcularYPaintRuta();
  }, [calcularYPaintRuta]);

  // pintar markers manualmente: taxi (taxi_icon), pickup (user_icon), destino (rojo normal)
  const refreshMarkers = useCallback(() => {
    if (!window.google || !mapRef.current) return;

    // TAXI: fromMarkerRef
    if (fromMarkerRef.current && fromCoordinates) {
      try {
        fromMarkerRef.current.setPosition(fromCoordinates);
        fromMarkerRef.current.setMap(mapRef.current);
        fromMarkerRef.current.setIcon({
          url: taxiIconUrl,
          scaledSize: new window.google.maps.Size(44, 44),
        });
      } catch (e) { console.warn(e); }
    }

    // PICKUP
    if (pickupCoordinates && (!viaje?.attributes?.status || viaje?.attributes?.status !== 'in_progress')) {
      if (!passengerMarkerRef.current) {
        passengerMarkerRef.current = new window.google.maps.Marker({
          position: pickupCoordinates,
          map: mapRef.current,
          icon: {
            url: userIconUrl,
            scaledSize: new window.google.maps.Size(40, 40),
          },
          title: 'Pickup pasajero',
        });
      } else {
        passengerMarkerRef.current.setPosition(pickupCoordinates);
        passengerMarkerRef.current.setMap(mapRef.current);
      }
    } else {
      if (passengerMarkerRef.current) {
        try { passengerMarkerRef.current.setMap(null); } catch (e) {}
        passengerMarkerRef.current = null;
      }
    }

    // DESTINO: toMarkerRef (marcador rojo normal)
    if (toMarkerRef.current && toCoordinates) {
      try {
        toMarkerRef.current.setPosition(toCoordinates);
        toMarkerRef.current.setMap(mapRef.current);
        toMarkerRef.current.setIcon(null);
      } catch (e) {}
    }
  }, [mapRef, fromCoordinates, pickupCoordinates, toCoordinates, fromMarkerRef, toMarkerRef, viaje]);

  useEffect(() => {
    refreshMarkers();
  }, [refreshMarkers]);

  // SOCKET logic: emite actualizandoUbicacion cada 10s si es conductor, persiste cada 60s en /api/viajes/:id/tracks
  useEffect(() => {
    if (!socket || !viajeId) return;
    const isDriver = !!user?.isDriver || user?.role === 'driver';
    const driverId = user?.id || user?.sub || 'driver-unknown';
    const channel = `trip:${viajeId}`;

    const onDriverLocation = (payload) => {
      if (!payload?.coords) return;
      setFromCoordinates(payload.coords);
    };

    const onTripUpdate = (payload) => {
      if (!payload) return;
      if (payload.pickup) setPickupCoordinates(payload.pickup);
      if (payload.destination) setToCoordinates(payload.destination);
      if (payload.status && viaje) {
        setViaje((prev) => {
          const copy = prev ? { ...prev } : { attributes: {} };
          if (!copy.attributes) copy.attributes = {};
          copy.attributes.status = payload.status;
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
        if (!fromCoordinates) return;
        const payload = {
          viajeId,
          driverId,
          coords: fromCoordinates,
          ts: new Date().toISOString(),
        };
        try {
          socket.emit('actualizandoUbicacion', { channel, payload });
        } catch (e) { console.warn(e); }
      };

      emitLocation();
      locInterval = setInterval(emitLocation, 10 * 1000);

      // push a Strapi cada 60s
      trackInterval = setInterval(async () => {
        if (!fromCoordinates) return;
        await pushTrackToStrapi({
          baseUrl: (strapiConfig && strapiConfig.baseUrl) ? strapiConfig.baseUrl : STRAPI_BASE,
          token: (strapiConfig && strapiConfig.token) ? strapiConfig.token : STRAPI_TOKEN,
          viajeId,
          payload: {
            data: {
              driver: driverId,
              coords: fromCoordinates,
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
  }, [socket, viajeId, user, fromCoordinates, setFromCoordinates, setPickupCoordinates, setToCoordinates, strapiConfig]);

  // RENDER
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div id="map" style={{ width: '100%', height: '60vh' }} />
      { (user?.isDriver || user?.role === 'driver') ? (
        <ViajeConductor
          viaje={viaje}
          socket={socket}
          strapiConfig={{ baseUrl: (strapiConfig && strapiConfig.baseUrl) ? strapiConfig.baseUrl : STRAPI_BASE, token: (strapiConfig && strapiConfig.token) ? strapiConfig.token : STRAPI_TOKEN }}
          fromCoordinates={fromCoordinates}
          toCoordinates={toCoordinates}
          pickupCoordinates={pickupCoordinates}
          setFromCoordinates={setFromCoordinates}
          setPickupCoordinates={setPickupCoordinates}
          setToCoordinates={setToCoordinates}
          mapRef={mapRef}
        />
      ) : (
        <ViajeUsuario
          viaje={viaje}
          socket={socket}
          fromCoordinates={fromCoordinates}
          toCoordinates={toCoordinates}
          pickupCoordinates={pickupCoordinates}
          setFromCoordinates={setFromCoordinates}
          setPickupCoordinates={setPickupCoordinates}
          setToCoordinates={setToCoordinates}
          mapRef={mapRef}
        />
      )}
    </div>
  );
};

export default TripView;
