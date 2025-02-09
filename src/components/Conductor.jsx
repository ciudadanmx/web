import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import io from 'socket.io-client';
import '../styles/taxis.css';
import formaters from '../utils/formaters';
//desempaquetado de los formateadores
import UserLocation from './UserLocation'
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
  }, []);

  // Inicializar el mapa y guardarlo en mapRef.current
  useEffect(() => {
    if (googleMapsLoaded && window.google) {
      mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
        center: zocaloCoords,
        zoom: 17,
      });
    }
  }, [googleMapsLoaded, zocaloCoords]);

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
      socket.on('mensajeConductor', (data) => {
        console.log('Evento de solicitud recibido: ', data);
        if (data.driverId === userId) {
          setIsWaiting(false);
          setTravelData((prevTravelData) => [...prevTravelData, data]);
        }
      });
    }
    return () => {
      socket.disconnect();
      console.log('Desconectando socket...');
    };
  }, [userId]);

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

  // UseEffect para pintar la ruta y agregar el marcador de recogida en el mapa
  useEffect(() => {
    if (acceptedTravel !== null && googleMapsLoaded && window.google && mapRef.current) {
      const travel = travelData[acceptedTravel];
      if (travel && travel.originAdress && travel.destinationAdress && travel.destinationAdress !== 'sin datos') {
        const directionsService = new window.google.maps.DirectionsService();
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
        }
        directionsRendererRef.current.setMap(mapRef.current);
        directionsService.route({
          origin: travel.originAdress,
          destination: travel.destinationAdress,
          travelMode: window.google.maps.TravelMode.DRIVING,
        }, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result);
            // Agregar marcador en el punto de recogida (start_location de la ruta)
            const startLocation = result.routes[0].legs[0].start_location;
            if (!pickupMarkerRef.current) {
              pickupMarkerRef.current = new window.google.maps.Marker({
                position: startLocation,
                map: mapRef.current,
                title: "Punto de recogida",
              });
            } else {
              pickupMarkerRef.current.setPosition(startLocation);
              pickupMarkerRef.current.setMap(mapRef.current);
            }
          } else {
            console.error('Error fetching directions', result);
          }
        });
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
    }
  }, [acceptedTravel, googleMapsLoaded, travelData]);

  useEffect(() => {
    if (mapRef.current && userCoords) {
      mapRef.current.setCenter(userCoords);
    }
  }, [userCoords]);
  

  return (
    <div className="conductor-layout">
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
                        $ {formatPrice(travel.price, 'enteros')}
                        <sup>{formatPrice(travel.price, 'decimales')}</sup>
                      </span>
                      <span className="travel-distance">
                        {(travel.totalDistance / 1000).toFixed(2)} km – {formatTime(travel.totalTime)} min
                      </span>
                      <span className="travel-time">{travel.totalTime}</span>
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
