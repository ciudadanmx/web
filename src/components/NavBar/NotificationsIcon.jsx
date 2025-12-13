import React from 'react';
import { IoIosNotifications } from "react-icons/io";
import NotificacionsMenu from './NotificacionsMenu.jsx';
import '../../styles/MessagesIcon.css';

const NotificationsIcon = ({ count = 0, handleLogout, action = 'info', containerRef, isOpen, setIsOpen }) => {
  const toggleMenu = () => {
    setIsOpen(!isOpen); // ahora usamos el estado externo
  };

  return (
    <div ref={containerRef} className="message-icon-container" onClick={toggleMenu}>
      
        <>
          <IoIosNotifications className="message-icon" />
          {count > 0 && <span className="message-count">{count}</span>}
          <NotificacionsMenu
            handleLogout={handleLogout}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </>
    </div>
  );
};

export default NotificationsIcon;
