import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import HomeRoute from './Pages/HomeRoute';
import GanaRoute from './Pages/GanaRoute';
import NavBar from './components/NavBar/NavBar.jsx';

import Conductor from './components/Taxis/Conductor';
import Pasajero from './components/Taxis/Pasajero';
import TaxisRoute from './Pages/TaxisRoute';
import RtaxisRoute from './Pages/RtaxisRoute';
import RestaurantesRoute from './Pages/RestaurantesRoute';
import MarketRoute from './Pages/MarketRoute';
import AcademiaRoute from './Pages/AcademiaRoute';
import ComunidadRoute from './Pages/ComunidadRoute';
import GenRoute from './Pages/GenRoute';
import OpWalletRoute from './Pages/OpWalletRoute';
import { RolesProvider } from './Contexts/RolesContext'; 
import App from './App.js'
//import Layout from './components/Layout'.

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';  // Importa Auth0Provider

const Layout = () => {
  return (
    <>
      <NavBar />
      <App />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      redirectUri={window.location.origin}
    >
      <RolesProvider>
        <Router>
          <NavBar />
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/gana" element={<GanaRoute />} />
            <Route path="/taxis" element={<TaxisRoute />} />
            <Route path="/rtaxis" element={<RtaxisRoute />} />
            <Route path="/comida" element={<RestaurantesRoute />} />
            <Route path="/market" element={<MarketRoute />} />
            <Route path="/academia" element={<AcademiaRoute />} />
            <Route path="/comunidad" element={<ComunidadRoute />} />
            <Route path="/gen" element={<GenRoute />} />
            <Route path="/cartera" element={<OpWalletRoute />} />
          </Routes>
        </Router>
      </RolesProvider>
    </Auth0Provider>
  </React.StrictMode>
);