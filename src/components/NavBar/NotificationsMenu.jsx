//import React from 'react';

import '../../styles/AccountMenu.css';
//import Sesion from './Sesion';
//import { gapi } from 'gapi-script';
import { useState, useEffect } from 'react';


const NotificationsMenu = ({ isOpen, onClose,  onLogout }) => {



  return (
    <div className={`account-menu ${isOpen ? 'open' : 'closed'}`}>
    <ul>
     
        <>

          <li onClick={onClose}>No tienes notificaciones nuevas.</li>
          
        </>
      
      
      
    </ul>
  </div>
  );
};

export default NotificationsMenu;
