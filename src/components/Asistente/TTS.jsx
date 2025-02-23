import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
// Importando las imágenes directamente
import cerrada from "../../assets/sara/cerrada.png";
import casicerrada from "../../assets/sara/casicerrada.png";
import semiabierta from "../../assets/sara/semiabierta.png";
import media from "../../assets/sara/media.png";
import abierta from "../../assets/sara/abierta.png";
import ojosAbiertos from "../../assets/sara/ojos_abiertos.png";
import ojosCerrados from "../../assets/sara/ojos_cerrados.png";

// Crear socket para la conexión
const socket = io("http://localhost:3003", {
  transports: ["websocket"],
  reconnection: true,
});

const TTS = () => {
  const [imageSrc, setImageSrc] = useState(ojosAbiertos);  // Estado para el src de la imagen
  const [isSpeaking, setIsSpeaking] = useState(false);  // Estado de si está hablando o no
  const blinkIntervalRef = useRef(null);  // Referencia para el intervalo de parpadeo

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
    console.log("🌟 Start blinking");
    if (!blinkIntervalRef.current) {
      blinkIntervalRef.current = setInterval(() => {
        console.log("💬 Blink interval triggered");
        setImageSrc(ojosCerrados);  // Cambiar a ojos cerrados
        console.log("👀 Ojos cerrados - src:", ojosCerrados);  // Ver el src de la imagen
        setTimeout(() => {
          setImageSrc(ojosAbiertos);  // Cambiar a ojos abiertos después de 0.3s
          console.log("👀 Ojos abiertos - src:", ojosAbiertos);  // Ver el src de la imagen
        }, 300); // Ojos cerrados por 0.3s
      }, 2500); // Parpadeo cada 2.5 segundos
    }
  };

  const stopBlinking = () => {
    console.log("❌ Stop blinking");
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
      setImageSrc(ojosAbiertos); // Mantener ojos abiertos cuando deja de parpadear
      console.log("👀 Ojos abiertos al detener parpadeo - src:", ojosAbiertos);
    }
  };

  const getMouthPosition = (syllable) => {
    console.log("🔤 Getting mouth position for syllable:", syllable);
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
          console.log("💋 Animating mouth, syllable:", syllable);
          setImageSrc(getMouthPosition(syllable));  // Cambiar la imagen de la boca
          console.log("🖼️ Mouth image changed to:", getMouthPosition(syllable));  // Ver el src de la imagen
          index++;
          setTimeout(animateMouth, 180); // Animate every 180ms
        }
      };
      animateMouth();
    };

    utterance.onend = () => {
      console.log("🔇 Speech synthesis ended");
      setIsSpeaking(false);
      setImageSrc(cerrada);  // Cambiar a boca cerrada
      console.log("🖼️ Mouth image changed to cerrada");
      startBlinking(); // Reiniciar parpadeo cuando termine de hablar
    };

    window.speechSynthesis.speak(utterance);
    console.log("✅ Speech synthesis invoked, utterance:", utterance);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <img
        src={imageSrc}  // Usar el estado para el src de la imagen
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
