import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import cerrada from "../../assets/sara/cerrada.png";
import casicerrada from "../../assets/sara/casicerrada.png";
import semiabierta from "../../assets/sara/semiabierta.png";
import media from "../../assets/sara/media.png";
import abierta from "../../assets/sara/abierta.png";

const socket = io("http://localhost:3003", {
  transports: ["websocket"],
  reconnection: true,
});

const TTS = () => {
  const imgRef = useRef(null);

  useEffect(() => {
    console.log("🟢 TTS Component Mounted");
    console.log("🔄 Conectando a WebSocket...");

    socket.on("connect", () => {
      console.log("✅ Conectado con ID:", socket.id);
    });

    socket.off("speakTTS").on("speakTTS", (data) => {
      console.log("📥 Received speakTTS event:", data);
      if (!data) {
        console.warn("⚠️ Mensaje vacío");
        return;
      }
      speakMessage(data);
    });

    socket.on("disconnect", () => {
      console.warn("🔴 Disconnected from socket");
    });

    return () => {
      console.log("🛑 Cleaning up socket listeners");
      socket.off("speakTTS");
    };
  }, []);

  const getMouthPosition = (syllable) => {
    const abiertas = /[aeo]/;
    const medias = /[iu]/;
    const semiabiertas = /[mn]/;
    const casicerradas = /[srd]/;
    const cerradas = /[pbtk]/;

    if (abiertas.test(syllable)) return abierta;
    if (medias.test(syllable)) return media;
    if (semiabiertas.test(syllable)) return semiabierta;
    if (casicerradas.test(syllable)) return casicerrada;
    return cerrada;
  };

  const speakMessage = (text) => {
    console.log("🗣️ Starting speech synthesis with:", text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;

    const syllables = text.match(/.{1,2}/g) || [];

    utterance.onstart = () => {
      console.log("🔊 Speech synthesis started");
      let index = 0;

      const animateMouth = () => {
        if (index < syllables.length) {
          const syllable = syllables[index].toLowerCase();
          if (imgRef.current) {
            const mouthState = getMouthPosition(syllable);
            console.log(`🔄 Cambiando a ${mouthState}`);
            imgRef.current.src = mouthState;
          }
          index++;
          setTimeout(animateMouth, 180); // Ajustar tiempo para mejor sincronización
        }
      };

      animateMouth();
    };

    utterance.onend = () => {
      console.log("🔇 Speech synthesis ended");
      if (imgRef.current) {
        imgRef.current.src = cerrada;
      }
    };

    window.speechSynthesis.speak(utterance);
    console.log("✅ Speech synthesis invoked, utterance:", utterance);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <img
        ref={imgRef}
        src={cerrada}
        alt="Asistente"
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
