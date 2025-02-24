import React, { useState } from 'react';
import { useLmAiChat } from '../../hooks/UseLmAiChat';

const LmAiChat = () => {
  const [prompt, setPrompt] = useState('');
  const { response, isLoading, sendPrompt } = useLmAiChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendPrompt(prompt);
  };

  return (
    <div>
      <h2>LM AI Chat</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe tu prompt aquí..."
          rows={4}
          cols={50}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      <div>
        <h3>Respuesta:</h3>
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
          {response}
        </pre>
      </div>
    </div>
  );
};

export default LmAiChat;
