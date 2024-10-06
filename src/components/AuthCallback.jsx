// src/routes/AuthCallback.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const AuthCallback = () => {
  const { handleRedirectCallback } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Procesa el retorno de Auth0 y autentica al usuario
        await handleRedirectCallback();
        // Redirige a la página principal o a donde prefieras
        navigate('/');
      } catch (error) {
        console.error('Error during authentication callback:', error);
      }
    };

    handleAuthCallback();
  }, [handleRedirectCallback, navigate]);

  return <div>Autenticando...</div>;
};

export default AuthCallback;
