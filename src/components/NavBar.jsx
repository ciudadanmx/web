import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import guestImage from '../assets/guest.png'; // Ajusta la ruta si es necesario
import defaultProfileImage from '../assets/guest.png'; // Cambia esto si tienes una imagen predeterminada de perfil
import { registerUserInStrapi, findUserInStrapi } from '../utils/strapiUserService';

const NavBar = () => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
    setIsDropdownOpen(false); // Cierra el menú desplegable al salir
  };

  const handleLogin = () => {
    loginWithRedirect();
    setIsDropdownOpen(false); // Cierra el menú desplegable al iniciar sesión
  };

  return (
    <>
    <div className="navbar">
      <div className="profile" onClick={toggleDropdown}>
        <img
          src={isAuthenticated ? (user?.picture || defaultProfileImage) : guestImage}
          alt="Profile"
          className="profile-img"
        />
      </div>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          {isAuthenticated ? (
            <>
              <div className="dropdown-item">Bienvenido, {user.name}</div>
              <a href="/cuenta" className="dropdown-item">Tu cuenta</a>
              <a href="/ayuda" className="dropdown-item">Ayuda</a>
              <div className="dropdown-item" onClick={handleLogout}>Salir</div>
            </>
          ) : (
            <>
              <div className="dropdown-item" onClick={handleLogin}>Acceder</div>
              <a href="/ayuda" className="dropdown-item">Ayuda</a>
              <div className="dropdown-item" onClick={handleLogin}>Iniciar sesión</div>
            </>
          )}
        </div>
      )}
      <div className="auth-buttons">
        {isAuthenticated ? (
          <button onClick={handleLogout}>Cerrar sesión</button>
        ) : (
          <button onClick={handleLogin}>Iniciar sesión</button>
        )}
      </div>
    </div>
    </>
  );
};

export default NavBar;
