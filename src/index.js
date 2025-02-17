import React from 'react';
import ReactDOM from 'react-dom/client';
import { RolesProvider } from './Contexts/RolesContext'; 
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';  // Importa Auth0Provider
import './styles/index.css';
import Layout from './components/Layout.jsx'
import HomeRoute from './Pages/HomeRoute';
import GanaRoute from './Pages/GanaRoute';
import NavBar from './components/NavBar/NavBar.jsx';
import Conductor from './components/Taxis/Conductor';
import Pasajero from './components/Taxis/Pasajero';
import RegistroPasajero from './Pages/RegistroPasajero';
import RegistroConductor from './Pages/RegistroConductor';
import TaxisRoute from './Pages/TaxisRoute';
import RestaurantesRoute from './Pages/RestaurantesRoute';
import MarketRoute from './Pages/MarketRoute';
import AcademiaRoute from './Pages/AcademiaRoute';
import ComunidadRoute from './Pages/ComunidadRoute';
import GenRoute from './Pages/GenRoute';
import OpWalletRoute from './Pages/OpWalletRoute';
import CallbackPage from './Pages/CallbackPage';
import dayjs from "dayjs";
import "dayjs/locale/es"; // Importar el idioma español

// Función global para leer la cookie
const getReturnUrl = () => {
  const match = document.cookie.match(new RegExp('(^| )returnTo=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '/gana';
};


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{ redirect_uri: window.location.origin }}
      onRedirectCallback={(appState) => {
        const returnTo = getReturnUrl();
        console.log("***************** URL de retorno obtenida:", returnTo);
        window.location.replace(returnTo);
        document.cookie = "returnTo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        console.log("* * - - - URL guardada eliminada de la cookie.");
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <RolesProvider>
          <Router>
            <NavBar />
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/callback" element={<CallbackPage />} />
              <Route path="/gana" element={<GanaRoute />} />
              <Route path="/taxis" element={<TaxisRoute />} />
              <Route path="/taxis/conductor/registro" element={<RegistroConductor />} />
              <Route path="/taxis/pasajero/registro" element={<RegistroPasajero />} />
              <Route path="/comida" element={<RestaurantesRoute />} />
              <Route path="/market" element={<MarketRoute />} />
              <Route path="/academia" element={<AcademiaRoute />} />
              <Route path="/comunidad" element={<ComunidadRoute />} />
              <Route path="/gen" element={<GenRoute />} />
              <Route path="/cartera" element={<OpWalletRoute />} />
            </Routes>
          </Router>
        </RolesProvider>
      </LocalizationProvider>
    </Auth0Provider>
  </React.StrictMode>
);