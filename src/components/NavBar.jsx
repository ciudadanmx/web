import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import guestImage from '../assets/guest.png'; // Ajusta la ruta si es necesario
import defaultProfileImage from '../assets/guest.png'; // Cambia esto si tienes una imagen predeterminada de perfil
import { registerUserInStrapi, findUserInStrapi } from '../utils/strapiUserService';

import { FaUniversity, FaDollarSign, FaWallet, FaCarSide, FaHamburger, FaStore } from 'react-icons/fa';
import { TbHelpTriangleFilled } from "react-icons/tb";
import { AiOutlineApartment, AiFillApi, AiOutlineRobot } from "react-icons/ai";

import BotonCircular from './BotonCircular.jsx';

import MessagesIcon from './MessagesIcon.jsx';
import NotificationsIcon from './NotificationsIcon';

import '../styles/App.css';
import '../styles/NavBar.css';
import '../styles/CuentaIcon.css';
import '../styles/AccountMenu.css';


const NavBar = ({ SetIsMenuOpen }) => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(SetIsMenuOpen || false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  useEffect(() => {
    const handleUserRegistration = async () => {
      if (isAuthenticated && user) {
        const userEmail = user.email;
        const existingUsers = await findUserInStrapi(userEmail);

        if (existingUsers.length === 0) {
          // Usuario no encontrado en Strapi, registrar nuevo usuario
          const result = await registerUserInStrapi(userEmail, user.name);
          console.log('Usuario registrado en Strapi:', result);
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
                <span className='boton-ia'><BotonCircular clase="boton-ia" /></span>
            </div>




            <div className="nav-linky">
                <a href="/" className="iko3"> <TbHelpTriangleFilled /></a>
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
                            <li><a href="/cuenta" >Tu cuenta</a></li>
                            <li><a href="/ayuda" >Ayuda</a></li>
                            <li><div  onClick={handleLogout}>Salir</div></li>
                        </ul>
                    </div>
                    </>
                    ) : (
                    <>
                    <div className="dropdown-item" onClick={handleLogin}>Acceder</div>
                    <a href="/ayuda" className="dropdown-item">Ayuda</a>
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
