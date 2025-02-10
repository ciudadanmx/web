import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import io from 'socket.io-client';
import '../../styles/taxis.css';
import formaters from '../../utils/formaters';
import minutesSince from '../../utils/timeSince'
import { initializeMap, addTaxiMarker, loadGoogleMaps, createDirectionsRenderer, updatePickupMarker, getDirections, resetMapZoom } from '../../utils/mapUtils';
import taxiIcon from '../../assets/taxi_marker.png';
//desempaquetado de los formateadores
import UserLocation from '../UserLocation'
const { formatTime, formatPrice } = formaters;


const Conductor = () => {
  const { user, isAuthenticated } = useAuth0();
  const [isWaiting, setIsWaiting] = useState(true);
  const [travelData, setTravelData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [acceptedTravel, setAcceptedTravel] = useState(null);
  const zocaloCoords = { lat: 19.432607, lng: -99.133209 };
  const [userCoords, setUserCoords] = useState(null);

  // Refs para el mapa, DirectionsRenderer y el marcador de recogida
  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const pickupMarkerRef = useRef(null);

  useEffect(() => {
    return loadGoogleMaps(setGoogleMapsLoaded);
  }, []);

  // Inicializar el mapa y guardarlo en mapRef.current
  useEffect(() => {
    if (googleMapsLoaded && window.google) {
      mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
        center: zocaloCoords,
        zoom: 14,
      });

      const fromMarker = new window.google.maps.Marker({
        map: mapRef.current,
        position: userCoords,
        icon: {
          url: '../assets/taxi_marker.png',
          scaledSize: new window.google.maps.Size(54,54 ),
        },
      });

    }
  }, [googleMapsLoaded, userCoords]);

  useEffect(() => {
    const fetchUserId = async () => {
      if (isAuthenticated && user?.email) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_STRAPI_URL}/api/users`,
            {
              params: { 'filters[email]': user.email },
            }
          );
          if (response.data.length > 0) {
            setUserId(response.data[0].id);
            console.log('User ID from Strapi:', response.data[0].id);
          }
        } catch (error) {
          console.error('Error fetching user ID from Strapi:', error);
        }
      }
    };
    if (isAuthenticated && user) {
      fetchUserId();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL);
    if (userId) {
      console.log('Estableciendo conexión con el socket...');
      socket.on('trip-request', (data) => {
        console.log('Evento de solicitud recibido: ', data);
        if (data.driverId === userId) {
          setIsWaiting(false);
          setTravelData((prevTravelData) => [...prevTravelData, data]);
          const minutosTranscurridos = minutesSince.getMinutesSince(data.requestTime, 'cdmx');
          console.log(`Han pasado ${minutosTranscurridos} minutos.`);   
        }
      });
    }
    return () => {
      socket.disconnect();
      console.log('Desconectando socket...');
    };
  }, [userId]);

  //pinta la ruta para el viaje consultado
  useEffect(() => {
    if (
      acceptedTravel !== null &&
      googleMapsLoaded &&
      window.google &&
      mapRef.current
    ) {
      const travel = travelData[acceptedTravel];
      if (
        travel &&
        travel.originAdress &&
        travel.destinationAdress &&
        travel.destinationAdress !== "sin datos"
      ) {
        const directionsService = new window.google.maps.DirectionsService();
  
        // Crear el DirectionsRenderer si aún no existe
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = createDirectionsRenderer(mapRef);
        }
  
        // Llamamos a getDirections pasando también pickupMarkerRef
        getDirections(
          travel.originAdress,
          travel.destinationAdress,
          directionsService,
          directionsRendererRef,
          mapRef,
          pickupMarkerRef
        );
      }
    } else {
      // Si no hay viaje seleccionado, quitar la ruta y el marcador del mapa
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setMap(null);
        pickupMarkerRef.current = null;
      }

      resetMapZoom(mapRef, 14);
    }
  }, [acceptedTravel, googleMapsLoaded, travelData]);

  
  //inicialización del mapa
  useEffect(() => {
    if (googleMapsLoaded && window.google && mapRef.current) {
        initializeMap(mapRef, userCoords);
        addTaxiMarker(mapRef, userCoords, taxiIcon);
    }
  }, [googleMapsLoaded, userCoords]);

  
  // Al hacer click en la card (envuelta en <a>) se guarda el índice del viaje seleccionado
  const handleTravelCardClick = (index) => {
    console.log('Datos del viaje:', travelData[index]);
    setAcceptedTravel(index);
  };

  // El botón cerrar elimina la card de la lista
  const handleCloseButtonClick = (index) => {
    setTravelData((prevData) => prevData.filter((_, i) => i !== index));
  };

  // El botón Atrás vuelve a mostrar la lista de viajes y limpia la ruta del mapa
  const handleBackButtonClick = () => {
    setAcceptedTravel(null);
  };

  // Aquí agregamos el cronómetro que muestra hace cuantos minutos y segundos se solicitó el viaje
  const ElapsedTimer = ({ startTime }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(startTime);
        const diffSeconds = Math.floor((now - start) / 1000);
        setElapsedSeconds(diffSeconds);
      }, 1000);

      return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return (
      <span>
        {minutes}:{seconds < 10 ? '0' : ''}
        {seconds}
      </span>
    );
  };

  return (
    <div className="conductor-layout" classname="creciente" >
      {googleMapsLoaded && mapRef.current && (
        <UserLocation onLocation={setUserCoords} map={mapRef.current} />
      )}
      {isWaiting ? (
        <div>
          <p>Esperando viajes...</p>
        </div>
      ) : (
        <div className="travel-list">
          {acceptedTravel === null ? (
            travelData.map((travel, index) => (
              <a
                href="#"
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  handleTravelCardClick(index);
                }}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="travel-container">
                  <button
                    className="close-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseButtonClick(index);
                    }}
                  >
                    ✖
                  </button>
                  <div className="travel-header">
                    <div className="travel-info-container">
                      <div className="travel-row">
                        <p className="travel-label"><strong>De:</strong></p>
                        <p className="travel-info">{travel.originAdress}</p>
                      </div>
                      <div className="travel-row">
                        <p className="travel-label"><strong>A:</strong></p>
                        <p className="travel-info">{travel.destinationAdress || 'sin datos'}</p>
                      </div>
                    </div>
                    <div className="travel-price">
                      <span className="price-amount">
                        $ {formatPrice(travel.price, 'enteros')}. 
                        <sup>{formatPrice(travel.price, 'decimales')}</sup>
                      </span>
                      <span className="travel-distance">
                        {(travel.totalDistance / 1000).toFixed(2)} km – {formatTime(travel.totalTime)} min
                      </span>
                      <span className="travel-time">
                        <ElapsedTimer startTime={travel.requestTime} />
                      </span>
                    </div>
                  </div>
                  <div className="travel-buttons">
                    <button className="change-button">✏️ Cambiar</button>
                    <button className="accept-button">➕ Aceptar Viaje</button>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="single-travel-container">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                
                {travelData[acceptedTravel] ? (
                  <div className="travel-container">
                    <button
                      className="close-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseButtonClick(acceptedTravel);
                      }}
                    >
                      ✖
                    </button>
                    <div className="travel-header">
                      <div className="travel-info-container">
                        <div className="travel-row">
                          <p className="travel-label"><strong>De:</strong></p>
                          <p className="travel-info">
                            {travelData[acceptedTravel]?.originAdress || 'Dirección no disponible'}
                          </p>
                        </div>
                        <div className="travel-row">
                          <p className="travel-label"><strong>A:</strong></p>
                          <p className="travel-info">
                            {travelData[acceptedTravel]?.destinationAdress || 'sin datos'}
                          </p>

                        </div>
                      </div>
                      <div className="travel-price">
                        <span className="price-amount">
                          $ {formatPrice(travelData[acceptedTravel]?.price, 'enteros') || '0'}
                          <sup>{formatPrice(travelData[acceptedTravel]?.price, 'decimales') || '00'}</sup>
                        </span>
                        <span className="travel-distance">
                          {(travelData[acceptedTravel]?.totalDistance / 1000)?.toFixed(2) || '0.00'} km – {formatTime(travelData[acceptedTravel]?.totalTime) || '0'} min
                        </span>
                        <span className="travel-time">
                          {travelData[acceptedTravel]?.totalTime || '0'}
                        </span>
                      </div>

                    </div>
                    <div className="travel-buttons">
                      <button className="change-button">✏️ Cambiar</button>
                      <button className="accept-button">➕ Aceptar Viaje</button>
                    </div>
                  </div>
                  
                  
                    ):(<div></div>)}



              </a>
              <button className="back-button" onClick={handleBackButtonClick}>🔙 Atrás</button>
            </div>
          )}
        </div>
      )}
      <div className="taxis-map">
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
};

export default Conductor;
