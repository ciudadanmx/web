import React, { useEffect } from 'react';
import formaters from '../../utils/formaters';

import UserLocation from '../Usuarios/UserLocation';
import { RolPasajero, RolConductor } from './Roles';
import ConductorContainer from './ConductorContainer';
import EsperandoViaje from './EsperandoViaje.jsx';

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

  useEffect(() => {
    if (googleMapsLoaded && mapRef && mapRef.current) {
      console.log('taxi debug: mapa listo en ConductorRender, mapRef.current existe');
    } else {
      console.log('taxi debug: mapa NO listo (googleMapsLoaded, mapRef):', {
        googleMapsLoaded,
        hasMapRef: !!(mapRef && mapRef.current),
      });
    }
  }, [googleMapsLoaded, mapRef]);

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
          />
        </div>
      ) : (
        <div className="travel-list">
          {consultedTravel === null ? (
            Array.isArray(travelData) && travelData.length > 0 ? (
              travelData.map((travel, index) => {
                // Log ligero por cada travel (no muy pesado para no spamear)
                useEffect(() => {
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  console.log('taxi debug: travel en lista ->', {
                    index,
                    id: travel?.id || travel?.travelId,
                    origin: travel?.originAdress,
                    destination: travel?.destinationAdress,
                  });
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                }, []); // solo al montar cada tarjeta

                const distanceKm = travel && travel.totalDistance ? (travel.totalDistance / 1000).toFixed(2) : '--';
                const timeMin = travel && travel.totalTime ? formatTime(travel.totalTime) : '';

                return (
                  <a
                    href="ciudadan.org"
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('taxi debug: click tarjeta travel ->', { index, travel });
                      handleTravelCardClick(index);
                    }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="travel-container">
                      <button
                        className="close-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('taxi debug: cerrar travel index ->', index);
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
                            $ {travel && travel.price ? formatPrice(travel.price, 'enteros') : ''}.
                            <sup>{travel && travel.price ? formatPrice(travel.price, 'decimales') : ''}</sup>
                          </span>
                          <span className="travel-distance">
                            {distanceKm} km – {timeMin} min
                          </span>
                          <span className="travel-time">
                            <ElapsedTimer startTime={travel.requestTime} />
                          </span>
                        </div>
                      </div>
                      <div className="travel-buttons">
                        <button
                          className="accept-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('taxi debug: aceptar viaje click ->', { index, travelId: travel?.id || travel?.travelId });
                            handleAcceptTrip(index);
                          }}
                        >
                          ➕ Aceptar Viaje
                        </button>
                      </div>
                    </div>
                  </a>
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
