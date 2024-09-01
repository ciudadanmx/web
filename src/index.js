import React from 'react';
import ReactDOM from 'react-dom/client';  // Importar desde 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

// Crear el root usando createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));

console.log('iniciando............');

// Usar el método render del root creado
root.render(
  <Auth0Provider
    domain="ciudadan.us.auth0.com"       // Reemplaza con tu dominio Auth0
    clientId="za265MeRdxMKuPqzdPSTL7lHL0yyg5bd"  // Reemplaza con tu Client ID Auth0
    authorizationParams={{ redirect_uri: window.location.origin }}  // Usa authorizationParams para redirección
  >
    <App />
  </Auth0Provider>
);
