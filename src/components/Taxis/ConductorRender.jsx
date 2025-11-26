import React, { useEffect } from 'react';
import formaters from '../../utils/formaters';

import UserLocation from '../Usuarios/UserLocation';
import { RolPasajero, RolConductor } from './Roles';
import ConductorContainer from './ConductorContainer';
import EsperandoViaje from './EsperandoViaje.jsx';
import TravelCard from './TravelCard.jsx'; // <- asegúrate de que existe

const { formatTime, formatPrice } = formaters;

const ConductorRender = ({
  isWaiting,
  googleMapsLoaded,
  mapRef,
  userCoords,
  setUserCoords,
  travelData,
  consultedTravel,
  handleTravelCardClick,
  handleBackButtonClick,
  handleCloseButtonClick,
  handleAcceptTrip,
  handlePasajero,
  handleConductor,
  ElapsedTimer,
  showTabs,
  hideTabs,
}) => {
  useEffect(() => {
    console.log('taxi debug: ConductorRender montado');
    return () => {
      console.log('taxi debug: ConductorRender desmontado');
    };
  }, []);

  useEffect(() => {
    console.log('taxi debug: props update ->', {
      isWaiting,
      travelCount: Array.isArray(travelData) ? travelData.length : 0,
      consultedTravel,
      googleMapsLoaded,
      showTabs,
      hideTabs,
    });
  }, [isWaiting, travelData, consultedTravel, googleMapsLoaded, showTabs, hideTabs]);

  // Solo dependemos de googleMapsLoaded; dentro comprobamos mapRef.current
  useEffect(() => {
    if (googleMapsLoaded && mapRef && mapRef.current) {
      console.log('taxi debug: mapa listo en ConductorRender, mapRef.current existe');
    } else {
      console.log('taxi debug: mapa NO listo (googleMapsLoaded, mapRef):', {
        googleMapsLoaded,
        hasMapRef: !!(mapRef && mapRef.current),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsLoaded]);

  useEffect(() => {
    if (Array.isArray(travelData) && travelData.length > 0) {
      console.log('🚕 taxi debug: VIAJES RECIBIDOS DEL SOCKET:', travelData.length);
    }
  }, [travelData]);

  return (
    <ConductorContainer>
      {googleMapsLoaded && mapRef && mapRef.current && (
        <UserLocation
          onLocation={(coords) => {
            console.log('taxi debug: UserLocation -> nueva ubicación recibida', coords);
            if (typeof setUserCoords === 'function') setUserCoords(coords);
          }}
          map={mapRef.current}
        />
      )}

      {isWaiting ? (
        <div>
          <EsperandoViaje
            handlePasajero={() => {
              console.log('taxi debug: EsperandoViaje -> handlePasajero invoked');
              if (typeof handlePasajero === 'function') handlePasajero();
            }}
            handleConductor={() => {
              console.log('taxi debug: EsperandoViaje -> handleConductor invoked');
              if (typeof handleConductor === 'function') handleConductor();
            }}
            rol="conductor"
            newTravel={Array.isArray(travelData) && travelData.length > 0 ? travelData[0] : null}
          />
        </div>
      ) : (
        <div className="travel-list">
          {consultedTravel === null ? (
            Array.isArray(travelData) && travelData.length > 0 ? (
              travelData.map((travel, index) => {
                const distanceKm = travel && travel.totalDistance ? (travel.totalDistance / 1000).toFixed(2) : '--';
                const timeMin = travel && travel.totalTime ? formatTime(travel.totalTime) : '';

                // Renderizamos TravelCard (cada TravelCard puede tener sus hooks top-level)
                return (
                  <TravelCard
                    key={travel?.id || travel?.travelId || index}
                    travel={travel}
                    index={index}
                    onClick={handleTravelCardClick}
                    onClose={handleCloseButtonClick}
                    onAccept={handleAcceptTrip}
                  >
                    {/* Si quieres el markup inline dentro del TravelCard, puedes pasarlo como children,
                        pero lo más simple es que TravelCard renderice todo internamente. */}
                  </TravelCard>
                );
              })
            ) : (
              <div style={{ padding: 16, color: '#666' }}>No hay viajes disponibles.</div>
            )
          ) : (
            <div className="single-travel-container">
              <button
                className="back-button"
                onClick={() => {
                  console.log('taxi debug: botón atrás en detalle viaje');
                  handleBackButtonClick();
                }}
              >
                🔙 Atrás
              </button>
            </div>
          )}
        </div>
      )}

      <div className="taxis-map">
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
      </div>

      {!showTabs && !hideTabs ? (
        <RolPasajero
          handlePasajero={() => {
            console.log('taxi debug: RolPasajero -> handlePasajero');
            if (typeof handlePasajero === 'function') handlePasajero();
          }}
          handleConductor={() => {
            console.log('taxi debug: RolPasajero -> handleConductor');
            if (typeof handleConductor === 'function') handleConductor();
          }}
          rol="pasajero"
        />
      ) : (
        <RolConductor
          handlePasajero={() => {
            console.log('taxi debug: RolConductor -> handlePasajero');
            if (typeof handlePasajero === 'function') handlePasajero();
          }}
          handleConductor={() => {
            console.log('taxi debug: RolConductor -> handleConductor');
            if (typeof handleConductor === 'function') handleConductor();
          }}
          rol="conductor"
        />
      )}
    </ConductorContainer>
  );
};

export default ConductorRender;
