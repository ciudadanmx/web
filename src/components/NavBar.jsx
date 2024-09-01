import React, { useState } from 'react';
import '../styles/NavBar.css'; // Asegúrate de tener los estilos adecuados
import guestImage from '../assets/guest.png'; // Ajusta la ruta si es necesario
import defaultProfileImage from '../assets/guest.png'; // Cambia esto si tienes una imagen predeterminada de perfil

const NavBar = ({ isAuthenticated, user, onLogin, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="navbar">
      <div className="profile" onClick={toggleDropdown}>
        <img
          src={isAuthenticated ? (user?.profilePicture || defaultProfileImage) : guestImage}
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
          <button onClick={onLogout}>Cerrar sesión</button>
        ) : (
          <button onClick={onLogin}>Iniciar sesión</button>
        )}
      </div>
    </div>
  );
};

export default NavBar;
