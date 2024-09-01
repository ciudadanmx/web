import React, { useEffect, useState } from 'react';
import { useAuth } from './Contexts/AuthContext';
import registerUser from './utils/registerUser';
import NavBar from './components/NavBar';

const App = () => {
  const { user, setUser } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const testRegister = async () => {
      const userData = {
        username: 'aaasfdasfdsafsaaabbbtestuser',
        email: 'aaaasdffsdadfsacaaatestuser@example.com',
        password: 'testpassword',
      };

      const result = await registerUser(userData);
      console.log('Resultado del registro:', result);
      if (result && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
    };

    testRegister();
  }, [setUser]);

  const handleLogin = () => {
    // Lógica para iniciar sesión (o redirigir al usuario a la página de inicio de sesión)
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Lógica para cerrar sesión
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <div>
      <NavBar
        isAuthenticated={isAuthenticated}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <h1>Prueba de Registro de Usuario</h1>
      <p>{user ? `Usuario: ${user.username}` : 'No hay usuario'}</p>
    </div>
  );
};

export default App;
