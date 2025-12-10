// src/components/Trips/ViajeUsuario.jsx
import React, { useEffect, useState } from 'react';

const ViajeUsuario = ({ viaje, socket, userCoords, setUserCoords, mapRef, setConsultedTravel }) => {
  const [expanded, setExpanded] = useState(true);
  const status = viaje?.attributes?.status || 'esperando';
  const routeInfo = viaje?.attributes?._routeInfo || null;

  const formatDistance = (m) => (m ? `${(m/1000).toFixed(2)} km` : '—');
  const formatDuration = (s) => (s ? `${Math.ceil(s/60)} min` : '—');

  useEffect(() => {
    if (!socket || !viaje?.id) return;
    const channel = `trip:${viaje.id}`;

    const onDriverLocation = (payload) => {
      if (!payload?.coords) return;
      setUserCoords(payload.coords);
    };
    const onTripUpdate = (p) => {
      if (!p) return;
      // podrías actualizar viaje local si hace falta
    };

    try { socket.emit('join', { channel, client: { type: 'passenger' } }); } catch (e) {}
    socket.on('driver-location', onDriverLocation);
    socket.on('trip-update', onTripUpdate);

    return () => {
      try { socket.emit('leave', { channel, client: { type: 'passenger' } }); } catch (e) {}
      socket.off('driver-location', onDriverLocation);
      socket.off('trip-update', onTripUpdate);
    };
  }, [socket, viaje, setUserCoords]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      maxHeight: expanded ? '50vh' : '64px',
      height: expanded ? '50vh' : '64px',
      background: '#fff',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.12)',
      transition: 'height 280ms ease',
      zIndex: 2000,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <strong>Tu viaje</strong>
          <div style={{ fontSize: 12, color: '#666' }}>{status} • Dist: {formatDistance(routeInfo?.distance_m)} • ETA: {formatDuration(routeInfo?.duration_s)}</div>
        </div>
        <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}>▼</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div><strong>Taxi</strong></div>
              <div style={{ fontSize: 13 }}>{userCoords ? `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}` : 'No disponible aún'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div><strong>Pickup</strong></div>
              <div style={{ fontSize: 13 }}>{viaje?.attributes?.pickup ? `${viaje.attributes.pickup.lat.toFixed(6)}, ${viaje.attributes.pickup.lng.toFixed(6)}` : 'Sin pickup'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div><strong>Destino</strong></div>
              <div style={{ fontSize: 13 }}>{viaje?.attributes?.destination ? `${viaje.attributes.destination.lat.toFixed(6)}, ${viaje.attributes.destination.lng.toFixed(6)}` : 'Sin destino'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              const center = viaje?.attributes?.pickup || userCoords;
              if (mapRef?.current && center) {
                mapRef.current.setCenter(center);
                mapRef.current.setZoom(16);
              }
            }} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd', background: '#fff', flex: 1 }}>
              Centrar en pickup / taxi
            </button>

            <button onClick={() => {
              try { socket?.emit('trip-action', { viajeId: viaje.id, action: 'request-status' }); } catch (e) {}
            }} style={{ padding: 12, borderRadius: 8, background: '#fff200', border: 'none', fontWeight: '700', flex: 1 }}>
              Solicitar estado
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViajeUsuario;
