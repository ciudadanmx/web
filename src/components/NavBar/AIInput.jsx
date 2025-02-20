import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { FaMicrophone } from "react-icons/fa";
import BotonCircular from './../Usuarios/BotonCircular.jsx';

const SearchWithVoice = () => {
  const { user, isAuthenticated } = useAuth0();
  const [searchText, setSearchText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "es-ES";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchText(transcript);
        sendTextToAPI(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Error en el reconocimiento de voz:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    } else {
      console.warn("Tu navegador no soporta el reconocimiento de voz.");
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error al iniciar el reconocimiento de voz:", error);
        setIsListening(false);
      }
    } else {
      console.warn("Reconocimiento de voz no disponible.");
    }
  };

  const sendTextToAPI = async (text) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${process.env.STRAPI_URL}/stt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          text,
        }),
      });
      const data = await response.json();
      console.log("Respuesta del servidor:", data);
    } catch (error) {
      console.error("Error enviando la petición:", error);
    }
  };

  return (
    <span>
      <input
        type="text"
        placeholder="Buscar/Chatear/Controlar con I.A."
        className="nav-input"
        style={{ width: "333px", maxWidth: "400px", padding: "8px", top: "-11px" }}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <span>
        <BotonCircular clase="boton-busca" />
      </span>
      <span>
        <button onClick={startListening} className="boton-microfono">
          <FaMicrophone color={isListening ? "red" : "black"} />
        </button>
      </span>
    </span>
  );
};

export default SearchWithVoice;
