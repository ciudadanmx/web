// src/components/Taxis/TravelCard.jsx
import React, { useEffect, useMemo, useState } from 'react';

const currencyFmt = (v) => {
  if (v === null || v === undefined || isNaN(Number(v))) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v));
};

const TravelCard = ({ travel = {}, index, onClick, onClose, onAccept }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [sending, setSending] = useState(false);

  // Obtener timestamp start
  const startTs = useMemo(() => {
    const cand = [travel.requestTime, travel.requestedAt, travel.createdAt, travel.startTime, travel.created_at];
    for (const c of cand) {
      if (!c) continue;
      const t = new Date(c);
      if (!isNaN(t.getTime())) return t;
    }
    return null;
  }, [travel]);

  useEffect(() => {
    if (!startTs) { setElapsedSeconds(null); return; }
    const tick = () => {
      const now = new Date();
      const diff = Math.floor((now - startTs) / 1000);
      setElapsedSeconds(diff >= 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTs]);

  // Inicializar input con suggestedPrice si viene
  useEffect(() => {
    if (travel && (travel.suggestedPrice || (travel.meta && travel.meta.suggested && travel.meta.suggested.price))) {
      const p = travel.suggestedPrice ?? travel.meta?.suggested?.price;
      setFinalPrice(Number(p));
    } else {
      setFinalPrice(null);
    }
  }, [travel]);

  const formatMMSS = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const origin = travel.originAdress || travel.originAddress || travel.origin || 'Origen desconocido';
  const destination = travel.destinationAdress || travel.destinationAddress || travel.destination || 'Destino desconocido';

  const suggestedPrice = travel.suggestedPrice ?? travel.meta?.suggested?.price ?? null;
  const suggestedFormatted = travel.suggestedPriceFormatted ?? travel.meta?.suggested?.priceFormatted ?? (suggestedPrice ? currencyFmt(suggestedPrice) : null);

  const handleSendProposal = async () => {
    if (sending) return;
    const priceToSend = finalPrice ?? suggestedPrice;
    if (!priceToSend) {
      alert('Por favor ingresa un precio final antes de enviar la propuesta.');
      return;
    }
    try {
      setSending(true);
      if (typeof onAccept === 'function') {
        // onAccept(index, finalPrice) — espera que el handler gestione socket/http
        await onAccept(index, Number(priceToSend));
      }
    } catch (e) {
      console.warn('Error enviando propuesta:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      border: '1px solid #e6e6e6',
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
      background: '#fff'
    }}>
      <div style={{display: 'flex', gap: 12, alignItems: 'flex-start'}}>
        <div style={{flex: 1}}>
          <div style={{fontSize: 12, color: '#666'}}><strong>Origen</strong></div>
          <div style={{fontSize: 15, marginBottom: 8}}>{origin}</div>

          <div style={{fontSize: 12, color: '#666'}}><strong>Destino</strong></div>
          <div style={{fontSize: 15}}>{destination}</div>

          <div style={{fontSize: 12, color: '#999', marginTop: 10}}>
            ID: {travel.id || travel.travelId || '—'}
            {travel.roundedDistanceMeters ? ` • ${travel.roundedDistanceMeters} m` : ''}
            {travel.distanceMeters ? ` • ${(travel.distanceMeters/1000).toFixed(2)} km` : ''}
          </div>
        </div>

        <div style={{width: 220, display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={{fontSize: 12, color: '#333'}}>Tiempo: <strong>{formatMMSS(elapsedSeconds)}</strong></div>

          <div style={{display:'flex', flexDirection:'column', gap:6, background:'#fafafa', padding:8, borderRadius:8}}>
            <div style={{fontSize:12, color:'#666'}}>Precio sugerido</div>
            <div style={{fontSize:18, fontWeight:700, color:'#111'}}>{suggestedFormatted ?? '—'}</div>

            <label style={{fontSize:12, color:'#666', marginTop:4}}>Precio final (MXN)</label>
            <input
              type="number"
              value={finalPrice ?? ''}
              onChange={(e) => setFinalPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder={suggestedPrice ? suggestedPrice.toString() : 'Ingresa precio final'}
              style={{padding:'8px 10px', borderRadius:8, border:'1px solid #ddd', width:'100%'}}
            />
          </div>

          <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
            <button
              onClick={() => typeof onClick === 'function' && onClick(index)}
              style={{flex:1, padding:'10px 12px', borderRadius:8, border:'1px solid #ddd', background:'#fff', cursor:'pointer'}}
            >
              Ver
            </button>

            <button
              onClick={handleSendProposal}
              disabled={sending}
              style={{
                flex:1.4,
                padding:'10px 12px',
                borderRadius:8,
                border:'none',
                background: sending ? '#e0c200' : '#ffbf00',
                color:'#111',
                fontWeight:700,
                cursor: sending ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 12px rgba(255,191,0,0.18)'
              }}
            >
              {sending ? 'Enviando…' : 'Enviar propuesta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelCard;
