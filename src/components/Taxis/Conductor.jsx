// src/components/Taxis/Conductor.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios';
import ConductorRender from './ConductorRender'; // tu render (el UI que pegaste)
import taxiIcon from '../../assets/taxi_marker.png'; // si está en otra ruta ajusta
// NOTA: asegúrate de tener REACT_APP_GOOGLE_MAPS_API_KEY y REACT_APP_SOCKET_URL en .env

const ZOCALO = { lat: 19.432607, lng: -99.133209 };

const Conductor = ({
  setShowTabs,
  setHideTabs,
  showTabs,
  hideTabs,
  setActiveTab,
  shiftToPasajero,
  setShiftToPasajero,
}) => {
  const { user, isAuthenticated } = useAuth0();
  const [isWaiting, setIsWaiting] = useState(true);
  const [travelData, setTravelData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [consultedTravel, setConsultedTravel] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  const mapRef = useRef(null); // guardamos instancia Map en .current
  const socketRef = useRef(null);
  const markersRef = useRef([]); // array de marcadores añadidos (para limpiar)
  const pickupMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);

  /* --------------------------
     Helpers: cargar Google Maps
     -------------------------- */
  const loadGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        return resolve();
      }
      const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
      if (!key) {
        console.warn('Falta REACT_APP_GOOGLE_MAPS_API_KEY en .env — se intentará con window.google si ya está cargado.');
        return reject(new Error('No API key'));
      }
      const src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      // si ya existe un script con esa src, esperar su carga
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

  /* --------------------------
     Inicializa mapa (no bloquear UI)
     -------------------------- */
  useEffect(() => {
    let mounted = true;
    loadGoogleMaps()
      .then(() => {
        if (!mounted) return;
        setGoogleMapsLoaded(true);
        // si el div #map ya existe, inicializamos la instancia del mapa
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
        // Si falla la carga por clave o bloqueo, intentamos marcar como cargado
        console.warn('loadGoogleMaps fallo:', err);
        // No forzamos que mapRef exista; el UI seguirá mostrando esperando y demás.
      });
    return () => { mounted = false; };
    // NOTE: intencionalmente no ponemos dependencia para que solo se intente al montar
  }, []);

  /* --------------------------
     Inicializar Directions (cuando esté el mapa)
     -------------------------- */
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    if (!directionsServiceRef.current) directionsServiceRef.current = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeWeight: 6, strokeOpacity: 0.95 },
      });
      directionsRendererRef.current.setMap(mapRef.current);
    }
  }, [mapRef.current, googleMapsLoaded]);

  /* --------------------------
     Obtener userId desde Strapi (si usas autenticación)
     Aquí intento buscar por email en /api/users. Ajusta si tu API responde distinto.
     -------------------------- */
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setUserId(user.email);  // ← AQUÍ queda tu driverId real
      console.log("taxi debug: driverId asignado ->", user.email);
    }
  }, [isAuthenticated, user]);
  /* --------------------------
     SOCKET: conectar y listeners (siempre que no haya otro socket)
     -------------------------- */
  useEffect(() => {
    if (socketRef.current) return; // ya conectado
    try {
      const socket = io(process.env.REACT_APP_SOCKET_URL, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Conductor socket conectado', socket.id);
        if (userId) {
          socket.emit('register-driver', { driverId: userId });
        }
      });

      // Llega un request de viaje (targeted o broadcast)
      socket.on('trip-request', (data) => {
        try {
          console.log('trip-request recibido:', data);
          if (!data) return;
          // criterio: si viene driverId y coincide, o viene broadcast/nearby o candidateDrivers incluye userId
          const addressed = data.driverId && userId && data.driverId.toString() === userId.toString();
          const broadcast = data.broadcast === true || data.target === 'nearby';
          const included = Array.isArray(data.candidateDrivers) && userId && data.candidateDrivers.map(String).includes(String(userId));
          if (addressed || broadcast || included) {
            // añadir al arreglo de viajes
            setTravelData(prev => {
              const next = [...prev, data];
              return next;
            });
            setIsWaiting(false);

            // Añadir marcador del origen al mapa (si vienen coords)
            if (mapRef.current && window.google && data.originCoordinates) {
              try {
                // crear marcador y guardarlo para limpiar después
                const marker = new window.google.maps.Marker({
                  position: data.originCoordinates,
                  map: mapRef.current,
                  title: data.originAdress || 'Origen',
                  icon: {
                    url: taxiIcon,
                    scaledSize: new window.google.maps.Size(44, 44),
                  },
                });
                markersRef.current.push(marker);
                // centrar suavemente
                if (mapRef.current.setCenter) mapRef.current.setCenter(data.originCoordinates);
              } catch (e) {
                console.warn('No se pudo crear pickup marker manual:', e);
              }
            }
          } else {
            // mensaje no dirigido a este conductor: ignorarlo
            // console.log('trip-request no dirigido a este conductor, ignorando');
          }
        } catch (e) {
          console.error('Error manejando trip-request', e);
        }
      });

      // Listener opcional cuando pasajero obtiene conductores
      socket.on('drivers-found', (payload) => {
        // normalmente interesa al pasajero, pero lo dejo por debug
        console.log('drivers-found (conductor):', payload);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket desconectado:', reason);
      });

      socket.on('connect_error', (err) => {
        console.warn('Socket connect_error', err);
      });
    } catch (e) {
      console.error('Error creando socket conductor:', e);
    }

    return () => {
      // cleanup
      try {
        if (socketRef.current) {
          socketRef.current.off('trip-request');
          socketRef.current.off('drivers-found');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      } catch (e) {
        console.warn('Error limpiando socket conductor:', e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // reconectará si cambia userId

  /* --------------------------
     Limpiar marcadores cuando se desmonta o cuando se vacía travelData
     -------------------------- */
  useEffect(() => {
    return () => {
      // al desmontar limpiamos marcadores
      if (markersRef.current && markersRef.current.length) {
        markersRef.current.forEach(m => { try { m.setMap(null); } catch (e) {} });
        markersRef.current = [];
      }
      if (pickupMarkerRef.current) {
        try { pickupMarkerRef.current.setMap(null); } catch (e) {}
        pickupMarkerRef.current = null;
      }
    };
  }, []);

  /* --------------------------
     Cuando se selecciona un viaje (consultedTravel), mostrar la ruta
     -------------------------- */
  useEffect(() => {
    if (consultedTravel === null) return;
    const travel = travelData[consultedTravel];
    if (!travel) return;
    if (!window.google || !mapRef.current) return;
    if (!directionsServiceRef.current) directionsServiceRef.current = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({ suppressMarkers: true });
      directionsRendererRef.current.setMap(mapRef.current);
    }
    // usamos originAdress/destinationAdress o coordinates si vienen
    const origin = travel.originCoordinates || travel.originAdress;
    const destination = travel.destinationCoordinates || travel.destinationAdress;
    try {
      directionsServiceRef.current.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' || status === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result);
            // opcional: posicionar marker de origen/final si quieres
            try {
              const leg = result.routes[0].legs[0];
              // marcador inicio
              if (pickupMarkerRef.current) {
                pickupMarkerRef.current.setPosition(leg.start_location);
              } else {
                pickupMarkerRef.current = new window.google.maps.Marker({
                  position: leg.start_location,
                  map: mapRef.current,
                  title: 'Origen',
                });
              }
              // limpiar marcadores guardados (no confundas con markersRef que son de otros trips)
            } catch (e) {
              console.warn('No se pudo actualizar pickup marker desde directions', e);
            }
          } else {
            console.error('Directions error', status);
          }
        }
      );
    } catch (e) {
      console.warn('Error solicitando directions', e);
    }
  }, [consultedTravel, travelData]);

  /* --------------------------
     Handlers que el UI (ConductorRender) espera
     -------------------------- */
  const handleTravelCardClick = (index) => {
    setConsultedTravel(index);
  };

  const handleBackButtonClick = () => setConsultedTravel(null);

  const handleCloseButtonClick = (index) => {
    setTravelData(prev => prev.filter((_, i) => i !== index));
    if (travelData.length <= 1) setIsWaiting(true);
    // limpiar markers asociados: aquí podríamos quitar marker por índice si los relaciones
    // para simplicidad limpiamos todos los markers y los volveremos a dibujar cuando sea necesario
    markersRef.current.forEach(m => { try { m.setMap(null); } catch (e) {} });
    markersRef.current = [];
  };

  const handleAcceptTrip = async (index) => {
    const idx = typeof index === 'number' ? index : consultedTravel;
    const travel = travelData[idx];
    if (!travel) return console.error('No hay viaje para aceptar en index', idx);

    // Emitir oferta via socket
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('oferta', {
          driverId: userId,
          travelId: travel.id || travel.travelId,
          originAddress: travel.originAdress,
          destinationAddress: travel.destinationAdress,
          coordinates: userCoords,
        });
        // marcar localmente como aceptado
        setTravelData(prev => prev.map((t, i) => i === idx ? { ...t, accepted: true } : t));
        // opcional: ocultar lista y mostrar viaje en curso
        setIsWaiting(true);
      } else {
        // fallback HTTP (si tu backend dispone)
        try {
          await axios.post(`${process.env.REACT_APP_STRAPI_URL}/api/ofertas`, {
            driverId: userId,
            travelId: travel.id || travel.travelId,
          });
          setTravelData(prev => prev.map((t, i) => i === idx ? { ...t, accepted: true } : t));
          setIsWaiting(true);
        } catch (e) {
          console.warn('Fallback oferta HTTP fallo', e);
        }
      }
    } catch (e) {
      console.error('Error en handleAcceptTrip', e);
    }
  };

  const handlePasajero = () => {
    setShowTabs(true);
    setActiveTab('pasajero');
  };

  const handleConductor = () => {
    setShowTabs(false);
    setActiveTab('conductor');
    setShiftToPasajero(true);
  };

  const ElapsedTimer = ({ startTime }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    useEffect(() => {
      if (!startTime) return;
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = Math.floor((now - start) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
      return () => clearInterval(interval);
    }, [startTime]);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return <span>{minutes}:{seconds < 10 ? '0' : ''}{seconds}</span>;
  };

  return (
    <ConductorRender
      isWaiting={isWaiting}
      googleMapsLoaded={googleMapsLoaded}
      mapRef={mapRef}
      userCoords={userCoords}
      setUserCoords={setUserCoords}
      travelData={travelData}
      consultedTravel={consultedTravel}
      handleTravelCardClick={handleTravelCardClick}
      handleBackButtonClick={handleBackButtonClick}
      handleCloseButtonClick={handleCloseButtonClick}
      handleAcceptTrip={handleAcceptTrip}
      handlePasajero={handlePasajero}
      handleConductor={handleConductor}
      ElapsedTimer={ElapsedTimer}
      showTabs={showTabs}
      hideTabs={hideTabs}
    />
  );
};

export default Conductor;
