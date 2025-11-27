// BuscarTaxistasAction.jsx
import React, { useState } from 'react';

export default function BuscarTaxi({
  user,
  fromCoordinates,
  toCoordinates,
  fromAddress,
  toAddress,
  socketUrlToHttp,
  onSuccess = () => {},
  onError = () => {},
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // === FUNCIÓN PRINCIPAL (idéntica a la tuya) ===
  const ejecutar = async () => {
    setErr(null);
    setLoading(true);

    const userEmail = user?.email ?? null;

    const payload = {
      userEmail,
      originCoordinates: fromCoordinates || null,
      destinationCoordinates: toCoordinates || null,
      originAddress: fromAddress || null,
      destinationAddress: toAddress || null,
      timestamp: new Date().toISOString(),
    };

    console.log('[BuscarTaxistasAction] payload final:', payload);

    try {
      // 1) Determinar backend para POST /test/send-trip
      const backendBase =
        process.env.REACT_APP_SOCKET_URL ||
        socketUrlToHttp(process.env.REACT_APP_SOCKET_URL) ||
        null;

      if (backendBase) {
        const url = `${backendBase.replace(/\/$/, '')}/test/send-trip`;

        console.log('[BuscarTaxistasAction] POST URL:', url);

        try {
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail,
              originCoordinates: payload.originCoordinates,
              destinationCoordinates: payload.destinationCoordinates,
              originAdress: payload.originAddress,
              destinationAdress: payload.destinationAddress,
              broadcast: true,
            }),
          });

          const text = await resp.text().catch(() => null);

          console.log('[BuscarTaxistasAction] POST status:', resp.status);
          console.log('[BuscarTaxistasAction] POST raw body:', text);

          if (!resp.ok) {
            console.warn('[BuscarTaxistasAction] POST NO OK:', resp.status);
          } else {
            try {
              const parsed = JSON.parse(text);
              console.log('[BuscarTaxistasAction] POST parsed:', parsed);
              onSuccess(parsed);
            } catch {
              console.log('[BuscarTaxistasAction] POST no era JSON, text:', text);
              onSuccess(text);
            }
          }
        } catch (e) {
          console.warn('[BuscarTaxistasAction] error en POST /test/send-trip:', e);
          onError(e);
        }

      } else {
        console.warn(
          '[BuscarTaxistasAction] no se pudo determinar backendBase (env vars faltan)'
        );
      }
    } catch (err) {
      console.error('[BuscarTaxistasAction] ERROR GENERAL:', err);
      setErr(err.message || 'Error buscando taxistas');
      onError(err);
    } finally {
      setLoading(false);
      console.log('[BuscarTaxistasAction] finalizado (loading=false)');
    }
  };

  // -------- RENDER --------
  return (
    <div>
      <button
        onClick={ejecutar}
        disabled={loading}
        style={{
          padding: '10px 14px',
          background: loading ? '#bbb' : '#fff200',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {loading ? 'Buscando…' : 'Buscar taxistas'}
      </button>

      {err && (
        <div style={{ marginTop: 8, color: 'red' }}>
          Error: {err}
        </div>
      )}
    </div>
  );
}
