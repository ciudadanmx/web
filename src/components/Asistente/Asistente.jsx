import React, { useState } from "react";
import asistenteMin from "../../assets/asistente_min.gif";
import TTS from "./TTS";
import "../../styles/Asistente.css";

const Asistente = () => {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="asistente-container">
      {/* Botón flotante (minimizado) */}
      {!abierto && (
        <img
          src={asistenteMin}
          alt="Abrir Asistente"
          className="asistente-min"
          onClick={() => setAbierto(true)}
          style={{ position: "fixed", bottom: "20px", right: "20px", width: "80px", cursor: "pointer" }}
        />
      )}

      {/* Asistente expandido */}
      {abierto && (
        <div className="asistente-popup" style={{ position: "fixed", bottom: "20px", right: "20px", background: "white", padding: "10px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
          <button className="asistente-cerrar" onClick={() => setAbierto(false)} style={{ position: "absolute", top: "5px", right: "5px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer" }}>✖</button>
          
          {/* El componente TTS ahora maneja la animación de la boca */}
          <TTS />
        </div>
      )}
    </div>
  );
};

export default Asistente;
