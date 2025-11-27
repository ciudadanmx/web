// src/components/Taxis/ConductorRender.jsx
import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
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
  // socket ref para emitir propuesta cuando corresponda
  const socketRef = useRef(null);
  const { user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('taxi debug: ConductorRender montado');
    return () => {
      console.log('taxi debug: ConductorRender desmontado');
    };
  }, []);

  // inicializar socket para emitir propuestas y escuchar eventos
  useEffect(() => {
    try {
      console.log('[ConductorRender] conectando socket a', process.env.REACT_APP_SOCKET_URL);
      socketRef.current = io(process.env.REACT_APP_SOCKET_URL, { transports: ['websocket'] });

      socketRef.current.on('connect', () => {
        console.log('[ConductorRender][socket] conectado id=', socketRef.current.id);
      });

      socketRef.current.on('connect_error', (err) => {
        console.warn('[ConductorRender][socket] connect_error:', err && (err.message || err));
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('[ConductorRender][socket] disconnected:', reason);
      });

      /**
       * NUEVO: Escuchar 'viajeAceptado' -> actualizar Strapi y navegar
       * payload esperado: { travelId: '...' , strapiId: <num?>, timestamp: '...' }
       */
      socketRef.current.on('viajeAceptado', async (payload) => {
        try {
          console.log('[ConductorRender] evento viajeAceptado recibido:', payload);
          const travelId = payload && (payload.travelId || payload.travelid || payload.travelID);
          if (!travelId) {
            console.warn('[ConductorRender] viajeAceptado sin travelId en payload:', payload);
            return;
          }

          // Preparar variables para Strapi
          const STRAPI_URL = (process.env.REACT_APP_STRAPI_URL || '').replace(/\/$/, '');
          const STRAPI_TOKEN = process.env.REACT_APP_STRAPI_TOKEN || null;

          if (!STRAPI_URL) {
            console.warn('[ConductorRender] REACT_APP_STRAPI_URL no configurada. No se actualizará Strapi, navegando igual.');
            // navegar aún si no se pudo actualizar
            navigate(`/taxis/viaje/${travelId}`);
            return;
          }

          // Buscar el registro de viaje por travelid en Strapi
          // endpoint: GET /api/viajes?filters[travelid][$eq]=<travelId>
          const headers = { 'Content-Type': 'application/json' };
          if (STRAPI_TOKEN) headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;

          let viajeStrapi = null;
          try {
            const qUrl = `${STRAPI_URL}/api/viajes?filters[travelid][$eq]=${encodeURIComponent(travelId)}&pagination[pageSize]=1`;
            console.log('[ConductorRender] buscando viaje en Strapi ->', qUrl);
            const resp = await fetch(qUrl, { headers });
            if (!resp.ok) {
              const txt = await resp.text().catch(() => null);
              console.warn('[ConductorRender] GET viaje en Strapi no ok:', resp.status, txt);
            } else {
              const j = await resp.json().catch(() => null);
              if (j && j.data && Array.isArray(j.data) && j.data.length > 0) {
                viajeStrapi = j.data[0]; // objeto Strapi { id, attributes }
                console.log('[ConductorRender] viajeStrapi encontrado:', viajeStrapi);
              } else {
                console.warn('[ConductorRender] no se encontró viaje con travelid en Strapi:', travelId);
              }
            }
          } catch (err) {
            console.warn('[ConductorRender] error buscando viaje en Strapi:', err);
          }

          // Buscar usuario en Strapi por email (user.email de auth0)
          let strapiUserId = null;
          try {
            if (user && user.email) {
              const usersUrl = `${STRAPI_URL}/api/users?filters[email][$eq]=${encodeURIComponent(user.email)}&pagination[pageSize]=1`;
              console.log('[ConductorRender] buscando usuario en Strapi por email ->', usersUrl);
              const respU = await fetch(usersUrl, { headers });
              if (!respU.ok) {
                const txt = await respU.text().catch(() => null);
                console.warn('[ConductorRender] GET users en Strapi no ok:', respU.status, txt);
              } else {
                const ju = await respU.json().catch(() => null);
                if (ju && ju.data && Array.isArray(ju.data) && ju.data.length > 0) {
                  strapiUserId = ju.data[0].id;
                  console.log('[ConductorRender] strapiUserId obtenido:', strapiUserId);
                } else {
                  console.warn('[ConductorRender] no se encontró usuario Strapi con email:', user.email);
                }
              }
            } else {
              console.warn('[ConductorRender] Auth0 user.email no disponible:', user);
            }
          } catch (err) {
            console.warn('[ConductorRender] error buscando usuario en Strapi:', err);
          }

          // Si encontramos el registro de viaje en Strapi, lo actualizamos
          if (viajeStrapi && viajeStrapi.id) {
            try {
              const patchUrl = `${STRAPI_URL}/api/viajes/${viajeStrapi.id}`;
              const body = {
                data: {
                  conductormail: user?.email ?? null,
                },
              };
              // si obtuvimos userId de Strapi, relacionamos conductor
              if (strapiUserId) {
                body.data.conductor = strapiUserId;
              }

              console.log('[ConductorRender] PATCH viaje Strapi ->', patchUrl, body);
              const respPatch = await fetch(patchUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body),
              });

              if (!respPatch.ok) {
                const txt = await respPatch.text().catch(() => null);
                console.warn('[ConductorRender] PATCH viaje en Strapi no ok:', respPatch.status, txt);
              } else {
                const jp = await respPatch.json().catch(() => null);
                console.log('[ConductorRender] viaje actualizado en Strapi:', jp);
              }
            } catch (err) {
              console.warn('[ConductorRender] error actualizando viaje en Strapi:', err);
            }
          } else {
            console.warn('[ConductorRender] salto actualización Strapi porque no se encontró viajeStrapi.id');
          }

          // Finalmente navegar a la página del viaje
          try {
            navigate(`/taxis/viaje/${travelId}`);
          } catch (navErr) {
            console.warn('[ConductorRender] error navegando a viaje:', navErr);
          }
        } catch (outerErr) {
          console.warn('[ConductorRender] error manejando evento viajeAceptado:', outerErr);
          // aun así intentar navegar si payload tiene travelId
          try {
            const travelId = payload && (payload.travelId || payload.travelid);
            if (travelId) navigate(`/taxis/viaje/${travelId}`);
          } catch (e) {
            // noop
          }
        }
      });
    } catch (e) {
      console.warn('[ConductorRender] no se pudo inicializar socket:', e);
      socketRef.current = null;
    }

    return () => {
      try {
        if (socketRef.current) {
          // limpiar listener específico y desconectar
          try {
            socketRef.current.off('viajeAceptado');
          } catch (offErr) {
            // noop
          }
          socketRef.current.disconnect();
          socketRef.current = null;
          console.log('[ConductorRender] socket desconectado al desmontar componente');
        }
      } catch (e) {
        console.warn('[ConductorRender] error desconectando socket:', e);
      }
    };
  }, [user, navigate]);

  // helper para emitir la propuesta por socket
  const emitProposal = (travel, extra = {}) => {
    try {
      if (!socketRef.current || socketRef.current.disconnected) {
        console.warn('[ConductorRender] socket no conectado — no se emitirá la propuesta');
        return;
      }

      const travelId = travel?.id ?? travel?.travelId ?? null;
      const price = extra.price ?? travel?.price ?? travel?.proposedPrice ?? null;

      const payload = {
        travelId,
        price,
        driverCoordinates: userCoords ?? null,
        timestamp: new Date().toISOString(),
        rawTravel: travel ?? null,
      };

      socketRef.current.emit('enviar-propuesta', payload);
      console.log('[ConductorRender] emitido evento enviar-propuesta:', payload);
    } catch (e) {
      console.warn('[ConductorRender] error emitiendo propuesta:', e);
    }
  };

  // wrapper que emite la propuesta y luego delega al handler original
  const handleAcceptTripWrapped = async (travel, pricePassed, ...rest) => {
    // pricePassed viene de TravelCard; puede ser undefined
    try {
      emitProposal(travel, { price: pricePassed });
    } catch (e) {
      console.warn('[ConductorRender] error en emitProposal', e);
    }

    if (typeof handleAcceptTrip === 'function') {
      try {
        // Aceptamos que el handler pueda ser sync o async, lo await para capturar errores correctamente
        await handleAcceptTrip(travel, pricePassed, ...rest);
      } catch (err) {
        // Normalizamos errores nulos/indefinidos para evitar "cannot read properties of null (reading 'stack')"
        let safeErr = err;
        try {
          if (!safeErr) {
            safeErr = new Error('Error desconocido (handler devolvió null/undefined)');
          } else if (typeof safeErr === 'string') {
            safeErr = new Error(safeErr);
          } else if (!(safeErr instanceof Error)) {
            // intentar construir un Error legible
            safeErr = new Error(JSON.stringify(safeErr));
          }
        } catch (normErr) {
          safeErr = new Error('Error desconocido al normalizar excepción');
        }
        // ahora sí logueamos de forma segura
        try {
          console.error('[ConductorRender] error en handleAcceptTrip:', safeErr);
        } catch (logErr) {
          // fallback: noop
        }
      }
    } else {
      // si no hay handler definido, al menos lo dejamos registrado en consola
      console.warn('[ConductorRender] handleAcceptTrip no está definido, solo se emitió la propuesta por socket');
    }
  };

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
                    onAccept={handleAcceptTripWrapped} // <-- aquí se envía la propuesta por socket antes de llamar al handler original
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

{/* MAPA (estilos inline para conductor — evita cortar y permite scroll normal) */}
<div
  className="taxis-map"
  style={{
    width: '100%',
    height: '60vh',    // ajusta a 50vh / 70vh o a '450px' según prefieras
    minHeight: 320,    // evita ser demasiado pequeño
    maxHeight: '95vh',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'visible'
  }}
>
  <div
    id="map"
    style={{
      width: '100%',
      height: '100%',
      display: 'block'
    }}
  />
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
