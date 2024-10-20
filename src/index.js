import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import HomeRoute from './routes/HomeRoute';
import GanaRoute from './routes/GanaRoute';
import NavBar from './components/NavBar';
import TaxisRoute from './routes/TaxisRoute';
import RestaurantesRoute from './routes/RestaurantesRoute';
import MarketRoute from './routes/MarketRoute';
import AcademiaRoute from './routes/AcademiaRoute';
import ComunidadRoute from './routes/ComunidadRoute';
import GenRoute from './routes/GenRoute';
import OpWalletRoute from './routes/OpWalletRoute';
import ProfileRoute from './routes/ProfileRoute.jsx';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';  // Importa Auth0Provider
import AuthCallback from './components/AuthCallback'; 

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
          <Route path="/taxis" element={<TaxisRoute />} />
          <Route path="/comida" element={<RestaurantesRoute />} />
          <Route path="/market" element={<MarketRoute />} />
          <Route path="/academia" element={<AcademiaRoute />} />
          <Route path="/comunidad" element={<ComunidadRoute />} />
          <Route path="/gen" element={<GenRoute />} />
          <Route path="/cartera" element={<OpWalletRoute />} />
          <Route path="/perfil" element={<ProfileRoute />} />

          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Agrega más rutas aquí según sea necesario */}
        </Routes>
      </Router>
    </Auth0Provider>
  </React.StrictMode>
);
