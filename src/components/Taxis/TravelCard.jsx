import React, { useEffect, useState } from 'react';

/**
 * TravelCard: componente por viaje.
 * Muestra origen/destino y tiempo transcurrido desde requestTime (fallback: createdAt/requestedAt).
 */
const TravelCard = ({ travel = {}, index, onClick, onClose, onAccept }) => {
  const [accepted, setAccepted] = useState(Boolean(travel.accepted));
  const [elapsedSeconds, setElapsedSeconds] = useState(null);

  // Determina la marca de tiempo a usar (prioriza requestTime)
  const getStartTimestamp = () => {
    const candidates = [
      travel.requestTime,
      travel.requestedAt,
      travel.createdAt,
      travel.startTime, // por si el payload usa este nombre
      travel.created_at,
    ];
    for (const c of candidates) {
      if (!c) continue;
      const t = new Date(c);
      if (!isNaN(t.getTime())) return t;
    }
    return null;
  };

  // Inicia el timer cuando haya una timestamp válida
  useEffect(() => {
    const start = getStartTimestamp();
    if (!start) {
      setElapsedSeconds(null);
      return;
    }
    // calcular inmediatamente y luego cada segundo
    const tick = () => {
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      setElapsedSeconds(diff >= 0 ? diff : 0);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel.requestTime, travel.requestedAt, travel.createdAt, travel.startTime, travel.created_at, travel.id]);

  // Sincronizar accepted con cambios externos
  useEffect(() => {
    setAccepted(Boolean(travel.accepted));
  }, [travel.accepted]);

  // formato minutos:segundos con padding
  const formatMMSS = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const origin = travel.originAdress || travel.originAddress || travel.origin || 'Origen desconocido';
  const destination = travel.destinationAdress || travel.destinationAddress || travel.destination || 'Destino desconocido';

  return (
    <div className="travel-card" style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: '#888' }}><strong>Origen</strong></div>
            <div style={{ fontSize: 14 }}>{origin}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#888' }}><strong>Destino</strong></div>
            <div style={{ fontSize: 14 }}>{destination}</div>
          </div>

          <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
            ID: {travel.id || travel.travelId || '—'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#333' }}>
            Tiempo: <strong>{formatMMSS(elapsedSeconds)}</strong>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => typeof onClick === 'function' && onClick(index)}
              style={{ padding: '6px 10px', cursor: 'pointer' }}
            >
              Ver
            </button>

            <button
              onClick={() => {
                if (typeof onAccept === 'function') onAccept(index);
                setAccepted(true);
              }}
              disabled={accepted}
              style={{ padding: '6px 10px', cursor: accepted ? 'not-allowed' : 'pointer' }}
            >
              {accepted ? 'Aceptado' : 'Aceptar'}
            </button>

            <button
              onClick={() => typeof onClose === 'function' && onClose(index)}
              style={{ padding: '6px 8px', cursor: 'pointer' }}
            >
              ✖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelCard;
