export const initializeMap = (mapRef, userCoords) => {
    if (mapRef.current) {
        mapRef.current.setCenter(userCoords);
        mapRef.current.setZoom(14.5);
    }
};

export const addTaxiMarker = (mapRef, userCoords, taxiIcon) => {
    if (mapRef.current && window.google) {
        return new window.google.maps.Marker({
            map: mapRef.current,
            position: userCoords,
            icon: {
                url: taxiIcon,
                scaledSize: new window.google.maps.Size(32, 32),
            },
        });
    }
    return null;
};

export const loadGoogleMaps = (setGoogleMapsLoaded) => {
    if (window.google) {
        setGoogleMapsLoaded(true);
        return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_PLACES_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    script.onerror = (error) => {
        console.error('Error al cargar Google Maps API:', error);
    };
    document.head.appendChild(script);

    return () => {
        document.head.removeChild(script);
    };
};

export const initMap = (mapRef, centerCoords, zoom = 14) => {
    if (!window.google || !mapRef.current) return;

    mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
        center: centerCoords,
        zoom: zoom,
    });
};

export const addMarker = (mapRef, position, icon = null) => {
    if (!window.google || !mapRef.current) return;

    return new window.google.maps.Marker({
        map: mapRef.current,
        position: position,
        icon: icon ? { url: icon, scaledSize: new window.google.maps.Size(32, 32) } : null,
    });
};



// mapUtils.jsx

export const createDirectionsRenderer = (mapRef) => {
    let directionsRenderer = new window.google.maps.DirectionsRenderer();
    directionsRenderer.setMap(mapRef.current);
    return directionsRenderer;
  };
  
  export const updatePickupMarker = (startLocation, map, pickupMarkerRef) => {
    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = new window.google.maps.Marker({
        position: startLocation,
        map: map,
        title: "Punto de recogida",
      });
    } else {
      pickupMarkerRef.current.setPosition(startLocation);
      pickupMarkerRef.current.setMap(map);
    }
  };
  
  export const getDirections = (origin, destination, directionsService, directionsRendererRef, mapRef, pickupMarkerRef) => {
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          const startLocation = result.routes[0].legs[0].start_location;
          // Aquí pasamos mapRef.current (el mapa) y pickupMarkerRef
          updatePickupMarker(startLocation, mapRef.current, pickupMarkerRef);
        } else {
          console.error("Error fetching directions", result);
        }
      }
    );
  };
  