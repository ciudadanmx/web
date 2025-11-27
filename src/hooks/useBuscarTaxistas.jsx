// src/hooks/useBuscarTaxistas.js
import { useState, useCallback } from 'react';
import { addTaxiMarker } from '../utils/mapUtils';
import taxiIcon from '../assets/taxi_marker.png';

/**
 * useBuscarTaxistas
 *
 * Params:
 * - socketRef (ref) -> referencia al socket (opcional)
 * - mapRef (ref) -> referencia al google map (opcional, usado para pintar markers)
 * - user (obj) -> objeto user de auth0 (opcional)
 * - options: { backendEnvNames: { backendUrl, strapiUrl, socketUrl } }
 *
 * Returns:
 * { buscarTaxistas(payloadOverrides), loading, error }
 *
 * buscarTaxistas no recibe todos los campos: construye payload con datos que le pases
 * y con user.email si está disponible.
 */
export default function useBuscarTaxistas({
  socketRef = null,
  mapRef = null,
  user = null,
  options = {}
} = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const safeStringify = (obj, max = 2000) => {
    try {
      const s = JSON.stringify(obj, null, 2);
      return s.length > max ? s.slice(0, max) + '... (truncated)' : s;
    } catch (e) {
      return String(obj);
    }
  };

  const socketUrlToHttp = (url = '') => {
    if (!url) return null;
    try {
      return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
    } catch (e) {
      return null;
    }
  };

  const buscarTaxistas = useCallback(
    async ({
      fromCoordinates = null,
      toCoordinates = null,
      fromAddress = null,
      toAddress = null,
      broadcast = true,
      extra = {}
    } = {}) => {
      setError(null);
      setLoading(true);

      const userEmail = user?.email ?? null;
      console.log('[useBuscarTaxistas] inicio - user.email=', userEmail);

      const payload = {
        userEmail,
        originCoordinates: fromCoordinates || null,
        destinationCoordinates: toCoordinates || null,
        originAddress: fromAddress || null,
        destinationAddress: toAddress || null,
        timestamp: new Date().toISOString(),
        ...extra
      };

      console.log('[useBuscarTaxistas] payload construido:', safeStringify(payload, 4000));

      try {
        // 1) Intentar emitir por socket si existe
        if (socketRef && socketRef.current) {
          try {
            console.log('[useBuscarTaxistas] socketRef presente. connected=', !!socketRef.current.connected);
            if (socketRef.current.connected) {
              console.log('[useBuscarTaxistas] Emitiendo evento "buscar-taxistas" por websocket con payload:', safeStringify(payload, 2000));
              let ackCalled = false;
              try {
                socketRef.current.emit('buscar-taxistas', payload, (ack) => {
                  ackCalled = true;
                  console.log('[useBuscarTaxistas][Socket ACK] ack recibido:', safeStringify(ack, 3000));
                  // si ack trae conductores, pintarlos
                  try {
                    if (ack && Array.isArray(ack.foundDrivers)) {
                      console.log('[useBuscarTaxistas] pintando drivers desde ACK:', ack.foundDrivers.length);
                      ack.foundDrivers.forEach((d) => {
                        if (d.coordinates && mapRef && mapRef.current) addTaxiMarker(mapRef, d.coordinates, taxiIcon);
                      });
                    }
                  } catch (e) {
                    console.warn('[useBuscarTaxistas] error pintando drivers desde ack', e);
                  }
                });

                setTimeout(() => {
                  if (!ackCalled) {
                    console.warn('[useBuscarTaxistas] no se recibió ACK del socket en 3000ms (continuando fallback HTTP)');
                  }
                }, 3000);
              } catch (e) {
                console.warn('[useBuscarTaxistas] error emitiendo por socket:', e);
              }
            } else {
              console.warn('[useBuscarTaxistas] socketRef existe pero no está conectado');
            }
          } catch (e) {
            console.warn('[useBuscarTaxistas] error leyendo socketRef:', e);
          }
        } else {
          console.log('[useBuscarTaxistas] no hay socketRef disponible para emitir');
        }

        // 2) Intentar POST a /test/send-trip en backend (preferir REACT_APP_BACKEND_URL)
        const envBackendCandidates = {
          backendUrl: options?.backendUrl || process.env.REACT_APP_BACKEND_URL || null,
          apiUrl: options?.apiUrl || process.env.REACT_APP_API_URL || null,
          strapiUrl: options?.strapiUrl || process.env.REACT_APP_STRAPI_URL || null,
          socketUrl: options?.socketUrl || process.env.REACT_APP_SOCKET_URL || null
        };

        console.log('[useBuscarTaxistas] envBackendCandidates:', safeStringify(envBackendCandidates, 1000));

        const derivedBackend =
          envBackendCandidates.backendUrl ||
          envBackendCandidates.apiUrl ||
          envBackendCandidates.strapiUrl ||
          socketUrlToHttp(envBackendCandidates.socketUrl) ||
          null;

        console.log('[useBuscarTaxistas] derivedBackend resolved to:', derivedBackend);

        if (derivedBackend) {
          const url = `${derivedBackend.replace(/\/$/, '')}/test/send-trip`;
          console.log('[useBuscarTaxistas] intentando POST a', url);

          try {
            const postBody = {
              userEmail: payload.userEmail,
              originCoordinates: payload.originCoordinates,
              destinationCoordinates: payload.destinationCoordinates,
              originAdress: payload.originAddress,
              destinationAdress: payload.destinationAddress,
              broadcast
            };
            console.log('[useBuscarTaxistas] POST body:', safeStringify(postBody, 2000));

            const resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(postBody),
            });

            console.log('[useBuscarTaxistas] POST status:', resp.status);
            const text = await resp.text().catch(() => null);
            console.log('[useBuscarTaxistas] POST text preview:', (text && text.slice) ? text.slice(0, 2000) : text);

            if (resp.ok) {
              let json = null;
              try { json = JSON.parse(text); } catch (e) { json = text; }
              console.log('[useBuscarTaxistas] POST parsed response:', safeStringify(json, 2000));

              // si la API devolvió drivers en meta, pintarlos
              try {
                if (json && json.payload && json.payload.meta && Array.isArray(json.payload.meta.foundDrivers)) {
                  const drivers = json.payload.meta.foundDrivers;
                  console.log('[useBuscarTaxistas] drivers desde POST meta.foundDrivers:', drivers.length);
                  drivers.forEach((d) => { if (d.coordinates && mapRef && mapRef.current) addTaxiMarker(mapRef, d.coordinates, taxiIcon); });
                }
              } catch (e) {
                console.warn('[useBuscarTaxistas] error procesando drivers desde POST', e);
              }

              return { ok: true, source: 'post', body: json };
            } else {
              console.warn('[useBuscarTaxistas] POST /test/send-trip devolvió status no OK:', resp.status);
            }
          } catch (e) {
            console.warn('[useBuscarTaxistas] error en POST /test/send-trip:', e);
          }
        } else {
          console.warn('[useBuscarTaxistas] no se resolvió derivedBackend, saltando POST /test/send-trip');
        }

        // 3) Fallback: llamar conductores-cercanos en Strapi (si están expuestos)
        const strapiBase = options?.strapiUrl || process.env.REACT_APP_STRAPI_URL || null;
        if (strapiBase) {
          const url2 = `${strapiBase.replace(/\/$/, '')}/api/conductores-cercanos`;
          console.log('[useBuscarTaxistas] intentando POST fallback a conductores-cercanos ->', url2);
          try {
            const resp2 = await fetch(url2, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                origin: payload.originCoordinates || payload.originAddress,
                destination: payload.destinationCoordinates || payload.destinationAddress,
                userEmail
              })
            });

            console.log('[useBuscarTaxistas] conductores-cercanos status=', resp2.status);
            const text2 = await resp2.text().catch(() => null);
            console.log('[useBuscarTaxistas] conductores-cercanos preview:', (text2 && text2.slice) ? text2.slice(0, 2000) : text2);

            if (resp2.ok) {
              let data = null;
              try { data = JSON.parse(text2); } catch (e) { data = text2; }
              console.log('[useBuscarTaxistas] conductores-cercanos parsed:', safeStringify(data, 2000));

              // pintar si trae array de conductores
              if (Array.isArray(data) && data.length > 0 && mapRef && mapRef.current) {
                data.forEach((driver) => { if (driver.coordinates) addTaxiMarker(mapRef, driver.coordinates, taxiIcon); });
              }

              return { ok: true, source: 'strapi', body: data };
            } else {
              console.warn('[useBuscarTaxistas] conductores-cercanos devolvió non-ok:', resp2.status);
            }
          } catch (e) {
            console.warn('[useBuscarTaxistas] error llamando conductores-cercanos:', e);
          }
        } else {
          console.warn('[useBuscarTaxistas] no hay STRAPI URL configurada para conductores-cercanos');
        }

        // Si llega hasta aquí, falló todo lo anterior:
        console.warn('[useBuscarTaxistas] no se pudieron obtener conductores por ninguno de los métodos');
        setError('No se encontraron conductores (intenta de nuevo más tarde)');
        return { ok: false, error: 'no_drivers' };

      } catch (err) {
        console.error('[useBuscarTaxistas] error general:', err);
        setError(err.message || String(err));
        return { ok: false, error: err.message || String(err) };
      } finally {
        setLoading(false);
        console.log('[useBuscarTaxistas] finalizado.');
      }
    },
    [socketRef, mapRef, user, options]
  );

  return { buscarTaxistas, loading, error };
}
