import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import LazyLoad from "react-lazyload"; // Importamos LazyLoad

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
  const [isSpeaking, setIsSpeaking] = useState(false);  // Estado de si está hablando o no
  const blinkIntervalRef = useState(null);  // Guardar el intervalo de parpadeo

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
      // Limpiar los listeners cuando el componente se desmonte
      socket.off("speakTTS");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const startBlinking = () => {
    console.log("🌟 Start blinking");
    if (!blinkIntervalRef.current) {
      blinkIntervalRef.current = setInterval(() => {
        console.log("💬 Blink interval triggered");
        const imgElement = document.getElementById("asistenteImage"); // Obtener el elemento directamente
        if (imgElement) {
          imgElement.src = ojosCerrados;  // Cambiar a ojos cerrados
          console.log("👀 Ojos cerrados - src:", ojosCerrados);  // Ver el src de la imagen
          setTimeout(() => {
            if (imgElement) {
              imgElement.src = ojosAbiertos;  // Cambiar a ojos abiertos después de 0.3s
              console.log("👀 Ojos abiertos - src:", ojosAbiertos);  // Ver el src de la imagen
            }
          }, 300); // Ojos cerrados por 0.3s
        }
      }, 2500); // Parpadeo cada 2.5 segundos
    }
  };

  const stopBlinking = () => {
    console.log("❌ Stop blinking");
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
      const imgElement = document.getElementById("asistenteImage"); // Obtener el elemento directamente
      if (imgElement) {
        imgElement.src = getMouthPosition(''); // Cambiar a la imagen de la boca cuando termine de parpadeo
        console.log("🖼️ Cambiar a imagen de la boca al detener parpadeo");
      }
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
          const imgElement = document.getElementById("asistenteImage"); // Obtener el elemento directamente
          if (imgElement) {
            imgElement.src = getMouthPosition(syllable);  // Cambiar la imagen de la boca
            console.log("🖼️ Mouth image changed to:", getMouthPosition(syllable));  // Ver el src de la imagen
          }
          index++;
          setTimeout(animateMouth, 180); // Animate every 180ms
        }
      };
      animateMouth();
    };

    utterance.onend = () => {
      console.log("🔇 Speech synthesis ended");
      setIsSpeaking(false);
      const imgElement = document.getElementById("asistenteImage"); // Obtener el elemento directamente
      if (imgElement) {
        imgElement.src = cerrada;  // Cambiar a boca cerrada
        console.log("🖼️ Mouth image changed to cerrada");
      }
      startBlinking(); // Reiniciar parpadeo cuando termine de hablar
    };

    window.speechSynthesis.speak(utterance);
    console.log("✅ Speech synthesis invoked, utterance:", utterance);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <LazyLoad height={200} offset={100}>
        <img
          id="asistenteImage"  // Ahora usando id directamente
          src={ojosAbiertos}  // Imagen inicial de los ojos (abiertos)
          alt="Asistente"
          style={{
            width: "48vw",
            height: "auto",
            maxWidth: "480px",
          }}
        />
      </LazyLoad>
    </div>
  );
};

export default TTS;
