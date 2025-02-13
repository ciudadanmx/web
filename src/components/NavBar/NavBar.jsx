import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import guestImage from '../../assets/guest.png'; // Ajusta la ruta si es necesario
import defaultProfileImage from '../../assets/guest.png'; // Cambia esto si tienes una imagen predeterminada de perfil
import { registerUserInStrapi, findUserInStrapi } from '../../utils/strapiUserService';

import { FaUniversity, FaDollarSign, FaWallet, FaCarSide, FaHamburger, FaStore } from 'react-icons/fa';
import { AiOutlineApartment, AiFillApi, AiOutlineRobot } from "react-icons/ai";

import BotonCircular from './../Usuarios/BotonCircular.jsx';

import MenuIcon from './MenuIcon';

import MessagesIcon from './MessagesIcon';
import NotificationsIcon from './NotificationsIcon';

import '../../styles/App.css';
import '../../styles/NavBar.css';
import '../../styles/CuentaIcon.css';
import '../../styles/AccountMenu.css';

import { Link, useNavigate } from 'react-router-dom'; // Se agregó useNavigate junto con Link

const NavBar = ({ SetIsMenuOpen }) => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(SetIsMenuOpen || false);
  const navigate = useNavigate(); // Se instancia el hook useNavigate

  // Estados para llevar la cuenta de la ruta y repeticiones (routeRepeat)
  const [lastRoute, setLastRoute] = useState('');
  const [routeRepeat, setRouteRepeat] = useState(0);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Ahora se utiliza useNavigate y se cuenta la repetición de la ruta (routeRepeat)
  const handleNavigation = (path) => {
    if (path === lastRoute) {
      const newRepeat = routeRepeat + 1;
      setRouteRepeat(newRepeat);
      navigate(path, { state: { routeRepeat: newRepeat } });
    } else {
      setLastRoute(path);
      setRouteRepeat(0);
      navigate(path, { state: { routeRepeat: 0 } });
    }
  };

  useEffect(() => {
    const handleUserRegistration = async () => {
      if (isAuthenticated && user) {
        const userEmail = user.email;
        
        try {
          const existingUsers = await findUserInStrapi(userEmail);
  
          // Verificar si existingUsers es un array antes de acceder a .length
          if (Array.isArray(existingUsers) && existingUsers.length === 0) {
            const result = await registerUserInStrapi(userEmail, user.name);
            console.log('Usuario registrado en Strapi:', result);
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

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
    setIsMenuOpen(false); // Cierra el menú desplegable al salir
  };

  const handleLogin = () => {
    loginWithRedirect();
    setIsMenuOpen(false); // Cierra el menú desplegable al iniciar sesión
  };

  return (
    <>
    <div className="navbar">
        <div className="nav-links">

            <div className="logo">
                <img src="/ciudadan_logo.png" alt="Ciudadan Logo" className="logo-img" />
            </div>



            <div className="nav-link correte">
                <span>
                    <input
                        type="text"
                        placeholder="Buscar/Chatear/Controlar con I.A."
                        className="nav-input"
                        style={{ width: '333px', maxWidth: '400px', padding: '8px' }}
                    />
                    <span><BotonCircular clase="boton-busca"/></span>
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



            <div className='nav-linky'>
                <div className="cuenta-icon-container" onClick={toggleDropdown}>
                    <img
                        src={isAuthenticated ? (user?.picture || defaultProfileImage) : guestImage}
                        alt="Profile"

                        className="cuenta-icon"
                    />
                </div>
            
            </div>
            <div className='padre'>
                <div className={`account-menu-contenedor ${isMenuOpen ? 'open' : 'closed'}`}>
                    {isMenuOpen && (
                    <div className="account-menu.open">
                    {isAuthenticated ? (
                    <>
                    <div>Bienvenido, {user.name}
                        <ul>
                            <li><Link to="/cuenta" >Tu cuenta</Link></li>
                            <li><Link to="/ayuda" >Ayuda</Link></li>
                            <li><div  onClick={handleLogout}>Salir</div></li>
                        </ul>
                    </div>
                    </>
                    ) : (
                    <>
                    <div className="dropdown-item" onClick={handleLogin}>Acceder</div>
                    <Link to="/ayuda" className="dropdown-item">Ayuda</Link>
                    <div className="dropdown-item" onClick={handleLogin}>Iniciar sesión</div>
                    </>
                    )}
                    </div>   
        
      )
      
      }
                 </div>
            </div>

</div>



    <div className="nav-links">
        <div className="nav-link" onClick={() => handleNavigation('/gana')} style={{ cursor: 'pointer' }}>
            <span className="iko"><FaDollarSign /></span>
            <span className="nav-text">Ganar</span>
        </div>
        <div className="nav-link" onClick={() => handleNavigation('/cartera')} style={{ cursor: 'pointer' }}>
            <span className="iko"><FaWallet /></span>
            <span className="nav-text">Cartera</span>
        </div>
        <div className="nav-link subido" onClick={() => handleNavigation('/taxis')} style={{ cursor: 'pointer' }}>
            <span className="iko2 bajado"><FaCarSide /></span>
            <span className="nav-text subido">Taxis</span>
        </div>
        <div className="nav-link" onClick={() => handleNavigation('/comida')} style={{ cursor: 'pointer' }}>
            <span className="iko"><FaHamburger /></span>
            <span className="nav-text">Comida</span>
        </div>
        <div className="nav-link" onClick={() => handleNavigation('/market')} style={{ cursor: 'pointer' }}>
            <span className="iko"><FaStore /></span>
            <span className="nav-text">Market</span>
        </div>
        <div className="nav-link" onClick={() => handleNavigation('/academia')} style={{ cursor: 'pointer' }}>
            <span className="iko"><FaUniversity /></span>
            <span className="nav-text">Academia</span>
        </div>
        <div className="nav-link" onClick={() => handleNavigation('/comunidad')} style={{ cursor: 'pointer' }}>
            <span className="iko"><AiOutlineApartment /></span>
            <span className="nav-text">Comunidad</span>
        </div>
    </div>

      <div className="auth-buttons">
        
      </div>
    </div>
    </>
  );
};

export default NavBar;
