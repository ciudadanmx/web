import { useState, useRef } from 'react';

export const useLmAiChat = () => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState(true);
  const lastUpdateTimeRef = useRef(Date.now());

  // Función para insertar espacios en la fase de pensando
  const insertSpaces = (text) => {
    return text
      .replace(/([a-záéíóúüñ])([A-ZÁÉÍÓÚÜÑ])/g, '$1 $2')
      .replace(/([a-zA-ZÁÉÍÓÚÜÑ])([水-龯])/g, '$1 $2')
      .replace(/([水-龯])([a-zA-ZÁÉÍÓÚÜÑ])/g, '$1 $2');
  };

  const sendPrompt = async (prompt) => {
    setResponse('');
    setIsLoading(true);
    setThinkingPhase(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error('Error al conectar con el servidor');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let finalPhase = false;
      let thinkingBuffer = '';
      let finalAnswer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        let chunk = decoder.decode(value, { stream: true });
        if (chunk.startsWith("data:")) {
          chunk = chunk.slice("data:".length);
        }
        // Eliminar saltos de línea al inicio y final del paquete
        chunk = chunk.replace(/^[\r\n]+|[\r\n]+$/g, '');
        // Omitir el marcador [DONE]
        if (chunk.trim() === "[DONE]") continue;
        
        if (!finalPhase) {
          const endIndex = chunk.indexOf('</think>');
          if (endIndex !== -1) {
            // Fase de pensando: se procesa hasta la etiqueta y se aplica insertSpaces
            let thinkingChunk = chunk.substring(0, endIndex);
            thinkingChunk = insertSpaces(thinkingChunk);
            thinkingBuffer += thinkingChunk;
            finalPhase = true;
            setThinkingPhase(false);
            // La parte que viene después de '</think>' se concatena sin modificarla
            const postThink = chunk.substring(endIndex + '</think>'.length);
            finalAnswer += postThink;
            setResponse(finalAnswer);
          } else {
            // En la fase de pensando, aplicar insertSpaces
            chunk = insertSpaces(chunk);
            thinkingBuffer = chunk;
            if (Date.now() - lastUpdateTimeRef.current > 500) {
              setResponse(`pensando: ${thinkingBuffer}`);
              lastUpdateTimeRef.current = Date.now();
            }
          }
        } else {
          // Fase final: concatenar directamente sin insertar espacios
          finalAnswer += chunk;
          if (Date.now() - lastUpdateTimeRef.current > 500) {
            setResponse(finalAnswer);
            lastUpdateTimeRef.current = Date.now();
          }
        }
      }
      setResponse(finalPhase ? finalAnswer : thinkingBuffer);
      setThinkingPhase(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setThinkingPhase(false);
    }
  };

  return { response, isLoading, thinkingPhase, sendPrompt };
};
