import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { registerUserInStrapi, findUserInStrapi } from '../../utils/strapiUserService';
import { useNotifications } from '../../Contexts/NotificationsContext.jsx';
import { FaUniversity, FaDollarSign, FaWallet, FaCarSide, FaHamburger, FaStore } from 'react-icons/fa';
import { BsBriefcaseFill } from "react-icons/bs";
import { AiOutlineApartment } from "react-icons/ai";
import AIInput from './AIInput';
import MenuIcon from './MenuIcon';
import MessagesIcon from './MessagesIcon';
import NotificationsIcon from './NotificationsIcon';
import UserIcon from './UserIcon.jsx';
import NavButton from './NavButton.jsx';
import BotonCircular from './../Usuarios/BotonCircular.jsx';
import Direccionador from '../../utils/Direccionador';
import CiudadanBadge from '../CiudadanBadge';
import MenuTopBar from './MenuTopBar';
import guestImage from '../../assets/guest.png';
import '../../styles/NavBar.css';
import '../../styles/CuentaIcon.css';
import '../../styles/AccountMenu.css';

// ------------------------------
// NavBar con barra superior expandible
// - En desktop: muestra icono + nombre del menú
// - En móvil: muestra una grid con los iconos
// - Está oculta por defecto. Al pulsar el triángulo se muestra y empuja el resto hacia abajo.
// - Vuelve a ocultarse al pulsar de nuevo.
// ------------------------------

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const NavBar = ({ SetIsMenuOpen, siteSection }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const InfoRef = useRef(null);
  const topBarRef = useRef(null);

  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(SetIsMenuOpen || false);
  const navigate = useNavigate();

  const [lastRoute, setLastRoute] = useState(siteSection);
  const [routeRepeat, setRouteRepeat] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [optimisticByType, setOptimisticByType] = useState({});
  const location = useLocation();
  const isHomeOrInfo = location.pathname === '/' || location.pathname.startsWith('/info/');

  const [logoSrc, setLogoSrc] = useState("");

  siteSection = '/'+ siteSection;

  const [topBarOpen, setTopBarOpen] = useState(false); // <-- Estado de la barra superior

  const iconMap = {
    gana: <FaDollarSign />,
    cartera: <FaWallet />,
    taxis: <FaCarSide />,
    comida: <FaHamburger />,
    market: <FaStore />,
    coowork: <BsBriefcaseFill />,
    academia: <FaUniversity />,
    comunidad: <AiOutlineApartment />,
  };

  const handleNavigation = (path) => {
    setActiveTab(path);
    if (path === lastRoute) {
      const newRepeat = routeRepeat + 1;
      setRouteRepeat(newRepeat);
      navigate(path, { state: { routeRepeat: newRepeat } });
      setIsMenuOpen(false);
    } else {
      setLastRoute(path);
      setRouteRepeat(0);
      navigate(path, { state: { routeRepeat: 0 } });
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const targets = [profileRef.current, notifRef.current, InfoRef.current];
      const clickedInside = targets.some(ref => ref && ref.contains(event.target));
      if (!clickedInside) {
        closeAllMenus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

    useEffect(() => {
    setActiveTab(siteSection);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      setLogoSrc(window.innerWidth < 490 ? "/logo193.png" : "/marihuanasclub_logo.png");

      // Al redimensionar, actualiza la altura de la topBar para la animación si está abierta
      if (topBarRef.current && topBarOpen) {
        topBarRef.current.style.maxHeight = topBarRef.current.scrollHeight + 'px';
      }
    };

    const path = `/${window.location.pathname.split('/')[1]}`;

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [topBarOpen]);

  const handleLinkClick = (path) => {
    handleNavigation(path);
    setIsMenuOpen(false);
  };

  
  // --- Notifications context (usa lo que tengas disponible) ---
  // Asegúrate que tu NotificationsContext exponga refreshNotificaciones si quieres que pushNotification
  // dispare una recarga desde el servidor.
  const { notificationsNum, refreshNotificaciones, contadorNotificaciones } = useNotifications();

  // contador optimista local para respuesta instantánea en UI
  const [optimisticUnread, setOptimisticUnread] = useState(0);

  // Cuando el número real cambie (viene del contexto), limpiamos el optimismo
  // calculamos el número actual a partir de la función
  const currentNotificationsNum = typeof notificationsNum === 'function' ? notificationsNum() : 0;
  useEffect(() => {
    // si el backend refrescó, limpiamos el contador optimista
    setOptimisticUnread(0);
  }, [currentNotificationsNum]);

  /**
   * pushNotification
   * - notif: objeto recibido por socket (ya mapeado en el on('notification'))
   * Comportamiento:
   * 1) incrementa contador optimista para feedback inmediato
   * 2) si existe refreshNotificaciones en el contexto, la llama para traer la lista actualizada
   * 3) si ocurre error, mantiene el incremento optimista para que el usuario vea la alerta
   */
  const pushNotification = async (notif) => {
    console.log('notificando push', notif?.data?.tipo);
    try {
      // 1) Feedback inmediato en UI
      setOptimisticUnread((v) => v + 1);

      const tipo = notif?.data?.tipo;
    if (tipo) {
      setOptimisticByType((prev) => ({
        ...prev,
        [tipo]: (prev[tipo] || 0) + 1,
      }));
    }


      // 2) Si tu contexto provee la función para refrescar, la usamos
      if (typeof refreshNotificaciones === 'function') {
        console.log('notificando pusheando socket');
        await refreshNotificaciones(); // espera a que el servidor responda y el contexto se actualice
        // al actualizar el contexto, el useEffect que observa currentNotificationsNum limpiará optimisticUnread
      } else {
        // Si no existe refresh, opcionalmente podrías guardar la notificación localmente (no lo hacemos aquí)
        console.warn('pushNotification: refreshNotificaciones no disponible; aplicado incremento optimista.');
      }

      // opcional: puedes mostrar una pequeña animación, sonido o toast aquí
      // example: toast('Nueva notificación');
    } catch (err) {
      console.error('pushNotification error:', err);
      // no quitar el optimisticUnread para que el usuario vea algo; podrías revertir si quieres:
      // setOptimisticUnread((v) => Math.max(0, v - 1));
    }
  };

  // ---------- Socket: conectar y escuchar eventos ----------
  useEffect(() => {
    if (!SOCKET_URL) {
      console.warn('REACT_APP_SOCKET_URL no definido; el socket no se conectará.');
      return;
    }

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      console.log('NavBar conectado al socket', SOCKET_URL, 'id:', socket.id);
    });

    socket.on('notification', (data) => {
      const newNotif = {
        id: data.id ?? `notif_${Date.now()}`,
        title: data.title ?? 'Notificación',
        message: data.message ?? (data.body ?? JSON.stringify(data)).slice(0, 250),
        createdAt: data.createdAt ?? new Date().toISOString(),
        read: false,
        data,
        type: data.type ?? 'generic'
      };
      // Llamamos a la función que actualiza contador y refresca notificaciones
      pushNotification(newNotif);
      console.log('notificando', newNotif.data);
    });

    socket.on('disconnect', (reason) => console.log('Socket desconectado:', reason));
    socket.on('connect_error', (err) => console.warn('Error de conexión socket:', err));

    return () => socket.disconnect();
    // NOTA: pushNotification no está en dependencias para evitar reconectar el socket constantemente.
    // Si tu linter reclama, puedes envolver pushNotification en useCallback y añadirla.
  }, [SOCKET_URL]); // intentionally minimal deps



  useEffect(() => {
    const handleUserRegistration = async () => {
      if (isAuthenticated && user) {
        const userEmail = user.email;
        try {
          const existingUsers = await findUserInStrapi(userEmail);
          if (Array.isArray(existingUsers) && existingUsers.length === 0) {
            const result = await registerUserInStrapi(userEmail, user.name);
          }
        } catch (error) {
          console.error('Error al buscar o registrar usuario en Strapi:', error);
        }
      }
    };
    handleUserRegistration();
  }, [isAuthenticated, user]);

  const handleLogin = () => {
    const currentUrl = window.location.pathname + window.location.search;
    document.cookie = `returnTo=${encodeURIComponent(currentUrl)}; path=/; max-age=3600`;
    loginWithRedirect();
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    document.cookie = "returnTo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    logout({ returnTo: window.location.origin });
    setIsMenuOpen(false);
  };


  const displayCount = currentNotificationsNum + optimisticUnread;

  const closeAllMenus = () => {
    setIsProfileMenuOpen(false);
    setIsNotificationMenuOpen(false);
    setIsInfoMenuOpen(false);
  };

  // Toggle de la topBar: calculamos la altura para la animación
  const toggleTopBar = () => {
    setTopBarOpen(prev => {
      const next = !prev;
      // si la referencia existe y vamos a abrir, ajustamos maxHeight
      if (topBarRef.current) {
        if (!next) {
          topBarRef.current.style.maxHeight = '0px';
        } else {
          // fuerza reflow para que la transición funcione si venimos de 0
          topBarRef.current.style.maxHeight = '0px';
          // pequeño timeout para permitir el reflow
          setTimeout(() => {
            if (topBarRef.current) topBarRef.current.style.maxHeight = topBarRef.current.scrollHeight + 'px';
          }, 20);
        }
      }
      return next;
    });
  };

  // Inicializamos los estilos de la topBar a 0
  useEffect(() => {
    if (topBarRef.current && !topBarOpen) topBarRef.current.style.maxHeight = '0px';
  }, []);

  return (
    <>
      {/* ---------------- TOP BAR ---------------- */}
      <MenuTopBar
        iconMap={iconMap}
        isOpen={topBarOpen}
        setIsOpen={(open) => {
          if (topBarRef.current) {
            if (!open) {
              topBarRef.current.style.maxHeight = '0px';
            } else {
              topBarRef.current.style.maxHeight = '0px';
              setTimeout(() => {
                if (topBarRef.current) topBarRef.current.style.maxHeight = topBarRef.current.scrollHeight + 'px';
              }, 20);
            }
          }
          closeAllMenus();
          setTopBarOpen(open);
        }}
        topBarRef={topBarRef}
        handleNavigation={handleNavigation}
      />

      {/* Direccionador y resto del NavBar quedan igual */}
      <Direccionador
        eventUrl="http://localhost:8000/chat"
        eventKey="ya estoy invocando a la función llamar a taxi"
        redirectPath="/taxi"
      />

      <section className="navbar">
        <div className="nav-links">
          <div className='columnas'>
            <div className="columnax">
              <div className="logo-container" alt="Ciudadan.org --> Cooperativismo 6.0" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>

                <img
                  id="ciudadan-logo"
                  src={logoSrc}
                  alt="Ciudadan Logo"
                  name="Ciudadan.Org - Cooperativismo 6.0 - Logo"
                  className={`logo-img ${isHomeOrInfo ? "en-home" : ""}`}
                />

                <CiudadanBadge />
              </div>
            </div>
            <div className='columnax columna2'>
              <div className="nav-link correte">
                <AIInput />
              </div>
            </div>
            <div className="columnax columna3">
              <div className="nav-linky">
                <span className="robot-mobile">
                  <BotonCircular clase="boton-ia" mediaQ={true} />
                </span>
              </div>
              <div className="nav-linky">
                <MenuIcon
                  isOpen={topBarOpen}
                  setIsOpen={(open) => {
                    // animación: ajusta maxHeight para la transición
                    if (topBarRef.current) {
                      if (!open) {
                        topBarRef.current.style.maxHeight = '0px';
                      } else {
                        // forzamos reflow para que la transición se anime bien
                        topBarRef.current.style.maxHeight = '0px';
                        setTimeout(() => {
                          if (topBarRef.current) topBarRef.current.style.maxHeight = topBarRef.current.scrollHeight + 'px';
                        }, 20);
                      }
                    }
                    // cierra otras menus si hace falta
                    closeAllMenus();
                    setTopBarOpen(open);
                  }}
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
                  action='notifications'
                  isOpen={isNotificationMenuOpen}
                  setIsOpen={(open) => {
                    closeAllMenus();
                    setIsNotificationMenuOpen(open);
                  }}
                  onClose={() => setIsNotificationMenuOpen(false)}
                  authenticated={isAuthenticated}
                  userData={user}
                  containerRef={notifRef}
                  className="cuenta-icon"
                  handleLogout={handleLogout}
                  count={displayCount}
                />
              </div>

              <UserIcon
                handleLogin={handleLogin}
                isMenuOpen={isProfileMenuOpen}
                setIsMenuOpen={(open) => {
                  closeAllMenus(); // <--- CIERRA LOS DEMÁS
                  setIsProfileMenuOpen(open);
                }}
                handleLogout={handleLogout}
                handleLinkClick={handleLinkClick}
                defaultProfileImage={guestImage}
                guestImage={guestImage}
                Link={Link}
                containerRef={profileRef}
              />
            </div>
          </div>
        </div>
        <div className="nav-links wraper">
          {["gana", "cartera", "taxis", "comida", "market", "coowork", "academia", "comunidad"].map((section) => (
            <NavButton
              key={section}
              section={section}
              activeTab={activeTab}
              handleNavigation={handleNavigation}
              count={(contadorNotificaciones?.[section] || 0) + (optimisticByType?.[section] || 0)}
            />
          ))}
        </div>
      </section>

      {/* ===== CSS específico para la topbar (puedes mover a NavBar.css) ===== */}
      <style jsx>{`
        .topbar-wrapper {
          position: relative;
        }

        .topbar-toggle {
          position: absolute;
          left: 16px;
          top: 8px;
          z-index: 40;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .triangle {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid currentColor;
          display: inline-block;
          transition: transform 220ms ease;
          color: #111;
          background-color: #0000ff;
        }

        .topbar-toggle.open .triangle {
          transform: rotate(180deg);
        }

        .topbar {
          overflow: hidden;
          transition: max-height 280ms ease, opacity 220ms ease;
          max-height: 0px; /* se ajusta por JS al abrir */
          opacity: 0;
        }

        .topbar-wrapper .topbar[style] {
          /* si el maxHeight fue ajustado por JS, mostramos la opacidad */
          opacity: 1;
        }

        .topbar-desktop {
          display: none;
          padding: 12px 16px;
          align-items: center;
          gap: 12px;
        }

        .topbar-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .topbar-icon { font-size: 18px; }
        .topbar-label { font-weight: 600; }

        .topbar-mobile {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding: 10px 12px 16px;
        }

        .topbar-grid-item {
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:8px 6px;
          border-radius:8px;
          background:transparent;
          border:none;
          cursor:pointer;
        }

        .grid-icon { font-size: 20px; }
        .grid-label { font-size: 11px; margin-top:4px; text-transform:capitalize; }

        /* Responsive: mostramos la versión desktop arriba 768px */
        @media(min-width:768px) {
          .topbar-desktop { display:flex; }
          .topbar-mobile { display:none; }
          .topbar-toggle { left: 24px; top: 12px; }
        }
      `}</style>
    </>
  );
};

export default NavBar;
