import React, { useState, useEffect } from 'react';

const Conductor = () => {
  // Estado para la carga del script de Google Maps
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Estado para las coordenadas y la posición del marcador
  const [coordinates, setCoordinates] = useState({ lat: 19.432608, lng: -99.133209 }); // Coordenadas por defecto
  const [toCoordinates, setToCoordinates] = useState({ lat: 19.4374453, lng: -99.14651119999999 }); // Coordenadas por defecto
  const [markerPosition, setMarkerPosition] = useState({ lat: 19.432608, lng: -99.133209 }); // Inicial
  const [toMarkerPosition, setToMarkerPosition] = useState({ lat: 19.432608, lng: -99.133209 }); // Inicial

  // Estado para la dirección seleccionada
  const [address, setAddress] = useState("");

  // Cargar la API de Google Maps con tu clave
  useEffect(() => {
    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_PLACES_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Inicializar el mapa y el marcador cuando la API esté cargada
  useEffect(() => {
    if (googleMapsLoaded && window.google) {
      const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
        center: coordinates,
        zoom: 17, // Reducción del zoom para una mejor visualización
      });

      const marker = new window.google.maps.Marker({
        map: mapInstance,
        position: coordinates,
      });
      
      const toMarker = new window.google.maps.Marker({
        map: mapInstance,
        position: toCoordinates,
      });

      // Manejar el evento de clic en el mapa
      window.google.maps.event.addListener(mapInstance, 'click', (event) => {
        const { latLng } = event;
        const newLat = latLng.lat();
        const newLng = latLng.lng();
        
        //const { newToLatLng } = toCoordinates;
        const newToLat = toCoordinates.lat();
        const newToLng = toCoordinates.lng();
        


        // Actualizar las coordenadas y mover el marcador
        setCoordinates({ lat: newLat, lng: newLng });
        setToCoordinates({ lat: newToLat, lng: newToLng });
        setMarkerPosition({ lat: newLat, lng: newLng });
        setToMarkerPosition({ lat: newToLat, lng: newToLng });

        marker.setPosition({ lat: newLat, lng: newLng });
        toMarker.setPosition({ lat: newToLat, lng: newToLng });
      });

      // Autocomplete para la dirección
      const input = document.getElementById('address-input');
      const autocomplete = new window.google.maps.places.Autocomplete(input);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          // Actualizar las coordenadas con la ubicación seleccionada
          const newLat = place.geometry.location.lat();
          const newLng = place.geometry.location.lng();
          const newToLat = place.geometry.toLocation.lat();
          const newToLng = place.geometry.toLocation.lng();
          setCoordinates({ lat: newLat, lng: newLng });
          setMarkerPosition({ lat: newLat, lng: newLng });
          setToMarkerPosition({ lat: newToLat, lng: newToLng });

          // Mover el marcador
          marker.setPosition({ lat: newLat, lng: newLng });
          toMarker.setPosition({ lat: newToLat, lng: newToLng });

          // Actualizar la dirección seleccionada
          setAddress(place.formatted_address);
        }
      });
    }
  }, [googleMapsLoaded, coordinates]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Mapa del Conductor</h1>

      {/* Input de Autocomplete */}
      <input
        id="address-input"
        type="text"
        placeholder="Buscar dirección"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          fontSize: '16px',
          borderRadius: '5px',
          border: '1px solid #ccc',
        }}
      />

      <div style={{ width: '100%', height: '60vh', marginBottom: '20px' }}>
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
      </div>

      {/* Sección de coordenadas */}
      <div style={{
        backgroundColor: 'black',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        color: 'white',
        margintop: '-50px',
        position: 'absolute',
      }}>
        <h4>Coordenadas actuales:</h4>
        <p><strong>Latitud:</strong> {coordinates.lat}</p>
        <p><strong>Longitud:</strong> {coordinates.lng}</p>
      </div>

      {/* Separador de 200px de altura */}
      <div style={{ height: '200px', }}>aaa<p>aaaaa</p>aaa<p>aaaaa</p>aaa<p>aaaaa</p></div>
    </div>
  );
};

export default Conductor;
