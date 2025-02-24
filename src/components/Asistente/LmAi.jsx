import React, { useState } from 'react';

const LmAi = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState(true);

  const handleSubmit = async () => {
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
      let thinkingBuffer = ''; // Contendrá lo que se muestra mientras "piensa"
      let finalAnswer = '';   // Acumula lo que viene después de </think>
      let lastUpdateTime = Date.now();

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        let chunk = decoder.decode(value, { stream: true });
        // Quitar el prefijo "data:" si lo tiene
        if (chunk.startsWith("data:")) {
          chunk = chunk.slice("data:".length);
        }
        // Eliminar solo espacios extra de los extremos (se conservan los saltos de línea internos)
        chunk = chunk.trim();

        if (!finalPhase) {
          const endIndex = chunk.indexOf('</think>');
          if (endIndex !== -1) {
            // Se detectó el fin del pensamiento
            finalPhase = true;
            setThinkingPhase(false);
            thinkingBuffer = chunk.substring(0, endIndex);
            const postThink = chunk.substring(endIndex + '</think>'.length);
            finalAnswer = postThink;
            // Actualizamos inmediatamente con la parte final
            setResponse(finalAnswer);
          } else {
            // Durante la fase de pensamiento, actualizamos el buffer (reemplazando el contenido)
            thinkingBuffer = chunk;
            if (Date.now() - lastUpdateTime > 500) {
              setResponse(`pensando: ${thinkingBuffer}`);
              lastUpdateTime = Date.now();
            }
          }
        } else {
          // En la fase final, vamos acumulando (concatenando) el contenido
          finalAnswer += chunk;
          if (Date.now() - lastUpdateTime > 500) {
            setResponse(finalAnswer);
            lastUpdateTime = Date.now();
          }
        }
      }
      // Actualizamos al final con el resultado completo
      setResponse(finalPhase ? finalAnswer : thinkingBuffer);
      setThinkingPhase(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setThinkingPhase(false);
    }
  };

  return (
    <div>
      <h2>LM AI</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Escribe tu prompt aquí..."
        rows={4}
        cols={50}
      />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar'}
      </button>
      <div>
        <h3>Respuesta:</h3>
        <pre>{response}</pre>
      </div>
    </div>
  );
};

export default LmAi;
