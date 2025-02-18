import react from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const UserMenu = ({handleLogin, handleLogout, isMenuOpen, setIsMenuOpen, handleLinkClick, defaultProfileImage, guestImage, Link}) => {

    const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

    return(
        <div className="padre">
                <div className={`account-menu-contenedor ${isMenuOpen ? 'open' : 'closed'}`}>
                  {isMenuOpen && (
                    <div className="account-menu.open">
                      {isAuthenticated ? (
                        <>
                          <div className="dropdown-item profile-container">
                          <a onClick={() => handleLinkClick(`/perfil/${user.name.replace(/\s+/g, '-')}`)} href="#">
                          
                            <span className="usuario-nombre"><img
                              src={isAuthenticated ? (user?.picture || defaultProfileImage) : guestImage}
                              alt="Profile"
                              className="cuenta-icon perfil-imagen"
                            /></span>
                            <span className="usuario-nombre">
                              {user.name}
                            </span>
                            </a>
                            </div>
                          
                          <div className="account-dropdown-item" onClick={handleLogin}>

                            Tienes 0 Laborys en tu Cartera<br />
                            Tienes 0 Ciudadan Investment Tokens <br />
                            Acumulado Mensual de Rendimientos

                          </div>
                          
                          <div className="account-dropdown-item" onClick={handleLogin}>

                            Adquirir Membresía <br />
                            No cuentas con una membresía

                          </div>
                          
                          <div className="account-dropdown-item" onClick={handleLogin}>

                           Configuración de tu Cuenta

                          </div>
                          
                          <div className="account-dropdown-item" onClick={handleLogin}>

                           Tu Dashboard

                          </div>
                          
                          <div className="account-dropdown-item" onClick={handleLogin}>

                           Publia Publicidad

                          </div>
                          


                          <div className="account-dropdown-item" onClick={handleLogout}>Salir</div>
                        </>
                      ) : (
                        <>
                          <div className="account-dropdown-item" onClick={handleLogin}>Acceder</div>
                          <Link to="/ayuda" className="dropdown-item">Ayuda</Link>
                          <div className="account-dropdown-item" onClick={handleLogin}>Iniciar sesión</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
    )};

export default UserMenu;

