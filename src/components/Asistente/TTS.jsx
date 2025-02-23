import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3003', {
  transports: ['websocket'],
  reconnection: true,
});

const TTS = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('🟢 TTS Component Mounted');
    console.log('🔄 Conectando a WebSocket...');

    socket.on('connect', () => {
      console.log('✅ Conectado con ID:', socket.id);
    });

    // REGISTRAR EVENTO 'speakTTS'
    socket.off('speakTTS').on('speakTTS', (data) => {
      console.log('📥 Evento "speakTTS" recibido:', data);

      if (!data) {
        console.warn('⚠️ Mensaje vacío');
        return;
      }

      setMessage(data);
      speakMessage(data);
    });

    // Ver logs si se desconecta
    socket.on('disconnect', () => {
      console.warn('🔴 Desconectado de WebSocket');
    });

    return () => {
      console.log('🛑 Eliminando listeners de socket...');
      socket.off('speakTTS');
    };
  }, []);

  const speakMessage = (message) => {
    if (!message) return;

    console.log('🗣️ Ejecutando SpeechSynthesis con:', message);
    const utterance = new SpeechSynthesisUtterance(message);

    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
    console.log('🔊 SpeechSynthesis ejecutado:', message);
  };

  return (
   <>
   </>
  );
};

export default TTS;
