import React, { useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../../styles/AccountMenuInfo.css';
import UserMenu from './UserMenu';

const UserIcon = ({ handleLogout, isMenuOpen, setIsMenuOpen, handleLinkClick, defaultProfileImage, guestImage, containerRef }) => {
  //const containerRef = useRef(null);
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    error
  } = useAuth0();

  const [imageSrc, setImageSrc] = useState(guestImage);

  // Cambia src según login 
  useEffect(() => {
    if (isAuthenticated && user?.picture) {
      setImageSrc(user?.picture || guestImage );
    } else {
      setImageSrc(guestImage);
    }
  }, [isAuthenticated, user]);

  const handleImageError = () => {
    console.warn('❌ Falló imagen, reintentando...');
    // Opcional: reintenta con un fetch para verificar disponibilidad
    setTimeout(() => {
      fetch(user.picture)
        .then(res => {
          if (res.ok) {
            setImageSrc(user.picture); // intenta de nuevo
          } else {
            setImageSrc(defaultProfileImage); // fallback
          }
        })
        .catch(() => setImageSrc(defaultProfileImage));
    }, 1000);
  };

  const handleLogin = async () => {
    const returnTo = window.location.pathname + window.location.search;
    await loginWithRedirect({ appState: { returnTo } });
    setIsMenuOpen(false);
  };

  const onIconClick = () => {
    if (isAuthenticated) {
      setIsMenuOpen(!isMenuOpen);
    } else {
      handleLogin();
    }
  };

  const handleLogoutWithLog = () => {
    logout({ returnTo: window.location.origin });
    setIsMenuOpen(false);
  };

  return (
    <span className="nav-linky" ref={containerRef}>
      <div className="cuenta-icon-container" onClick={onIconClick}>
        <img
          src={imageSrc}
          alt="Profile"
          className="cuenta-icon"
          onError={handleImageError}
        />

        <UserMenu
          handleLogin={handleLogin}
          handleLogout={handleLogoutWithLog}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          handleLinkClick={handleLinkClick}
          defaultProfileImage={defaultProfileImage}
          guestImage={guestImage}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
      </div>
    </span>
  );
};

export default UserIcon;
