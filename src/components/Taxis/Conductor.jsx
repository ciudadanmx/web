import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import io from 'socket.io-client';
import '../../styles/taxis.css';
import formaters from '../../utils/formaters';
import minutesSince from '../../utils/timeSince'
import { initializeMap, addTaxiMarker, loadGoogleMaps, createDirectionsRenderer, updatePickupMarker, getDirections, resetMapZoom } from '../../utils/mapUtils';
import taxiIcon from '../../assets/taxi_marker.png';
import UserLocation from '../Usuarios/UserLocation';
import { RolPasajero, RolConductor } from './Roles';

const { formatTime, formatPrice } = formaters;

const Conductor = ({ setShowTabs, setHideTabs, showTabs, hideTabs, setActiveTab, shiftToPasajero, setShiftToPasajero }) => { // Recibimos setShowTabs como prop
  const { user, isAuthenticated } = useAuth0();
  const [isWaiting, setIsWaiting] = useState(true);
  const [travelData, setTravelData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [consultedTravel, setConsultedTravel] = useState(null);
  const [tabsHidden, setTabsHidden] = useState(false); // Nuevo estado para ocultar las tabs
  const zocaloCoords = { lat: 19.432607, lng: -99.133209 };
  const [userCoords, setUserCoords] = useState(null);

  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const pickupMarkerRef = useRef(null);

  //Carga del mapa
  useEffect(() => {
    return loadGoogleMaps(setGoogleMapsLoaded);
  }, []);
  //Renderizado del mapa
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
            { params: { 'filters[email]': user.email } }
          );
          if (response.data.length > 0) {
            setUserId(response.data[0].id);
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
      socket.on('trip-request', (data) => {
        if (data.driverId === userId) {
          setIsWaiting(false);
          setTravelData((prevTravelData) => [...prevTravelData, data]);
        }
      });
    }
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (
      consultedTravel !== null &&
      googleMapsLoaded &&
      window.google &&
      mapRef.current
    ) {
      const travel = travelData[consultedTravel];
      if (
        travel &&
        travel.originAdress &&
        travel.destinationAdress &&
        travel.destinationAdress !== "sin datos"
      ) {
        const directionsService = new window.google.maps.DirectionsService();
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = createDirectionsRenderer(mapRef);
        }
        getDirections(
          travel.originAdress,
          travel.destinationAdress,
          directionsService,
          directionsRendererRef,
          mapRef,
          pickupMarkerRef
        );
      }
    }
  }, [consultedTravel, googleMapsLoaded, travelData]);

  useEffect(() => {
    if (googleMapsLoaded && window.google && mapRef.current) {
        initializeMap(mapRef, userCoords);
        addTaxiMarker(mapRef, userCoords, taxiIcon);
    }
  }, [googleMapsLoaded, userCoords]);

  const handleTravelCardClick = (index) => {
    setConsultedTravel(index);
  };

  const handlePasajero = () => {
    setShowTabs(true);
    setActiveTab('pasajero');
  };
  const handleConductor = () => {
    setShowTabs(false);
    setActiveTab('conductor');
    setShiftToPasajero(true);
  }

  const handleAcceptTrip = () => {
    setHideTabs(true);
    setTabsHidden(true); // Ocultar las tabs cuando el conductor acepte el viaje
    setShowTabs(false); // Actualizar el estado en el componente padre

    // Aquí agregamos más lógica si es necesario para el evento de aceptar el viaje.
  };

  const handleCloseButtonClick = (index) => {
    setTravelData((prevData) => prevData.filter((_, i) => i !== index));
  };

  const handleBackButtonClick = () => {
    setConsultedTravel(null);
  };

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
        {minutes}:{seconds < 10 ? '0' : ''}{seconds}
      </span>
    );
  };

  return (
    <div className="creciente">
      <div className="conductor-layout">
        {googleMapsLoaded && mapRef.current && (
          <UserLocation onLocation={setUserCoords} map={mapRef.current} />
        )}
        {isWaiting ? (
          <div>Esperando viajes...</div>
        ) : (
          <div className="travel-list">
            {consultedTravel === null ? (
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
                      <button className="accept-button" onClick={handleAcceptTrip}>➕ Aceptar Viaje</button>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="single-travel-container">
                {/* Aquí se mostraría el detalle del viaje seleccionado */}
                <button className="back-button" onClick={handleBackButtonClick}>🔙 Atrás</button>
              </div>
            )}
          </div>
        )}
        <div className="taxis-map">
          <div id="map" style={{ width: '100%', height: '100%' }}></div>
        </div>
        
        {!showTabs && !hideTabs ? (
            <RolPasajero 
              handlePasajero={handlePasajero}
              handleConductor={handleConductor}
              rol='pasajero'
            />
          ) : (
            <RolConductor
              handlePasajero={handlePasajero}
              handleConductor={handleConductor}
              rol='conductor'
             />
          )
        }
 
      </div>
      
    </div>
  );
};

export default Conductor;
