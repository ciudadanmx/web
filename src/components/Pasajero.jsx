import React, { useState, useEffect } from 'react';
import '../styles/taxis.css';

const Pasajero = () => {
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [fromCoordinates, setFromCoordinates] = useState({ lat: 19.432608, lng: -99.133209 });
  const [toCoordinates, setToCoordinates] = useState({ lat: 19.4374453, lng: -99.14651119999999 });
  const [fromMarkerPosition, setFromMarkerPosition] = useState({ lat: 19.432608, lng: -99.133209 });
  const [toMarkerPosition, setToMarkerPosition] = useState({ lat: 19.432608, lng: -99.133209 });
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");

  useEffect(() => {
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
      console.error("Error al cargar Google Maps API:", error);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (googleMapsLoaded && window.google) {
      const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
        center: fromCoordinates,
        zoom: 17,
      });

      const fromMarker = new window.google.maps.Marker({
        map: mapInstance,
        position: fromCoordinates,
      });

      const toMarker = new window.google.maps.Marker({
        map: mapInstance,
        position: toCoordinates,
      });

      window.google.maps.event.addListener(mapInstance, 'click', (event) => {
        const { latLng } = event;
        const newLat = latLng.lat();
        const newLng = latLng.lng();

        setFromCoordinates({ lat: newLat, lng: newLng });
        setToCoordinates({ lat: newLat, lng: newLng });
        setFromMarkerPosition({ lat: newLat, lng: newLng });
        setToMarkerPosition({ lat: newLat, lng: newLng });

        fromMarker.setPosition({ lat: newLat, lng: newLng });
        toMarker.setPosition({ lat: newLat, lng: newLng });
      });

      const fromInput = document.getElementById('from-input');
      const toInput = document.getElementById('to-input');
      const fromAutocomplete = new window.google.maps.places.Autocomplete(fromInput);
      const toAutocomplete = new window.google.maps.places.Autocomplete(toInput);

      fromAutocomplete.addListener('place_changed', () => {
        const fromPlace = fromAutocomplete.getPlace();
        if (fromPlace.geometry) {
          const newFromLat = fromPlace.geometry.location.lat();
          const newFromLng = fromPlace.geometry.location.lng();

          setFromCoordinates({ lat: newFromLat, lng: newFromLng });
          setFromMarkerPosition({ lat: newFromLat, lng: newFromLng });
          fromMarker.setPosition({ lat: newFromLat, lng: newFromLng });

          setFromAddress(fromPlace.formatted_address);
          console.log(`Origen: ${fromPlace.formatted_address}`);
        }
      });

      toAutocomplete.addListener('place_changed', () => {
        const toPlace = toAutocomplete.getPlace();
        if (toPlace.geometry) {
          const newToLat = toPlace.geometry.location.lat();
          const newToLng = toPlace.geometry.location.lng();

          setToCoordinates({ lat: newToLat, lng: newToLng });
          setToMarkerPosition({ lat: newToLat, lng: newToLng });
          toMarker.setPosition({ lat: newToLat, lng: newToLng });

          setToAddress(toPlace.formatted_address);
          console.log(`Destino: ${toPlace.formatted_address}`);
        }
      });
    }
  }, [googleMapsLoaded, fromCoordinates]);

  const buscarTaxistas = async () => {
    console.log("Buscando taxistas cercanos...");
    
    const payload = {
      origin: fromCoordinates,
      destination: toCoordinates,
    };

    console.log(`----- ${ JSON.stringify(payload)} ------- `);

    try {
      const response = await fetch(`${process.env.REACT_APP_STRAPI_URL}/api/conductores-cercanos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Error en la petición");
      }

      const data = await response.json();
      console.log("Taxistas encontrados:", data);
    } catch (error) {
      console.error("Error al buscar taxistas:", error);
    }
  };

  return (
    <div className='taxis-container'>
      <span className='formulario-pasajero trip-title'> <center>Buscar un viaje</center></span>
      <input
        id="from-input"
        type="text"
        placeholder="Origen"
        value={fromAddress}
        onChange={(e) => setFromAddress(e.target.value)}
        className='lugar-input formulario-pasajero pasajero-origen'
      />

      <input
        id="to-input"
        type="text"
        placeholder="Destino"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
        className='lugar-input formulario-pasajero pasajero-origen'
      />

      {/* Botón para buscar taxistas */}
      <button 
        onClick={buscarTaxistas} 
        className="buscar-taxistas formulario-pasajero pasajero-buscar"
      >
        Buscar Taxistas
      </button>

      <div className='taxis-map formulario-pasajero tapado'>
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
      </div>

      <div className='cuadro-coordenadas formulario-pasajero tapado'>
        <h4>Coordenadas actuales:</h4>
        <p><strong>Latitud:</strong> {fromCoordinates.lat}</p>
        <p><strong>Longitud:</strong> {fromCoordinates.lng}</p>
      </div>

      <div className='separador-final'>aaa<p>aaaaa</p>aaa<p>aaaaa</p>aaa<p>aaaaa</p></div>
    </div>
  );
};

export default Pasajero;
