import React, { useEffect } from 'react';
import { useAuth } from './Contexts/AuthContext';
import registerUser from './utils/registerUser';

const App = () => {
  const { user, setUser } = useAuth();

  useEffect(() => {
    const testRegister = async () => {
      const userData = {
        username: 'aabbbtestuser',
        email: 'caaatestuser@example.com',
        password: 'testpassword',
      };

      const result = await registerUser(userData);
      console.log('Resultado del registro:', result);
      if (result && result.user) {
        setUser(result.user);
      }
    };

    testRegister();
  }, [setUser]);

  return (
    <div>
      <h1>Prueba de Registro de Usuario</h1>
      <p>{user ? `Usuario: ${user.username}` : 'No hay usuario'}</p>
    </div>
  );
};

export default App;
