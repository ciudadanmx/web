import React, { useState } from 'react';

const LmAi = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState(true);

  // Inserta espacios entre letras de distintas "categorías"
  // (por ejemplo, minúscula seguida de mayúscula o entre caracteres latinos y CJK)
  const insertSpaces = (text) => {
    return text
      .replace(/([a-záéíóúüñ])([A-ZÁÉÍÓÚÜÑ])/g, '$1 $2')
      .replace(/([a-zA-ZÁÉÍÓÚÜÑ])([水-龯])/g, '$1 $2')
      .replace(/([水-龯])([a-zA-ZÁÉÍÓÚÜÑ])/g, '$1 $2');
  };

  // Función joinText se mantiene para la fase de "pensando" (si es necesario)
  const joinText = (current, addition) => {
    if (!current) return addition;
    if (!addition) return current;
    const lastChar = current.slice(-1);
    const firstChar = addition[0];
    if (!/\s/.test(lastChar) && !/\s/.test(firstChar)) {
      return current + ' ' + addition;
    }
    return current + addition;
  };

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
      let thinkingBuffer = ''; // Para la fase de "pensando"
      let finalAnswer = '';   // Acumula el resultado final
      let lastUpdateTime = Date.now();

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        let chunk = decoder.decode(value, { stream: true });
        // Quitar el prefijo "data:" si existe
        if (chunk.startsWith("data:")) {
          chunk = chunk.slice("data:".length);
        }
        // Eliminar saltos de línea (y retornos) al inicio y final del paquete
        chunk = chunk.replace(/^[\r\n]+|[\r\n]+$/g, '');
        // Si el paquete es exactamente "[DONE]", se omite
        if (chunk.trim() === "[DONE]") {
          continue;
        }
        // Insertar espacios donde hagan falta (fase pensando)
        chunk = insertSpaces(chunk);

        if (!finalPhase) {
          const endIndex = chunk.indexOf('</think>');
          if (endIndex !== -1) {
            finalPhase = true;
            setThinkingPhase(false);
            // Se procesa lo que viene después de '</think>' y se concatena directamente
            const postThink = chunk.substring(endIndex + '</think>'.length);
            finalAnswer += postThink;
            setResponse(finalAnswer);
          } else {
            // Fase de "pensando": se muestra el paquete actual (ya se procesa adecuadamente)
            thinkingBuffer = chunk;
            if (Date.now() - lastUpdateTime > 500) {
              setResponse(`pensando: ${thinkingBuffer}`);
              lastUpdateTime = Date.now();
            }
          }
        } else {
          // Fase final: se concatenan los paquetes directamente sin insertar espacios extra
          finalAnswer += chunk;
          if (Date.now() - lastUpdateTime > 500) {
            setResponse(finalAnswer);
            lastUpdateTime = Date.now();
          }
        }
      }
      // Actualizar la respuesta final
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
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {response}
        </pre>
      </div>
    </div>
  );
};

export default LmAi;
