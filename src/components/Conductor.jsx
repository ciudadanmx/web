import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import io from 'socket.io-client';
import '../styles/taxis.css';


const Conductor = () => {
  const { user, isAuthenticated } = useAuth0();
  const [isWaiting, setIsWaiting] = useState(true);
  const [travelData, setTravelData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const zocaloCoords = { lat: 19.432607, lng: -99.133209 };



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
              params: {
                "filters[email]": user.email, // Buscando el usuario por email
              },
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
    const socket = io(process.env.REACT_APP_SOCKET_URL); // URL del servidor de sockets

    if (userId) {
      console.log('Estableciendo conexión con el socket...');
      
      socket.on('mensajeConductor', (data) => {
        console.log('evento de solicitud !!! ');
        console.log(data);
        if (data.driverId === userId) {
          console.log('Viaje encontrado:', data);
          setIsWaiting(false);
          setTravelData(data);
        }
      });
    }


 
    

    return () => {
      socket.disconnect();
      console.log('Desconectando socket...');
    };
  }, [userId]);

  const handleTravelButtonClick = () => {
    if (travelData) {
      console.log('Datos del viaje:', travelData);
      // Aquí puedes agregar la lógica para manejar el viaje, por ejemplo, aceptar el viaje, etc.
    }
  };

  return (
    <div>
      <div>
      {isWaiting ? (
        <div>
          <p>Esperando viajes...</p>
        </div>
      ) : (
        <div>
          <h2>
            Viaje: {travelData?.origin} a {travelData?.destination}
          </h2>
          <span className='conductor-a-title'>a</span>
          <span className='conductor-a'>
          Ejercito Nacional 1150, Col. Polanco CDMX
          </span>
           <hr />
           <span className='conductor-a-title'>de</span>
           <span className='conductor-a'>
            Ejercito Nacional 1150, Col. Polanco CDMX
          </span>
        </div>
      )}
    </div>
    <div className='taxis-map'>
    <div id="map" style={{ width: '100%', height: '100%' }}></div>
    </div>
    </div>

    

  );
};

export default Conductor;
