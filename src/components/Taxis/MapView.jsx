// src/components/Taxis/MapView.jsx
import React, { useEffect } from 'react';

const MapView = ({ mapRef, googleMapsLoaded, fromMarkerRef, toMarkerRef }) => {
  useEffect(() => {
    // debug sencillo
    // eslint-disable-next-line no-console
    console.log('[MapView] googleLoaded=', googleMapsLoaded, 'mapRef.current=', mapRef && mapRef.current);
  }, [googleMapsLoaded, mapRef]);

  return (
    <div style={{ width: '100%', height: '60vh', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapView;
