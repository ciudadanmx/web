import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import cerrada from "../../assets/sara/cerrada.png";
import casicerrada from "../../assets/sara/casicerrada.png";
import semiabierta from "../../assets/sara/semiabierta.png";
import media from "../../assets/sara/media.png";
import abierta from "../../assets/sara/abierta.png";
import ojosAbiertos from "../../assets/sara/ojos_abiertos.png";
import ojosCerrados from "../../assets/sara/ojos_cerrados.png";

const socket = io("http://localhost:3003", {
  transports: ["websocket"],
  reconnection: true,
});

const TTS = () => {
  const imgRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const blinkIntervalRef = useRef(null);

  useEffect(() => {
    console.log("🟢 TTS Component Mounted");
    console.log("🔄 Conectando a WebSocket...");

    startBlinking(); // Iniciar parpadeo al cargar

    socket.on("connect", () => {
      console.log("✅ Conectado con ID:", socket.id);
    });

    socket.off("speakTTS").on("speakTTS", (data) => {
      console.log("📥 Received speakTTS event:", data);
      if (!data) {
        console.warn("⚠️ Mensaje vacío");
        return;
      }
      stopBlinking(); // Detener parpadeo al iniciar el habla
      speakMessage(data);
    });

    socket.on("disconnect", () => {
      console.warn("🔴 Disconnected from socket");
    });

    return () => {
      console.log("🛑 Cleaning up socket listeners");
      socket.off("speakTTS");
      stopBlinking(); // Asegurar que no quede parpadeo activo
    };
  }, []);

  const startBlinking = () => {
    if (!blinkIntervalRef.current) {
      blinkIntervalRef.current = setInterval(() => {
        if (imgRef.current) {
          imgRef.current.src =
            imgRef.current.src.includes("ojos_abiertos") ? ojosCerrados : ojosAbiertos;
        }
      }, 2500); // Parpadeo cada 2.5 segundos
    }
  };

  const stopBlinking = () => {
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
      if (imgRef.current) imgRef.current.src = ojosAbiertos; // Mantener ojos abiertos cuando deja de parpadear
    }
  };

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

    setIsSpeaking(true); // Indicar que está hablando

    const syllables = text.match(/.{1,2}/g) || [];
    let index = 0;

    utterance.onstart = () => {
      console.log("🔊 Speech synthesis started");
      const animateMouth = () => {
        if (index < syllables.length) {
          const syllable = syllables[index].toLowerCase();
          if (imgRef.current) {
            imgRef.current.src = getMouthPosition(syllable);
          }
          index++;
          setTimeout(animateMouth, 180);
        }
      };
      animateMouth();
    };

    utterance.onend = () => {
      console.log("🔇 Speech synthesis ended");
      setIsSpeaking(false);
      if (imgRef.current) imgRef.current.src = cerrada;
      startBlinking(); // Reiniciar parpadeo cuando termine de hablar
    };

    window.speechSynthesis.speak(utterance);
    console.log("✅ Speech synthesis invoked, utterance:", utterance);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <img
        ref={imgRef}
        src={ojosAbiertos} // Inicia con ojos abiertos
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
