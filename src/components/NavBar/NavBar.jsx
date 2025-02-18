import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Se agregó useNavigate junto con Link
import { registerUserInStrapi, findUserInStrapi } from '../../utils/strapiUserService';
import { FaUniversity, FaDollarSign, FaWallet, FaCarSide, FaHamburger, FaStore } from 'react-icons/fa';
import { BsBriefcaseFill } from "react-icons/bs";
import { AiOutlineApartment } from "react-icons/ai";
import guestImage from '../../assets/guest.png'; // Ajusta la ruta si es necesario
import defaultProfileImage from '../../assets/guest.png'; // Cambia esto si tienes una imagen predeterminada de perfil
import BotonCircular from './../Usuarios/BotonCircular.jsx';
import MenuIcon from './MenuIcon';
import MessagesIcon from './MessagesIcon';
import NotificationsIcon from './NotificationsIcon';
import UserMenu from './UserMenu.jsx';
import NavButton from './NavButton.jsx';
import '../../styles/NavBar.css';
import '../../styles/CuentaIcon.css';
import '../../styles/AccountMenu.css';

import CiudadanBadge from '../CiudadanBadge';

const NavBar = ({ SetIsMenuOpen }) => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(SetIsMenuOpen || false);
  const navigate = useNavigate();

  // Estados para llevar la cuenta de la ruta y repeticiones (routeRepeat)
  const [lastRoute, setLastRoute] = useState('');
  const [routeRepeat, setRouteRepeat] = useState(0);

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('');
  const location = useLocation();
  const isHomeOrInfo = location.pathname === '/' || location.pathname.startsWith('/info/');

  const [logoSrc, setLogoSrc] = useState("");

  const iconMap = {
    gana: <FaDollarSign />,
    cartera: <FaWallet />,
    taxis: <FaCarSide />,
    comida: <FaHamburger />,
    market: <FaStore />,
    oficina: <BsBriefcaseFill />,
    academia: <FaUniversity />,
    comunidad: <AiOutlineApartment />,
  };

  /*   const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  }; */

  useEffect(() => {
    const handleResize = () => {
      setLogoSrc(window.innerWidth < 490 ? "/logo192.png" : "/ciudadan_logo.png");
    };

    handleResize(); // 🔥 Se ejecuta al montar el componente

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Actualizamos activeTab en el evento onClick y navegamos
  const handleNavigation = (path) => {
    setActiveTab(path);
    if (path === lastRoute) {
      const newRepeat = routeRepeat + 1;
      setRouteRepeat(newRepeat);
      navigate(path, { state: { routeRepeat: newRepeat } });
      setIsMenuOpen(false);
    } else {
      setLastRoute(path);
      setRouteRepeat(0);
      navigate(path, { state: { routeRepeat: 0 } });
      setIsMenuOpen(false);
    }
  };

  const handleLinkClick = (path) => {
    // Realiza la navegación
    handleNavigation(path);
    // Cierra el menú
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleUserRegistration = async () => {
      if (isAuthenticated && user) {
        const userEmail = user.email;
        try {
          const existingUsers = await findUserInStrapi(userEmail);
          if (Array.isArray(existingUsers) && existingUsers.length === 0) {
            const result = await registerUserInStrapi(userEmail, user.name);
            //console.log('Usuario registrado en Strapi:', result);
          }
        } catch (error) {
          console.error('Error al buscar o registrar usuario en Strapi:', error);
        }
      }
    };
    handleUserRegistration();
  }, [isAuthenticated, user]);

  
  

 

  

  const toggleDropdown = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = () => {
    // Guarda la URL actual antes de hacer login
    const currentUrl = window.location.pathname + window.location.search;
    document.cookie = `returnTo=${encodeURIComponent(currentUrl)}; path=/; max-age=3600`;
    console.log("URL guardada en cookie antes de login:", currentUrl);
    // Redirige a Auth0
    loginWithRedirect();
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    // Elimina la cookie de retorno antes de cerrar sesión
    document.cookie = "returnTo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log("Cookie de returnTo eliminada antes de logout");
    // Redirige a la página principal después del logout
    logout({ returnTo: window.location.origin });
    setIsMenuOpen(false);
  };

  return (
    <>
      <section className="navbar">
        <div className="nav-links">
          <div className='columnas'>
            <div className="columnax">
              <div className="logo-container" alt="Ciudadan.org --> Cooperativismo 6.0" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>

              <img 
                  src={logoSrc} 
                  alt="Ciudadan Logo" 
                  name="Ciudadan.Org - Cooperativismo 6.0 - Logo"
                  className={`logo-img ${isHomeOrInfo ? "en-home" : ""}`}
                />
                
                <CiudadanBadge />
              </div>
            </div>
            <div className='columnax columna2'>
              <div className="nav-link correte">
                <span>
                  <input
                    type="text"
                    placeholder="Buscar/Chatear/Controlar con I.A."
                    className="nav-input"
                    style={{ width: '333px', maxWidth: '400px', padding: '8px', top: '-11px' }}
                  />
                  <span><BotonCircular clase="boton-busca" /></span>
                  
                </span>
              </div>
            </div>
            <div className="columnax columna3">
            <div className="nav-linky">
                <span className="robot-mobile">
                  <BotonCircular clase="boton-ia" mediaQ={true} />
                </span>
              </div>
              <div className="nav-linky">
                <MenuIcon
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  authenticated={isAuthenticated}
                  userData={user}
                  className="cuenta-icon"
                />
              </div>
              <div className="nav-linky">
                <MessagesIcon
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  authenticated={isAuthenticated}
                  userData={user}
                  className="cuenta-icon"
                />
              </div>
              <div className="nav-linky">
                <NotificationsIcon
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  authenticated={isAuthenticated}
                  userData={user}
                  className="cuenta-icon"
                />
              </div>
              <div className="nav-linky">
                <div className="cuenta-icon-container" onClick={() => { isAuthenticated ? toggleDropdown() : handleLogin(); }}>
                  <img
                    src={isAuthenticated ? (user?.picture || defaultProfileImage) : guestImage}
                    alt="Profile"
                    className="cuenta-icon"
                  />
                </div>
              </div>
              <UserMenu 
                handleLogin={handleLogin}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                handleLogout={handleLogout}
                handleLinkClick={handleLinkClick}
                defaultProfileImage={defaultProfileImage}
                guestImage={guestImage}
                Link={Link}
              />
            </div>
          </div>
        </div>
        <div className="nav-links wraper">
          {["gana", "cartera", "taxis", "comida", "market", "oficina", "academia", "comunidad"].map((section) => (
            <NavButton
              key={section}
              section={section}
              activeTab={activeTab}
              handleNavigation={handleNavigation}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default NavBar;
