// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

import { RolesProvider } from './Contexts/RolesContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Auth0Provider } from '@auth0/auth0-react';

import './styles/index.css';

/* ---------- Páginas principales ---------- */
import HomeRoute from './Pages/HomeRoute';
import GanaRoute from './Pages/GanaRoute';
import TaxisRoute from './Pages/TaxisRoute';
import RestaurantesRoute from './Pages/RestaurantesRoute';
import MarketRoute from './Pages/MarketRoute';
import AcademiaRoute from './Pages/AcademiaRoute';
import ComunidadRoute from './Pages/ComunidadRoute';
import GenRoute from './Pages/GenRoute';
import OpWalletRoute from './Pages/OpWalletRoute';
import CallbackPage from './Pages/CallbackPage';
import RegistroPasajero from './Pages/RegistroPasajero';
import RegistroConductor from './Pages/RegistroConductor';
import PreRegistroConductor from './Pages/PreRegistroConductor';
import Clubs from './Pages/Clubs.jsx';
import Membresias from './Pages/Membresias.jsx';
import MiMembresia from './Pages/MiMembresia.jsx';
import MarketPlace from './Pages/MarketPlace/MarketPlace.jsx';
import ProductosPage from './Pages/MarketPlace/ProductosPage.jsx';
import CursosPage from './Pages/Cursos/Cursos';
import Cursos from './Pages/Cursos/Cursos';
import Curso from './Pages/Cursos/Curso.jsx';
import CursoDetalle from './Pages/Cursos/Curso.jsx';
import ContenidosPage from './Pages/Blog/Contenidos';
import Contenido from './Pages/Blog/Contenido';
import AgregarContenido from './Pages/Blog/AgregarContenido.jsx';
import AgregarCurso from './Pages/Blog/AgregarCurso.jsx';
import EditarContenido from './Pages/Blog/EditarContenido';
import EliminarContenido from './Pages/Blog/EliminarContenido';
import EditarCurso from './Pages/Cursos/EditarCurso.jsx';
import EliminarCurso from './Pages/Cursos/EliminarCurso.jsx';

/* ---------- Componentes / Pages adicionales ---------- */
import NavBar from './components/NavBar/NavBar.jsx';
import Perfil from './components/Usuario/Perfil';
import RequisitosConductor from './components/Taxis/RequisitosConductor.jsx';
import Academia from './components/Taxis/Academia/Academia.jsx';
import Asistente from './components/Asistente/Asistente';
import LmAi from './components/Asistente/LmAi';
import TTS from './components/Tts.jsx';
import TextToSpeech from './components/TextToSpeech.jsx';
import StripeSuccessRedirect from './components/StripeSuccessRedirect.jsx';
import AgregarClubWrapper from './components/Clubs/AgregarClubWrapper.jsx';
import RegistroTienda from './Pages/MarketPlace/RegistroTienda.jsx';
import AgregarProducto from './Pages/MarketPlace/AgregarProducto.jsx';
import PreguntasProducto from './components/MarketPlace/PreguntasProducto.jsx';
import Tienda from './Pages/MarketPlace/Tienda.jsx';
import Producto from './Pages/MarketPlace/Producto.jsx';
import MiUbicacion from './components/MiUbicacion';
import Carrito from './Pages/MarketPlace/Carrito.jsx';
import MisProductos from './Pages/MarketPlace/MisProductos';
import PedidosEntregados from './Pages/MarketPlace/PedidosEntregados.jsx';
import PagosTienda from './Pages/MarketPlace/PagosTienda.jsx';
import ConfiguracionTienda from './Pages/MarketPlace/ConfiguracionTienda.jsx';
import EliminarProducto from './Pages/MarketPlace/EliminarProducto.jsx';
import HomeViewModelWrapper from './components/Florateca/home/HomeViewModelWrapper.jsx';
import DetailViewModelWrapper from './components/Florateca/detail/DetailViewModelWrapper.jsx';
import FloratecaLayout from './components/Florateca/FloratecaLayout.jsx';
import QuienesSomos from './Pages/Info/QuienesSomos';
import PreguntasFrecuentes from './Pages/Info/PreguntasFrecuentes.jsx';
import EventosPage from './components/Eventos/index.jsx';
import Evento from './Pages/Eventos/Evento.jsx';
import CrearEvento from './Pages/Eventos/CrearEvento.jsx';

import AdminDashboard from './Pages/Admin/AdminDashboard.jsx';
import LegalPage from './Pages/Legal/LegalPage';
import ComunidadPage from './Pages/ComunidadPage';
import Prueba from './Pages/Prueba.jsx';
import TestConsumoResponsable from './Pages/Herramientas/TestConsumoResponsable';
import HerramientasPage from './Pages/Herramientas/HerramientasPage';
import Juegos from './Pages/Herramientas/Juegos.jsx';
import JuegoStatic from './Pages/Herramientas/JuegoStatic';
import ITokens from './Pages/Cartera/ITokens.jsx';
import Catalogo from './Pages/Cartera/FreeBoocks/Catalogo.jsx';

/* ---------- Helpers / Wrappers ---------- */

// Obtener returnTo desde cookie (si existe), fallback a /gana
const getReturnUrl = () => {
  const match = document.cookie.match(new RegExp('(^| )returnTo=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '/ganar';
};

// Wrappers que usan useParams para pasar 'slug' como 'parametros' a componentes de edición/eliminación
const EditarContenidoWrapper = () => {
  const { slug } = useParams();
  return <EditarContenido filtros="editar" parametros={slug} />;
};
const EliminarContenidoWrapper = () => {
  const { slug } = useParams();
  return <EliminarContenido filtros="eliminar" parametros={slug} />;
};
const EditarCursoWrapper = () => {
  const { slug } = useParams();
  return <EditarCurso filtros="editar" parametros={slug} />;
};
const EliminarCursoWrapper = () => {
  const { slug } = useParams();
  return <EliminarCurso filtros="eliminar" parametros={slug} />;
};
const EliminarProductoWrapper = () => {
  const { slug } = useParams();
  return <EliminarProducto filtros="eliminar" parametros={slug} />;
};

/* ---------- Inicialización del root y render ---------- */
const rootElement = document.getElementById('root');

if (!rootElement) {
  // Si no hay root, avisamos y abortamos para no lanzar errores en consola.
  console.error('No se encontró el elemento #root — crea un <div id="root"></div> en tu index.html');
} else {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <Auth0Provider
        domain={process.env.REACT_APP_AUTH0_DOMAIN}
        clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
        authorizationParams={{ redirect_uri: window.location.origin }}
        onRedirectCallback={() => {
          const returnTo = getReturnUrl();
          // Reemplazamos la URL actual por la de retorno guardada
          window.location.replace(returnTo);
          // Limpiamos la cookie
          document.cookie = 'returnTo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <RolesProvider>
            <Router>
              <NavBar />
              <Routes>
                {/* Rutas base */}
                <Route path="/" element={<HomeRoute />} />
                <Route path="/callback" element={<CallbackPage />} />

                {/* Gana / Taxis / Comida / Market / Academia / Comunidad / Gen / Cartera */}
                <Route path="/gana" element={<GanaRoute />} />
                <Route path="/taxis" element={<TaxisRoute />} />
                <Route path="/taxis/conductor/registro" element={<RegistroConductor />} />
                <Route path="/taxis/conductor/preregistro" element={<PreRegistroConductor />} />
                <Route path="/taxis/conductor/requisitos" element={<RequisitosConductor />} />
                <Route path="/taxis/pasajero/registro" element={<RegistroPasajero />} />
                <Route path="/comida" element={<RestaurantesRoute />} />
                <Route path="/market" element={<MarketRoute />} />
                <Route path="/academias" element={<AcademiaRoute />} />
                <Route path="/academia" element={<Academia />} />
                <Route path="/comunidad" element={<ComunidadRoute />} />
                <Route path="/gen" element={<GenRoute />} />
                
                <Route path="/cartera/itokens" element={<ITokens />} />
                {/* acá van las que sean dentro de freeboocks/algo osea antes de freebooks a secas */}
                <Route path="/cartera/freebocks" element={<Catalogo />} />
                <Route path="/cartera" element={<OpWalletRoute />} />
                

                {/* Perfil y utilidades */}
                <Route path="/perfil/:username" element={<Perfil />} />
                <Route path="/tts" element={<TTS />} />
                <Route path="/ttz" element={<TextToSpeech />} />
                <Route path="/lmai" element={<LmAi />} />

                {/* Eventos / Info / Legal */}
                <Route path="/evento/:slug" element={<Evento />} />
                <Route path="/eventos" element={<EventosPage />} />
                <Route path="/eventos/crear-evento" element={<CrearEvento />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/quienes-somos" element={<QuienesSomos />} />
                <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentes />} />

                {/* Clubs / Membresías / Marketplace */}
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/clubs/agregar-club" element={<AgregarClubWrapper />} />
                <Route path="/contenidos/agregar-contenido" element={<AgregarContenido />} />
                <Route path="/agregar-curso" element={<AgregarCurso />} />
                <Route path="/membresias" element={<Membresias />} />
                <Route path="/mi-membresia" element={<MiMembresia />} />
                <Route path="/registro-vendedor" element={<RegistroTienda />} />
                <Route path="/agregar-producto" element={<AgregarProducto />} />
                <Route path="/stripe-success/:slug" element={<StripeSuccessRedirect />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/market/producto/:slug" element={<Producto />} />
                <Route path="/market/store/:slug" element={<Tienda />}>
                  <Route path="agregar-producto" element={<AgregarProducto />} />
                  <Route path="pedidos" element={<MisProductos />} />
                  <Route path="entregados" element={<PedidosEntregados />} />
                  <Route path="productos" element={<AgregarProducto />} />
                  <Route path="preguntas-producto" element={<MisProductos />} />
                  <Route path="pagos" element={<PagosTienda />} />
                  <Route path="configuracion" element={<ConfiguracionTienda />} />
                </Route>

                {/* Admin / Utilities / Prueba */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/ubicacion" element={<MiUbicacion />} />
                <Route path="/prueba" element={<Prueba />} />

                {/* Cursos y Contenidos */}
                <Route path="/cursos/*" element={<CursosPage />} />
                <Route path="/curso/:slug" element={<Curso />} />
                <Route path="/cursos/editar/:slug" element={<EditarCursoWrapper />} />
                <Route path="/cursos/eliminar/:slug" element={<EliminarCursoWrapper />} />

                <Route path="/contenidos/*" element={<ContenidosPage />} />
                <Route path="/contenido/:slug" element={<Contenido />} />
                <Route path="/contenidos/editar/:slug" element={<EditarContenidoWrapper />} />
                <Route path="/contenidos/eliminar/:slug" element={<EliminarContenidoWrapper />} />

                {/* Market - productos (eliminar) */}
                <Route path="/productos/eliminar/:slug" element={<EliminarProductoWrapper />} />
                <Route path="/productos/*" element={<ProductosPage />} />

                {/* Herramientas y juegos */}
                <Route path="/herramientas" element={<HerramientasPage />} />
                <Route path="/herramientas/test-consumo" element={<TestConsumoResponsable />} />
                <Route path="/herramientas/juegos" element={<Juegos />} />
                <Route path="/herramientas/juego-static" element={<JuegoStatic />} />

                {/* Florateca (wrappers/landing específicos) - rutas ejemplo */}
                <Route path="/florateca" element={<FloratecaLayout />}>
                  <Route index element={<HomeViewModelWrapper />} />
                  <Route path="detalle/:slug" element={<DetailViewModelWrapper />} />
                </Route>
              </Routes>

              <Asistente />
            </Router>
          </RolesProvider>
        </LocalizationProvider>
      </Auth0Provider>
    </React.StrictMode>
  );
}
//