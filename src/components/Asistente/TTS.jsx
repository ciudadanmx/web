import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import bocaCerrada from "../../assets/sara/cerrada.png";
import bocaMedia from "../../assets/sara/media.png";
import bocaAbierta from "../../assets/sara/abierta.png";
import bocaCasiCerrada from "../../assets/sara/casicerrada.png";
import bocaSemiAbierta from "../../assets/sara/semiabierta.png";
import ojosCerrados from "../../assets/sara/ojos_cerrados.png";
import ojosAbiertos from "../../assets/sara/ojos_abiertos.png";

const socket = io("http://localhost:3003", {
  transports: ["websocket"],
  reconnection: true,
});

const TTS = () => {
  const [message, setMessage] = useState("");
  const [boca, setBoca] = useState(bocaCerrada);
  const [idleImage, setIdleImage] = useState(ojosAbiertos);

  useEffect(() => {
    console.log("🟢 TTS Component Mounted");
    console.log("🔄 Conectando a WebSocket...");

    socket.on("connect", () => {
      console.log("✅ Conectado con ID:", socket.id);
    });

    socket.off("speakTTS").on("speakTTS", (data) => {
      console.log("📥 Evento 'speakTTS' recibido:", data);

      if (!data) {
        console.warn("⚠️ Mensaje vacío");
        return;
      }

      setMessage(data);
      speakMessage(data);
    });

    socket.on("disconnect", () => {
      console.warn("🔴 Desconectado de WebSocket");
    });

    const blinkInterval = setInterval(() => {
      setIdleImage((prev) => (prev === ojosAbiertos ? ojosCerrados : ojosAbiertos));
    }, 1500);

    return () => {
      console.log("🛑 Eliminando listeners de socket...");
      socket.off("speakTTS");
      clearInterval(blinkInterval);
    };
  }, []);

  const speakMessage = (text) => {
    if (!text) return;

    console.log("🗣️ Ejecutando SpeechSynthesis con:", text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const rand = Math.random();
        if (rand < 0.2) setBoca(bocaCasiCerrada);
        else if (rand < 0.4) setBoca(bocaMedia);
        else if (rand < 0.6) setBoca(bocaSemiAbierta);
        else if (rand < 0.8) setBoca(bocaAbierta);
        else setBoca(bocaCerrada);
      }
    };

    utterance.onend = () => {
      setBoca(bocaCerrada);
    };

    window.speechSynthesis.speak(utterance);
    console.log("🔊 SpeechSynthesis ejecutado:", text);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <img
        src={message ? boca : idleImage}
        alt="Asistente virtual"
        style={{
          width: "24vw",
          height: "auto",
          maxWidth: "330px",
        }}
      />
    </div>
  );
};

export default TTS;
