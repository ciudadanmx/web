import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import bocaCerrada from "../../assets/sara/cerrada.png";
import bocaMedia from "../../assets/sara/media.png";
import bocaAbierta from "../../assets/sara/abierta.png";

const socket = io("http://localhost:3003", {
  transports: ["websocket"],
  reconnection: true,
});

const TTS = () => {
  const [message, setMessage] = useState("");
  const [boca, setBoca] = useState(bocaCerrada);

  useEffect(() => {
    console.log("🟢 TTS Component Mounted");
    console.log("🔄 Conectando a WebSocket...");

    socket.on("connect", () => {
      console.log("✅ Conectado con ID:", socket.id);
    });

    // REGISTRAR EVENTO 'speakTTS'
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

    return () => {
      console.log("🛑 Eliminando listeners de socket...");
      socket.off("speakTTS");
    };
  }, []);

  const speakMessage = (text) => {
    if (!text) return;

    console.log("🗣️ Ejecutando SpeechSynthesis con:", text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;

    // 📌 SINCRONIZAR BOCAS SEGÚN EL AUDIO
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const rand = Math.random();
        if (rand < 0.33) setBoca(bocaMedia);
        else if (rand < 0.66) setBoca(bocaAbierta);
        else setBoca(bocaCerrada);
      }
    };

    utterance.onend = () => {
      setBoca(bocaCerrada); // Cerrar boca cuando termine de hablar
    };

    window.speechSynthesis.speak(utterance);
    console.log("🔊 SpeechSynthesis ejecutado:", text);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <img src={boca} alt="Boca del asistente" style={{ width: "120px" }} />
    </div>
  );
};

export default TTS;
