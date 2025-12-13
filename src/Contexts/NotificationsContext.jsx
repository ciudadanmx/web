import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { io } from 'socket.io-client';

const NotificationsContext = createContext();
export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth0();

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const socketRef = useRef(null);

  const fetchNotificaciones = async () => {
    if (!isAuthenticated || !user?.email) return;

    try {
      setCargando(true);

      const response = await axios.get(
        `${process.env.REACT_APP_STRAPI_URL}/api/notificaciones`,
        {
          params: {
            populate: 'usuario',
            'filters[usuario][email][$eq]': user.email,
          },
        }
      );

      setNotificaciones(response.data?.data || []);
    } catch (error) {
      console.error('❌ Error al traer notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const notificationsNum = () =>
    notificaciones.filter(n => !n.attributes?.leida).length;

  // traer notificaciones al login
  useEffect(() => {
    fetchNotificaciones();
  }, [isAuthenticated, user?.email]);

  // SOCKET
  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const SOCKET_URL =
      process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_STRAPI_URL;

    if (!SOCKET_URL) {
      console.warn('NotificationsContext: SOCKET_URL no definido');
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.debug('🔔 Socket conectado', socket.id);
    });

    socket.on('notification', () => {
      fetchNotificaciones();
    });

    socket.on('connect_error', err => {
      console.error('❌ Socket error:', err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.email]);

  return (
    <NotificationsContext.Provider
      value={{
        notificaciones,
        cargando,
        notificationsNum,
        refreshNotificaciones: fetchNotificaciones,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
