import React, { useEffect, useState } from 'react';

/**
 * TravelCard: componente por viaje.
 * Usa hooks solo aquí (top-level) — seguro cuando se renderiza N tarjetas.
 */
const TravelCard = ({ travel, index, onClick, onClose, onAccept }) => {
  const [accepted, setAccepted] = useState(Boolean(travel.accepted));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ejemplo: si travel.startTime existe, ponemos timer
  useEffect(() => {
    if (!travel?.startTime) {
      setElapsedSeconds(0);
      return;
    }
    const start = new Date(travel.startTime);
    const interval = setInterval(() => {
      const now = new Date();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [travel?.startTime]);

  useEffect(() => {
    setAccepted(Boolean(travel.accepted));
  }, [travel.accepted]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="travel-card" style={{border: '1px solid #ddd', padding: 12, marginBottom: 8}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <strong>{travel.originAdress || 'Origen desconocido'}</strong>
          <div style={{fontSize: 12, color: '#666'}}>{travel.destinationAdress || 'Destino desconocido'}</div>
          <div style={{fontSize: 12, color: '#999'}}>ID: {travel.id || travel.travelId}</div>
        </div>
        <div>
          <button onClick={() => onClick(index)} style={{marginRight:8}}>Ver</button>
          <button onClick={() => { onAccept(index); setAccepted(true); }} disabled={accepted}>
            {accepted ? 'Aceptado' : 'Aceptar'}
          </button>
          <button onClick={() => onClose(index)} style={{marginLeft:8}}>X</button>
        </div>
      </div>

      {travel.startTime && (
        <div style={{marginTop:8, fontSize:12, color:'#333'}}>
          En curso: {minutes}:{seconds < 10 ? '0' : ''}{seconds}
        </div>
      )}
    </div>
  );
};

export default TravelCard;
