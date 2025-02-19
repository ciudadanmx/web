import React, { useState } from "react";
import asistenteMin from "../../assets/asistente_min.gif";
import asistente from "../../assets/asistente.png";
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
          <img
            src={asistente}
            alt="Asistente"
            className="asistente-img"
            style={{ width: "120px" }}
          />
        </div>
      )}
    </div>
  );
};

export default Asistente;
