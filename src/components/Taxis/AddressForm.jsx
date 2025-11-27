// src/components/Taxis/AddressForm.jsx
import React from 'react';

const AddressForm = ({
  fromAddress,
  toAddress,
  setFromAddress,
  setToAddress,
  fromCoordinates,
  toCoordinates,
  setFromCoordinates,
  setToCoordinates,
  onBuscar,
  onSwap,
  onCenter,
  loading,
}) => {
  // estilos inline mínimos para garantizar visibilidad
  const row = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' };
  const inputStyle = { flex: 1, padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', minWidth: 160 };
  const buttonPrimary = { padding: '10px 14px', borderRadius: 6, border: 'none', background: '#ff4081', color: '#fff', cursor: 'pointer' };
  const smallBtn = { padding: '8px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' };

  return (
    <div style={{ padding: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={row}>
        <input
          id="from-input"
          type="text"
          placeholder="Origen (tu ubicación por defecto)"
          value={fromAddress}
          onChange={(e) => setFromAddress(e.target.value)}
          style={inputStyle}
        />

        <button onClick={onSwap} title="Intercambiar origen/destino" style={smallBtn} aria-label="Intercambiar">
          ⇅
        </button>

        <input
          id="to-input"
          type="text"
          placeholder="Destino"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      <div style={{ height: 8 }} />

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBuscar} disabled={loading} style={buttonPrimary}>
          {loading ? 'Buscando...' : 'Buscar Taxistas'}
        </button>

        <button onClick={onCenter} style={smallBtn} title="Centrar en origen">📍 Centrar</button>
      </div>
    </div>
  );
};

export default AddressForm;
