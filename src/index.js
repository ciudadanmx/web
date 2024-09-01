import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import HomeRoute from './routes/HomeRoute';
import GanaRoute from './routes/GanaRoute';
import NavBar from './components/NavBar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';  // Importa Auth0Provider

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      redirectUri={window.location.origin}
    >
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/gana" element={<GanaRoute />} />
          {/* Agrega más rutas aquí según sea necesario */}
        </Routes>
      </Router>
    </Auth0Provider>
  </React.StrictMode>
);
