// src/components/Trips/ViajeConductor.jsx
import React, { useEffect, useState, useRef } from 'react';

const ViajeConductor = ({
  viaje,
  socket,
  strapiConfig,
  fromCoordinates,
  toCoordinates,
  pickupCoordinates,
  setFromCoordinates,
  setPickupCoordinates,
  setToCoordinates,
  mapRef,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState(viaje?.attributes?.status || 'pending');
  const gpsWatchRef = useRef(null);

  useEffect(() => setStatus(viaje?.attributes?.status || status), [viaje]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setFromCoordinates(coords);
      },
      (err) => console.warn('geolocation err', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
    );
    return () => {
      if (gpsWatchRef.current && navigator.geolocation) navigator.geolocation.clearWatch(gpsWatchRef.current);
    };
  }, [setFromCoordinates]);

  const iniciarViaje = async () => {
    setStatus('in_progress');
    try { socket?.emit('trip-action', { viajeId: viaje?.id, action: 'start', ts: new Date().toISOString() }); } catch (e) {}
    if (strapiConfig?.baseUrl && viaje?.id) {
      try {
        await fetch(`${strapiConfig.baseUrl.replace(/\/$/, '')}/api/viajes/${viaje.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(strapiConfig.token ? { Authorization: `Bearer ${strapiConfig.token}` } : {}) },
          body: JSON.stringify({ data: { status: 'in_progress' } }),
        });
      } catch (e) { console.warn('no pudo actualizar viaje', e); }
    }
  };

  const terminarViaje = async () => {
    setStatus('finished');
    try { socket?.emit('trip-action', { viajeId: viaje?.id, action: 'finish', ts: new Date().toISOString() }); } catch (e) {}
    if (strapiConfig?.baseUrl && viaje?.id) {
      try {
        await fetch(`${strapiConfig.baseUrl.replace(/\/$/, '')}/api/viajes/${viaje.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(strapiConfig.token ? { Authorization: `Bearer ${strapiConfig.token}` } : {}) },
          body: JSON.stringify({ data: { status: 'finished' } }),
        });
      } catch (e) { console.warn('no pudo actualizar viaje', e); }
    }
  };

  const routeInfo = viaje?.attributes?._routeInfo || null;
  const formatDistance = (m) => (m ? `${(m/1000).toFixed(2)} km` : '—');
  const formatDuration = (s) => (s ? `${Math.ceil(s/60)} min` : '—');

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
          <strong>Viaje #{viaje?.id || '—'}</strong>
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
              <div><strong>Origen (tu taxi)</strong></div>
              <div style={{ fontSize: 13 }}>{fromCoordinates ? `${fromCoordinates.lat.toFixed(6)}, ${fromCoordinates.lng.toFixed(6)}` : 'Sin ubicación'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div><strong>Pickup</strong></div>
              <div style={{ fontSize: 13 }}>{pickupCoordinates ? `${pickupCoordinates.lat.toFixed(6)}, ${pickupCoordinates.lng.toFixed(6)}` : 'Sin pickup'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div><strong>Destino</strong></div>
              <div style={{ fontSize: 13 }}>{toCoordinates ? `${toCoordinates.lat.toFixed(6)}, ${toCoordinates.lng.toFixed(6)}` : 'Sin destino'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {status !== 'in_progress' && <button onClick={iniciarViaje} style={{ flex: 1, padding: 12, borderRadius: 8, background: '#fff200', border: 'none', fontWeight: '700' }}>Iniciar viaje</button>}
            <button onClick={() => { if (mapRef?.current && fromCoordinates) { mapRef.current.setCenter(fromCoordinates); mapRef.current.setZoom(16); } }} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd', background: '#fff', flex: 1 }}>Centrar en mi</button>
            <button onClick={terminarViaje} style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd', background: '#fff', flex: 1 }}>Terminar viaje</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViajeConductor;
