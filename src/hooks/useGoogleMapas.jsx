// src/hooks/useGoogleMaps.js
import { useEffect, useRef } from 'react';

/**
 * Hook sencillo que:
 * - inserta el script de Google Maps si no existe
 * - crea mapRef.current apuntando al map
 * - crea fromMarkerRef.current y toMarkerRef.current (markers vacíos)
 *
 * Requiere que en tu .env tengas REACT_APP_GOOGLE_MAPS_KEY con la API key.
 * Si tu proyecto usa otro nombre para la env var, cámbialo abajo.
 */
export default function useGoogleMaps(
  fromCoordinates,
  setFromCoordinates,
  fromMarkerInitial,
  toCoordinates,
  setToCoordinates,
  toMarkerInitial,
  setFromAddress,
  setToAddress,
  setGoogleMapsLoaded
) {
  const mapRef = useRef(null);
  const fromMarkerRef = useRef(null);
  const toMarkerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const key = process.env.REACT_APP_GOOGLE_MAPS_KEY;
    if (!key) {
      console.warn('[useGoogleMaps] no REACT_APP_GOOGLE_MAPS_KEY en env. El mapa no cargará.');
      return;
    }

    const globalCallbackName = '__initMapForCiudadan';

    // si ya está cargado el script y window.google existe, inicializamos directamente
    const initMap = () => {
      try {
        if (!document.getElementById('map')) {
          // el componente MapView debe renderizar un div con id="map"
          console.warn('[useGoogleMaps] no existe div#map en DOM todavía.');
        }

        if (!window.google || !window.google.maps) {
          console.warn('[useGoogleMaps] window.google.maps no disponible aún.');
          return;
        }

        if (!mapRef.current) {
          const mapEl = document.getElementById('map');
          mapRef.current = new window.google.maps.Map(mapEl, {
            center: fromCoordinates || { lat: 19.432608, lng: -99.133209 },
            zoom: 14,
            disableDefaultUI: false,
          });
        }

        // crear markers si no existen
        if (!fromMarkerRef.current) {
          fromMarkerRef.current = new window.google.maps.Marker({
            position: fromCoordinates,
            map: mapRef.current,
            title: 'Origen',
          });
        } else {
          fromMarkerRef.current.setPosition(fromCoordinates);
        }

        if (!toMarkerRef.current) {
          toMarkerRef.current = new window.google.maps.Marker({
            position: toCoordinates,
            map: mapRef.current,
            title: 'Destino',
          });
        } else {
          toMarkerRef.current.setPosition(toCoordinates);
        }

        // opcional: click en mapa para actualizar origen/destino si quieres (aquí no lo activo)
        setGoogleMapsLoaded && setGoogleMapsLoaded(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[useGoogleMaps] initMap error', e);
      }
    };

    // si ya existe window.google.maps -> init
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // si ya se inyectó el script (por otro componente) pero no está cargado, sólo ponemos callback
    if (window[globalCallbackName]) {
      // otro componente ya registró el callback; no duplicar
    }

    // inyectar script una sola vez
    if (!scriptLoadedRef.current && !document.querySelector(`script[data-ciudadan-maps]`)) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-ciudadan-maps', '1');
      // el callback global
      window[globalCallbackName] = () => {
        initMap();
      };
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${globalCallbackName}`;
      script.onerror = (err) => {
        // eslint-disable-next-line no-console
        console.warn('[useGoogleMaps] error cargando script Google Maps', err);
      };
      document.head.appendChild(script);
      scriptLoadedRef.current = true;
    }

    // intentar inicializar si el script ya está agregado y cargado
    const maybeInit = () => {
      if (window.google && window.google.maps) initMap();
    };

    // si el script ya cargó antes de este efecto
    maybeInit();

    return () => {
      // no removemos script para no romper otros componentes que lo usen
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sincronizar posiciones de markers cuando cambian coords desde el padre
  useEffect(() => {
    try {
      if (fromMarkerRef.current && fromCoordinates) {
        fromMarkerRef.current.setPosition(fromCoordinates);
        if (mapRef.current && mapRef.current.setCenter) {
          // no cambiar el centro automáticamente salvo que quieras
        }
      }
    } catch (e) {
      // noop
    }
  }, [fromCoordinates]);

  useEffect(() => {
    try {
      if (toMarkerRef.current && toCoordinates) {
        toMarkerRef.current.setPosition(toCoordinates);
      }
    } catch (e) {
      // noop
    }
  }, [toCoordinates]);

  return { mapRef, fromMarkerRef, toMarkerRef };
}
