import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import guestImage from '../assets/guest.png'; // Ajusta la ruta si es necesario
import defaultProfileImage from '../assets/guest.png'; // Cambia esto si tienes una imagen predeterminada de perfil

const NavBar = () => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
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
          <div className="dropdown-item">Opción 1</div>
          <div className="dropdown-item">Opción 2</div>
        </div>
      )}
      <div className="auth-buttons">
        {isAuthenticated ? (
          <button onClick={() => logout({ returnTo: window.location.href.split('#')[0] })}>Cerrar sesión</button>
        ) : (
          <button onClick={() => loginWithRedirect()}>Iniciar sesión</button>
        )}
      </div>
    </div>
  );
};

export default NavBar;
