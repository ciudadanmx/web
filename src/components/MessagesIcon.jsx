import React, { useState, useContext } from 'react';
//import '../styles/CuentaIcon.css';
import { IoIosNotifications } from "react-icons/io";
import MessagesMenu from './MessagesMenu.jsx';
//import { gapi } from 'gapi-script';
import { useAuth0 } from '@auth0/auth0-react';
import { AuthProvider } from '../Contexts/AuthContext'; // Importa el contexto

import '../styles/MessagesIcon.css';
 

const MessagesIcon = ({ count = 13 }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    //const { isAuthenticated, setAuthenticated, user, userData, setUserData } = useContext(AuthProvider);

  
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
      };

  return (
    
      
      <div className="message-icon-container" onClick={toggleMenu}>
        <IoIosNotifications className="message-icon" />
        {count > 0 && <span className="message-count">{count}</span>}
      
        <MessagesMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        
      />
    </div>





  );
};

export default MessagesIcon;
